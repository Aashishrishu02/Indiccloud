
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { EmailModule } from './email/email.module.js';
import { VpsModule } from './vps/vps.module.js';
import { AdminAuthModule } from './admin-auth/admin-auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    EmailModule,
    VpsModule,
    AdminAuthModule,
  ],
  
})
export class AppModule {}
