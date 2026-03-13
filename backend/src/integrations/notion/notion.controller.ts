import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { RequestUser } from '../../auth/strategies/jwt.strategy';
import { NotionService } from './notion.service';

@Controller('integrations/notion')
export class NotionController {
  constructor(private readonly notionService: NotionService) {}

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

  @UseGuards(JwtAuthGuard)
  @Delete('disconnect')
  disconnect(@CurrentUser() user: RequestUser) {
    return this.notionService.disconnect(user.userId);
  }
}
