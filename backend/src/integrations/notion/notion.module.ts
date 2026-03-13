import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotionIntegration } from './entities/notion-integration.entity';
import { NotionController } from './notion.controller';
import { NotionService } from './notion.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([NotionIntegration]), AuthModule],
  controllers: [NotionController],
  providers: [NotionService],
})
export class NotionModule {}
