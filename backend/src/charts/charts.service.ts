import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Chart, ChartConfig } from './entities/chart.entity';
import { CreateChartDto } from './dto/create-chart.dto';
import { UpdateChartDto } from './dto/update-chart.dto';
import { NotionDataService } from '../notion-data/notion-data.service';

@Injectable()
export class ChartsService {
  constructor(
    @InjectRepository(Chart)
    private readonly chartRepo: Repository<Chart>,
    private readonly notionData: NotionDataService,
  ) {}

  findAll(userId: string): Promise<Chart[]> {
    return this.chartRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Chart> {
    const chart = await this.chartRepo.findOne({ where: { id } });
    if (!chart) throw new NotFoundException('Chart not found');
    if (chart.user_id !== userId) throw new ForbiddenException();
    return chart;
  }

  create(userId: string, dto: CreateChartDto): Promise<Chart> {
    const chart = this.chartRepo.create({
      user_id: userId,
      name: dto.name,
      type: dto.type,
      config_json: dto.config_json as ChartConfig,
      embed_token: null,
      published: false,
    });
    return this.chartRepo.save(chart);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateChartDto,
  ): Promise<Chart> {
    const chart = await this.findOne(id, userId);
    if (dto.name) chart.name = dto.name;
    if (dto.type) chart.type = dto.type;
    if (dto.config_json) chart.config_json = dto.config_json as any;
    return this.chartRepo.save(chart);
  }

  async remove(id: string, userId: string): Promise<void> {
    const chart = await this.findOne(id, userId);
    await this.chartRepo.remove(chart);
  }

  async publish(id: string, userId: string): Promise<Chart> {
    const chart = await this.findOne(id, userId);
    chart.published = true;
    chart.embed_token = chart.embed_token ?? uuidv4();
    return this.chartRepo.save(chart);
  }

  async unpublish(id: string, userId: string): Promise<Chart> {
    const chart = await this.findOne(id, userId);
    chart.published = false;
    return this.chartRepo.save(chart);
  }

  async getData(id: string, userId: string) {
    const chart = await this.findOne(id, userId);
    const accessToken = await this.notionData.getAccessToken(userId);
    return this.notionData.queryDatabase(accessToken, chart.config_json);
  }

  async findByToken(token: string): Promise<Chart> {
    const chart = await this.chartRepo.findOne({
      where: { embed_token: token, published: true },
    });
    if (!chart) throw new NotFoundException('Chart not found or not published');
    return chart;
  }
}
