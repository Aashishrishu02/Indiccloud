
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Admin token is required');
    }

    const token = authHeader.slice(7);
    const secret = this.configService.get<string>('ADMIN_JWT_SECRET');

    if (!secret) {
      throw new UnauthorizedException(
        'Admin authentication configuration error',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, { secret });

      if (!payload.sub || payload.type !== 'admin') {
        throw new UnauthorizedException('Invalid admin token');
      }

      const admin = await this.prisma.admin.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
        },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Admin account is inactive');
      }

      request.admin = admin;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired admin token');
    }
  }
}
