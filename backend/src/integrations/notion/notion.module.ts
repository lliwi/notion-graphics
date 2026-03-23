import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotionIntegration } from './entities/notion-integration.entity';
import { NotionController } from './notion.controller';
import { NotionService } from './notion.service';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import { ChartsModule } from '../../charts/charts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotionIntegration]),
    AuthModule,
    UsersModule,
    forwardRef(() => ChartsModule),
  ],
  controllers: [NotionController],
  providers: [NotionService],
  exports: [NotionService],
})
export class NotionModule {}
