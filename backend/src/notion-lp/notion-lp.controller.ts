import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ChartsService } from '../charts/charts.service';

@Controller('notion-lp')
export class NotionLPController {
  // In-memory store for short-lived auth codes (code → userId, expires)
  private readonly codes = new Map<string, { userId: string; expires: number }>();

  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly chartsService: ChartsService,
  ) {}

  // Called by Notion to start the OAuth flow
  @Get('authorize')
  authorize(
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const appBaseUrl = this.config
      .get<string>('APP_BASE_URL', 'http://localhost:3001')
      .split(',')[0]
      .trim();

    const params = new URLSearchParams({
      redirect_uri: redirectUri ?? '',
      state: state ?? '',
      client_id: clientId ?? '',
    });

    return res.redirect(`${appBaseUrl}/notion-lp/authorize?${params.toString()}`);
  }

  // Called by frontend after user confirms — generates a short-lived code
  @Post('code')
  generateCode(@Body() body: { token: string; redirect_uri: string; state: string }) {
    let userId: string;
    try {
      const payload = this.jwtService.verify<{ sub: string }>(body.token);
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }

    const code = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    this.codes.set(code, { userId, expires: Date.now() + 5 * 60 * 1000 });

    const redirectUrl = new URL(body.redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (body.state) redirectUrl.searchParams.set('state', body.state);

    return { redirect_url: redirectUrl.toString() };
  }

  // Called by Notion to exchange code for access token
  @Post('token')
  @HttpCode(200)
  token(@Body() body: Record<string, string>) {
    const clientId = this.config.get<string>('NOTION_LP_CLIENT_ID');
    const clientSecret = this.config.get<string>('NOTION_LP_CLIENT_SECRET');

    if (body.client_id !== clientId || body.client_secret !== clientSecret) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    const entry = this.codes.get(body.code);
    if (!entry || entry.expires < Date.now()) {
      this.codes.delete(body.code);
      throw new BadRequestException('Invalid or expired code');
    }
    this.codes.delete(body.code);

    const accessToken = this.jwtService.sign(
      { sub: entry.userId, scope: 'notion_lp' },
      { expiresIn: '365d' },
    );

    return { access_token: accessToken, token_type: 'bearer' };
  }

  // Called by Notion to unfurl a URL — returns embed preview data
  @Post('unfurl')
  @HttpCode(200)
  async unfurl(
    @Body() body: { url: string },
    @Headers('authorization') auth: string,
  ) {
    // Verify the access token Notion sends
    try {
      const token = auth?.replace('Bearer ', '');
      this.jwtService.verify<{ scope: string }>(token);
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    const embedUrl = body.url;
    const tokenMatch = embedUrl?.match(/\/embed\/([a-f0-9-]+)/);
    if (!tokenMatch) throw new BadRequestException('Invalid embed URL');

    const chart = await this.chartsService.findByToken(tokenMatch[1]);
    const backendUrl = this.config.get<string>('EMBED_BASE_URL', 'http://localhost:3000');
    const iframeUrl = `${backendUrl}/embed/${tokenMatch[1]}`;

    return {
      title: chart.config_json.title || chart.name,
      type: 'embed',
      embed_url: iframeUrl,
      embed_type: 'iframe',
      width: 600,
      height: 400,
    };
  }

  // Called by Notion when user revokes access
  @Post('revoke')
  @HttpCode(200)
  revoke() {
    return { ok: true };
  }
}
