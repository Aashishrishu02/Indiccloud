
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AdminAuthService } from './admin-auth.service.js';
import { AdminAuthGuard } from './admin-auth.guard.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
  ) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  @Get('profile')
  @UseGuards(AdminAuthGuard)
  async getProfile(@Req() req: any) {
    return this.adminAuthService.getProfile(req.admin.id);
  }
}
