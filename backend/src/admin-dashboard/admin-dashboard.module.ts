import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AdminAuthModule } from '../admin-auth/admin-auth.module.js';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
