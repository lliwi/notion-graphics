import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '@notionhq/client';
import { NotionIntegration } from '../integrations/notion/entities/notion-integration.entity';
import type { ChartConfig } from '../charts/entities/chart.entity';

export interface ChartDataResult {
  labels: string[];
  datasets: Array<{ label: string; data: number[] }>;
}

@Injectable()
export class NotionDataService {
  constructor(
    @InjectRepository(NotionIntegration)
    private readonly integrationRepo: Repository<NotionIntegration>,
  ) {}

  async getAccessToken(userId: string): Promise<string> {
    const integration = await this.integrationRepo.findOne({
      where: { user_id: userId },
    });
    if (!integration) {
      throw new BadRequestException('Notion not connected for this user');
    }
    return integration.access_token;
  }

  async queryDatabase(
    accessToken: string,
    config: Pick<
      ChartConfig,
      'database_id' | 'x_field' | 'y_field' | 'aggregation'
    >,
  ): Promise<ChartDataResult> {
    const notion = new Client({ auth: accessToken });

    // Paginate through all results
    let allResults: any[] = [];
    let cursor: string | undefined = undefined;
    do {
      const response = await notion.databases.query({
        database_id: config.database_id,
        start_cursor: cursor,
        page_size: 100,
      });
      allResults = allResults.concat(response.results);
      cursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (cursor);

    const rows = allResults
      .filter((r: any) => r.object === 'page')
      .map((page: any) => ({
        x: this.extractValue(page.properties[config.x_field]),
        y: this.extractValue(page.properties[config.y_field]),
      }))
      .filter((row) => row.x !== null);

    return this.aggregate(rows, config.aggregation);
  }

  private extractValue(prop: any): string | number | null {
    if (!prop) return null;
    switch (prop.type) {
      case 'title':
        return prop.title?.[0]?.plain_text ?? null;
      case 'rich_text':
        return prop.rich_text?.[0]?.plain_text ?? null;
      case 'number':
        return prop.number ?? null;
      case 'select':
        return prop.select?.name ?? null;
      case 'multi_select':
        return prop.multi_select?.map((s: any) => s.name).join(', ') ?? null;
      case 'date':
        return prop.date?.start ?? null;
      case 'checkbox':
        return prop.checkbox ? 1 : 0;
      case 'formula':
        if (prop.formula?.type === 'number') return prop.formula.number ?? null;
        if (prop.formula?.type === 'string') return prop.formula.string ?? null;
        return null;
      default:
        return null;
    }
  }

  private aggregate(
    rows: Array<{ x: string | number | null; y: string | number | null }>,
    aggregation: 'sum' | 'count' | 'avg' | 'none',
  ): ChartDataResult {
    if (aggregation === 'none') {
      return {
        labels: rows.map((r) => String(r.x ?? '')),
        datasets: [{ label: 'Value', data: rows.map((r) => Number(r.y ?? 0)) }],
      };
    }

    const grouped = new Map<string, number[]>();
    for (const row of rows) {
      const key = String(row.x ?? '');
      const val = Number(row.y ?? 0);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(val);
    }

    const labels: string[] = [];
    const data: number[] = [];

    for (const [key, values] of grouped.entries()) {
      labels.push(key);
      switch (aggregation) {
        case 'sum':
          data.push(values.reduce((a, b) => a + b, 0));
          break;
        case 'count':
          data.push(values.length);
          break;
        case 'avg':
          data.push(values.reduce((a, b) => a + b, 0) / values.length);
          break;
      }
    }

    return { labels, datasets: [{ label: 'Value', data }] };
  }
}
