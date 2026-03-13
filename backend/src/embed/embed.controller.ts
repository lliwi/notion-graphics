import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChartsService } from '../charts/charts.service';
import { NotionDataService } from '../notion-data/notion-data.service';
import { generateEmbedHtml } from './embed.template';

@Controller('embed')
export class EmbedController {
  constructor(
    private readonly chartsService: ChartsService,
    private readonly notionData: NotionDataService,
  ) {}

  @Get(':token')
  async render(@Param('token') token: string, @Res() res: Response) {
    const chart = await this.chartsService.findByToken(token);
    const accessToken = await this.notionData.getAccessToken(chart.user_id);
    const chartData = await this.notionData.queryDatabase(
      accessToken,
      chart.config_json,
    );

    const html = generateEmbedHtml({
      chartType: chart.type,
      config: chart.config_json,
      chartData,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.send(html);
  }
}
