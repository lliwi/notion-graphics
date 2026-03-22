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
    config: ChartConfig,
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

    if (config.radar_label_field && config.radar_axes?.length) {
      return this.buildRadarResult(allResults, config);
    }

    // Resolve y fields: use y_fields if provided, otherwise fall back to y_field
    const yFields =
      config.y_fields?.length
        ? config.y_fields
        : config.y_field
          ? [config.y_field]
          : [];

    const pages = allResults.filter((r: any) => r.object === 'page');

    // Build one dataset per y field
    const datasets: Array<{ label: string; data: number[] }> = [];
    let labels: string[] = [];

    for (let i = 0; i < yFields.length; i++) {
      const yField = yFields[i];
      const agg = config.aggregations?.[i] ?? config.aggregation;

      const rows = pages
        .map((page: any) => ({
          x: this.extractValue(page.properties[config.x_field ?? '']),
          y: this.extractValue(page.properties[yField ?? '']),
        }))
        .filter((row) => row.x !== null);

      const result = this.aggregate(rows, agg, yField);
      labels = result.labels;
      datasets.push(...result.datasets);
    }

    return { labels, datasets };
  }

  private buildRadarResult(
    allResults: any[],
    config: ChartConfig,
  ): ChartDataResult {
    const axes = config.radar_axes!;
    const labelField = config.radar_label_field!;

    const datasets = allResults
      .filter((r: any) => r.object === 'page')
      .map((page: any) => {
        const seriesName = String(
          this.extractValue(page.properties[labelField]) ?? 'Unknown',
        );
        const values = axes.map((axis) =>
          Number(this.extractValue(page.properties[axis]) ?? 0),
        );
        return { label: seriesName, data: values };
      })
      .filter((ds) => ds.label !== '' && ds.label !== 'Unknown');

    return { labels: axes, datasets };
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
    aggregation: string,
    yField = 'Value',
  ): ChartDataResult {
    if (aggregation === 'none') {
      return {
        labels: rows.map((r) => String(r.x ?? '')),
        datasets: [{ label: yField, data: rows.map((r) => Number(r.y ?? 0)) }],
      };
    }

    const grouped = new Map<string, number[]>();
    const groupedRaw = new Map<string, (string | number | null)[]>();
    for (const row of rows) {
      const key = String(row.x ?? '');
      const val = Number(row.y ?? 0);
      if (!grouped.has(key)) {
        grouped.set(key, []);
        groupedRaw.set(key, []);
      }
      grouped.get(key)!.push(val);
      groupedRaw.get(key)!.push(row.y);
    }

    const labels: string[] = [];
    const data: number[] = [];

    // For percent: compute grand total first
    let grandTotal = 0;
    if (aggregation === 'percent') {
      for (const values of grouped.values()) {
        grandTotal += values.reduce((a, b) => a + b, 0);
      }
    }

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
        case 'min':
          data.push(Math.min(...values));
          break;
        case 'max':
          data.push(Math.max(...values));
          break;
        case 'median': {
          const sorted = [...values].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          data.push(
            sorted.length % 2 === 0
              ? (sorted[mid - 1] + sorted[mid]) / 2
              : sorted[mid],
          );
          break;
        }
        case 'count_unique': {
          const rawValues = groupedRaw.get(key)!;
          data.push(new Set(rawValues.map(String)).size);
          break;
        }
        case 'percent': {
          const groupSum = values.reduce((a, b) => a + b, 0);
          data.push(grandTotal === 0 ? 0 : (groupSum / grandTotal) * 100);
          break;
        }
        case 'range':
          data.push(Math.max(...values) - Math.min(...values));
          break;
        default:
          data.push(values.reduce((a, b) => a + b, 0));
          break;
      }
    }

    return { labels, datasets: [{ label: yField, data }] };
  }
}
