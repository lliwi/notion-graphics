import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { RequestUser } from '../../auth/strategies/jwt.strategy';
import { NotionService } from './notion.service';
import { NotionDataService } from '../../notion-data/notion-data.service';
import type { NotionFilter } from '../../charts/entities/chart.entity';

@Controller('integrations/notion')
export class NotionController {
  constructor(
    private readonly notionService: NotionService,
    private readonly notionData: NotionDataService,
  ) {}

  @Get('login')
  login(@Res() res: Response) {
    const url = this.notionService.getLoginUrl();
    return res.redirect(url);
  }

  @UseGuards(JwtAuthGuard)
  @Get('connect')
  connect(@CurrentUser() user: RequestUser, @Res() res: Response) {
    const url = this.notionService.getOAuthUrl(user.userId);
    return res.redirect(url);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const { redirectUrl } = await this.notionService.handleCallback(
      code,
      state,
    );
    return res.redirect(redirectUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('databases')
  getDatabases(@CurrentUser() user: RequestUser) {
    return this.notionService.getDatabases(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('databases/:id/properties')
  getDatabaseProperties(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.notionService.getDatabaseProperties(user.userId, id);
  }

  /**
   * Get select/multi_select options for a specific property.
   * Useful for building filter dropdowns in the frontend.
   */
  @UseGuards(JwtAuthGuard)
  @Get('databases/:id/properties/:propertyName/options')
  getPropertyOptions(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('propertyName') propertyName: string,
  ) {
    return this.notionService.getPropertyOptions(user.userId, id, propertyName);
  }

  /**
   * Preview raw data from a Notion database with optional filters and sorts.
   * Useful for exploring data before creating a chart.
   */
  @UseGuards(JwtAuthGuard)
  @Post('databases/:id/preview')
  async previewData(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { filters?: NotionFilter[]; sorts?: Array<{ property: string; direction: 'ascending' | 'descending' }>; limit?: number },
  ) {
    const accessToken = await this.notionData.getAccessToken(user.userId);
    return this.notionData.queryRawData(
      accessToken,
      id,
      body.filters,
      body.sorts,
      body.limit ?? 50,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('disconnect')
  disconnect(@CurrentUser() user: RequestUser) {
    return this.notionService.disconnect(user.userId);
  }
}
