import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chart } from './entities/chart.entity';
import { ChartsController } from './charts.controller';
import { ChartsService } from './charts.service';
import { NotionDataService } from '../notion-data/notion-data.service';
import { NotionIntegration } from '../integrations/notion/entities/notion-integration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chart, NotionIntegration])],
  controllers: [ChartsController],
  providers: [ChartsService, NotionDataService],
  exports: [ChartsService, NotionDataService],
})
export class ChartsModule {}
