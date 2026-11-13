import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard.js';
import { AdminDashboardService } from './admin-dashboard.service.js';

@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard)
export class AdminDashboardController {
  constructor(
    private readonly adminDashboardService: AdminDashboardService,
  ) {}

  @Get('stats')
  async getStats() {
    return this.adminDashboardService.getStats();
  }
}
