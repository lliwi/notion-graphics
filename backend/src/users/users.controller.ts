import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.userId);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Patch('me/password')
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.userId, dto);
  }

  @Get()
  listUsers(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    return this.usersService.findAll();
  }

  @Delete('me')
  @HttpCode(204)
  deleteMe(@CurrentUser() user: any) {
    return this.usersService.deleteOwn(user.userId);
  }

  @Delete(':id')
  @HttpCode(204)
  adminDelete(@CurrentUser() requester: any, @Param('id') targetId: string) {
    if (requester.role !== 'ADMIN') throw new ForbiddenException();
    return this.usersService.adminDelete(requester.userId, targetId);
  }

  @Patch(':id')
  adminUpdate(
    @CurrentUser() requester: any,
    @Param('id') targetId: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    if (requester.role !== 'ADMIN') throw new ForbiddenException();
    return this.usersService.adminUpdate(requester.userId, targetId, dto);
  }
}
