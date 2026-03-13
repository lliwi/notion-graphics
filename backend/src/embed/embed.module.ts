import { Module } from '@nestjs/common';
import { EmbedController } from './embed.controller';
import { ChartsModule } from '../charts/charts.module';

@Module({
  imports: [ChartsModule],
  controllers: [EmbedController],
})
export class EmbedModule {}
