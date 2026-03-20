import { Module } from '@nestjs/common';
import { NotionLPController } from './notion-lp.controller';
import { AuthModule } from '../auth/auth.module';
import { ChartsModule } from '../charts/charts.module';

@Module({
  imports: [AuthModule, ChartsModule],
  controllers: [NotionLPController],
})
export class NotionLPModule {}
