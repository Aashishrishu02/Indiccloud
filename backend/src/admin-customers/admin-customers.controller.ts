import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard.js';
import { AdminCustomersService } from './admin-customers.service.js';

@Controller('admin/customers')
@UseGuards(AdminAuthGuard)
export class AdminCustomersController {
  constructor(
    private readonly adminCustomersService: AdminCustomersService,
  ) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.adminCustomersService.findAll(
      search,
      Number(page),
      Number(limit),
    );
  }

  @Get('stats')
  getStats() {
    return this.adminCustomersService.getStats();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminCustomersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminCustomersService.updateStatus(id, isActive);
  }
}
