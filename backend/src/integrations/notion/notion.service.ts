import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '@notionhq/client';
import { NotionIntegration } from './entities/notion-integration.entity';

interface NotionOAuthState {
  sub: string;
  userId: string;
  iat: number;
  exp: number;
}

@Injectable()
export class NotionService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(NotionIntegration)
    private readonly integrationRepo: Repository<NotionIntegration>,
  ) {}

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

    const appBaseUrl = this.config.get<string>('APP_BASE_URL')!;
    return { redirectUrl: `${appBaseUrl}/dashboard` };
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

  async disconnect(userId: string): Promise<{ message: string }> {
    await this.integrationRepo.delete({ user_id: userId });
    return { message: 'Notion disconnected' };
  }
}
