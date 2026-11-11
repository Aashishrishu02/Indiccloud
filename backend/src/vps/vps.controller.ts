
import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request } from 'express';
import { VpsService } from './vps.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('vps')
@UseGuards(JwtAuthGuard)
export class VpsController {
  constructor(
    private readonly vpsService: VpsService,
    private readonly prisma: PrismaService,
  ) {}

  // Get logged-in user's VPS list
  @Get()
  async getMyVps(@Req() req: AuthenticatedRequest) {
    return this.prisma.vPSInstance.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Create a demo VPS for the logged-in user
  @Post('demo/provision')
  async provisionDemoVps(@Req() req: AuthenticatedRequest) {
    if (process.env.VPS_MODE !== 'DEMO') {
      throw new ServiceUnavailableException(
        'Demo provisioning is available only in DEMO mode',
      );
    }

    // Find an unused reserved documentation IP
    let ipAddress: string | null = null;

    for (let lastOctet = 20; lastOctet <= 254; lastOctet++) {
      const candidate = `203.0.113.${lastOctet}`;

      const existing = await this.prisma.vPSInstance.findUnique({
        where: { ipAddress: candidate },
      });

      if (!existing) {
        ipAddress = candidate;
        break;
      }
    }

    if (!ipAddress) {
      throw new ServiceUnavailableException(
        'No demo VPS IP addresses are available',
      );
    }

    const ram = 4;
    const operatingSystem = 'Ubuntu 22.04';

    // Register the VPS in the demo service
    await this.vpsService.buy(ipAddress, ram);

    // Persist the VPS for this user
    const vps = await this.prisma.vPSInstance.create({
      data: {
        userId: req.user.sub,
        provider: 'SMARTVPS',
        ipAddress,
        hostname: `demo-${ipAddress.replaceAll('.', '-')}`,
        operatingSystem,
        ram,
        status: 'RUNNING',
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return {
      message: 'Demo VPS provisioned successfully',
      demo: true,
      vps,
    };
  }

  // Get VPS status
  @Get(':id/status')
  async getStatus(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const vps = await this.findOwnedVps(id, req.user.sub);
    const result = await this.vpsService.getStatus(vps.ipAddress);

    return result;
  }

  // Start VPS
  @Post(':id/start')
  async startVps(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const vps = await this.findOwnedVps(id, req.user.sub);
    const result = await this.vpsService.start(vps.ipAddress);

    await this.prisma.vPSInstance.update({
      where: { id: vps.id },
      data: { status: 'RUNNING' },
    });

    return {
      message: 'VPS started successfully',
      result,
    };
  }

  // Stop VPS
  @Post(':id/stop')
  async stopVps(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const vps = await this.findOwnedVps(id, req.user.sub);
    const result = await this.vpsService.stop(vps.ipAddress);

    await this.prisma.vPSInstance.update({
      where: { id: vps.id },
      data: { status: 'STOPPED' },
    });

    return {
      message: 'VPS stopped successfully',
      result,
    };
  }

  // Verify VPS ownership
  private async findOwnedVps(id: string, userId: string) {
    const vps = await this.prisma.vPSInstance.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!vps) {
      throw new NotFoundException('VPS not found');
    }

    return vps;
  }
}
