import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AdminAuthController } from './admin-auth.controller.js';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminAuthGuard } from './admin-auth.guard.js';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('ADMIN_JWT_SECRET');

        if (!secret) {
          throw new Error('ADMIN_JWT_SECRET is missing');
        }

        return {
          secret,
          signOptions: {
            expiresIn: '8h',
          },
        };
      },
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminAuthGuard],
  exports: [AdminAuthGuard, JwtModule],
})
export class AdminAuthModule {}
