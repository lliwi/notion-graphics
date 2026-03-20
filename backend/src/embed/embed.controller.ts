import { BadRequestException, Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ChartsService } from '../charts/charts.service';
import { NotionDataService } from '../notion-data/notion-data.service';
import { generateEmbedHtml } from './embed.template';

@Controller('embed')
export class EmbedController {
  constructor(
    private readonly chartsService: ChartsService,
    private readonly notionData: NotionDataService,
    private readonly config: ConfigService,
  ) {}

  @Get('oembed')
  async oembed(@Query('url') url: string, @Res() res: Response) {
    if (!url) throw new BadRequestException('Missing url parameter');

    const backendUrl = this.config.get<string>('EMBED_BASE_URL', 'http://localhost:3000');
    const tokenMatch = url.match(/\/embed\/([a-f0-9-]+)/);
    if (!tokenMatch) throw new BadRequestException('Invalid embed URL');

    const token = tokenMatch[1];
    const chart = await this.chartsService.findByToken(token);
    const embedUrl = `${backendUrl}/embed/${token}`;

    res.json({
      version: '1.0',
      type: 'rich',
      title: chart.config_json.title || chart.name,
      provider_name: 'Notion Graphics',
      html: `<iframe src="${embedUrl}" width="600" height="400" frameborder="0" allowtransparency="true" style="border:none;background:transparent"></iframe>`,
      width: 600,
      height: 400,
    });
  }

  @Get(':token')
  async render(@Param('token') token: string, @Res() res: Response) {
    const chart = await this.chartsService.findByToken(token);
    const accessToken = await this.notionData.getAccessToken(chart.user_id);
    const chartData = await this.notionData.queryDatabase(
      accessToken,
      chart.config_json,
    );

    const backendUrl = this.config.get<string>('EMBED_BASE_URL', 'http://localhost:3000');
    const embedUrl = `${backendUrl}/embed/${token}`;
    const oembedUrl = `${backendUrl}/embed/oembed?url=${encodeURIComponent(embedUrl)}`;

    const html = generateEmbedHtml({
      chartType: chart.type,
      config: chart.config_json,
      chartData,
      oembedUrl,
      title: chart.config_json.title || chart.name,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.send(html);
  }
}
