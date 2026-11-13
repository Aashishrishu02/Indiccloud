import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard.js';
import { AdminVpsService } from './admin-vps.service.js';

@Controller('admin/vps')
@UseGuards(AdminAuthGuard)
export class AdminVpsController {
  constructor(
    private readonly adminVpsService: AdminVpsService,
  ) {}

  @Get('stats')
  getStats() {
    return this.adminVpsService.getStats();
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('provider') provider?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminVpsService.findAll(
      search,
      status,
      provider,
      Math.max(1, Number(page) || 1),
      Math.max(1, Number(limit) || 10),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminVpsService.findOne(id);
  }
}
