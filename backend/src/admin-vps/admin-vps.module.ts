import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module.js';
import { AdminVpsController } from './admin-vps.controller.js';
import { AdminVpsService } from './admin-vps.service.js';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminVpsController],
  providers: [AdminVpsService],
})
export class AdminVpsModule {}
