import { Module } from '@nestjs/common';
import { VpsService } from './vps.service.js';
import { VpsController } from './vps.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VpsController],
  providers: [VpsService],
})
export class VpsModule {}