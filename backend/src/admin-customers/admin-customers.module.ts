import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module.js';
import { AdminCustomersController } from './admin-customers.controller.js';
import { AdminCustomersService } from './admin-customers.service.js';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminCustomersController],
  providers: [AdminCustomersService],
})
export class AdminCustomersModule {}
