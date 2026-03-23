import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Client } from '@notionhq/client';
import { NotionIntegration } from './entities/notion-integration.entity';
import { UsersService } from '../../users/users.service';

interface NotionOAuthState {
  sub: string;
  userId?: string;
  iat: number;
  exp: number;
}

@Injectable()
export class NotionService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectRepository(NotionIntegration)
    private readonly integrationRepo: Repository<NotionIntegration>,
  ) {}

  getLoginUrl(): string {
    const state = this.jwtService.sign(
      { sub: 'notion_login_state' },
      { expiresIn: '10m' },
    );

    const params = new URLSearchParams({
      client_id: this.config.get<string>('NOTION_CLIENT_ID')!,
      redirect_uri: this.config.get<string>('NOTION_REDIRECT_URI')!,
      response_type: 'code',
      owner: 'user',
      state,
    });

    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
  }

  getOAuthUrl(userId: string): string {
    const state = this.jwtService.sign(
      { userId, sub: 'notion_oauth_state' },
      { expiresIn: '10m' },
    );

    const params = new URLSearchParams({
      client_id: this.config.get<string>('NOTION_CLIENT_ID')!,
      redirect_uri: this.config.get<string>('NOTION_REDIRECT_URI')!,
      response_type: 'code',
      owner: 'user',
      state,
    });

    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ redirectUrl: string }> {
    let payload: NotionOAuthState;
    try {
      payload = this.jwtService.verify<NotionOAuthState>(state);
    } catch {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    if (payload.sub === 'notion_login_state') {
      return this.handleLoginCallback(code);
    }

    if (payload.sub !== 'notion_oauth_state') {
      throw new UnauthorizedException('Invalid OAuth state token');
    }

    const clientId = this.config.get<string>('NOTION_CLIENT_ID')!;
    const clientSecret = this.config.get<string>('NOTION_CLIENT_SECRET')!;
    const redirectUri = this.config.get<string>('NOTION_REDIRECT_URI')!;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Notion OAuth failed: ${error}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      workspace_id: string;
      workspace_name: string;
      bot_id: string;
    };

    await this.integrationRepo.upsert(
      {
        user_id: payload.userId,
        access_token: data.access_token,
        workspace_id: data.workspace_id ?? null,
        workspace_name: data.workspace_name ?? null,
        bot_id: data.bot_id ?? null,
      },
      { conflictPaths: ['user_id'] },
    );

    const appBaseUrl = this.config.get<string>('APP_BASE_URL', 'http://localhost:3001').split(',')[0].trim();
    return { redirectUrl: `${appBaseUrl}/dashboard` };
  }

  private async handleLoginCallback(code: string): Promise<{ redirectUrl: string }> {
    const clientId = this.config.get<string>('NOTION_CLIENT_ID')!;
    const clientSecret = this.config.get<string>('NOTION_CLIENT_SECRET')!;
    const redirectUri = this.config.get<string>('NOTION_REDIRECT_URI')!;
    const appBaseUrl = this.config.get<string>('APP_BASE_URL', 'http://localhost:3001').split(',')[0].trim();

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Notion OAuth failed: ${error}`);
    }

    const data = (await response.json()) as any;

    const email = data.owner?.user?.person?.email as string | undefined;
    const name = data.owner?.user?.name as string | undefined;

    if (!email) {
      throw new BadRequestException('No se pudo obtener el email de tu cuenta de Notion');
    }

    let user = await this.usersService.findByEmail(email);
    if (!user) {
      const password_hash = await bcrypt.hash(Math.random().toString(36), 12);
      user = await this.usersService.create({ name: name ?? null, email, password_hash });
    }

    if (user.status === 'BANNED') {
      throw new BadRequestException('Tu cuenta ha sido bloqueada');
    }
    if (user.status === 'INACTIVE') {
      throw new BadRequestException('Tu cuenta está desactivada');
    }

    await this.integrationRepo.upsert(
      {
        user_id: user.id,
        access_token: data.access_token,
        workspace_id: data.workspace_id ?? null,
        workspace_name: data.workspace_name ?? null,
        bot_id: data.bot_id ?? null,
      },
      { conflictPaths: ['user_id'] },
    );

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return { redirectUrl: `${appBaseUrl}/auth/callback?token=${token}` };
  }

  async getDatabases(userId: string) {
    const integration = await this.integrationRepo.findOne({
      where: { user_id: userId },
    });

    if (!integration) {
      throw new BadRequestException('Notion not connected');
    }

    const notion = new Client({ auth: integration.access_token });
    const response = await notion.search({
      filter: { property: 'object', value: 'database' },
      page_size: 100,
    });

    return response.results.map((db: any) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text ?? 'Untitled',
      url: db.url,
      last_edited_time: db.last_edited_time,
    }));
  }

  async getDatabaseProperties(
    userId: string,
    databaseId: string,
  ): Promise<Array<{ name: string; type: string }>> {
    const integration = await this.integrationRepo.findOne({
      where: { user_id: userId },
    });
    if (!integration) {
      throw new BadRequestException('Notion not connected');
    }
    const notion = new Client({ auth: integration.access_token });
    const db = await notion.databases.retrieve({ database_id: databaseId });
    return Object.entries((db as any).properties).map(
      ([name, prop]: [string, any]) => ({ name, type: prop.type as string }),
    );
  }

  async getPropertyOptions(
    userId: string,
    databaseId: string,
    propertyName: string,
  ): Promise<{ name: string; type: string; options: Array<{ name: string; color?: string }> }> {
    const integration = await this.integrationRepo.findOne({
      where: { user_id: userId },
    });
    if (!integration) {
      throw new BadRequestException('Notion not connected');
    }
    const notion = new Client({ auth: integration.access_token });
    const db = await notion.databases.retrieve({ database_id: databaseId });
    const prop = (db as any).properties[propertyName];
    if (!prop) {
      throw new BadRequestException(`Property "${propertyName}" not found`);
    }

    let options: Array<{ name: string; color?: string }> = [];
    if (prop.type === 'select' && prop.select?.options) {
      options = prop.select.options.map((o: any) => ({ name: o.name, color: o.color }));
    } else if (prop.type === 'multi_select' && prop.multi_select?.options) {
      options = prop.multi_select.options.map((o: any) => ({ name: o.name, color: o.color }));
    } else if (prop.type === 'status' && prop.status?.options) {
      options = prop.status.options.map((o: any) => ({ name: o.name, color: o.color }));
    }

    return { name: propertyName, type: prop.type, options };
  }

  async disconnect(userId: string): Promise<{ message: string }> {
    await this.integrationRepo.delete({ user_id: userId });
    return { message: 'Notion disconnected' };
  }
}
