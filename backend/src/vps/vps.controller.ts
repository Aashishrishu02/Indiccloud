
import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  Body,
  UseGuards,
  NotFoundException,
  ServiceUnavailableException,
  BadRequestException,
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

  // Get logged-in customer's VPS list
  @Get()
  async getMyVps(@Req() req: AuthenticatedRequest) {
    return this.prisma.vPSInstance.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get available provider IP stock
  @Get('ip-stock')
  async getIpStock() {
    return this.vpsService.getIpStock();
  }

  // Get OS templates for an owned VPS
  @Get(':id/templates')
  async getOsTemplates(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const vps = await this.findOwnedVps(id, req.user.sub);
    return this.vpsService.getOsTemplate(vps.ipAddress);
  }

  // Purchase VPS using provider's available IP
  @Post('purchase')
  async purchaseVps(
    @Body() body: { ip: string; ram: number },
    @Req() req: AuthenticatedRequest,
  ) {
    const ip = body.ip?.trim();
    const ram = Number(body.ram);

    if (!ip || !Number.isInteger(ram) || ram <= 0) {
      throw new BadRequestException('Valid IP and RAM are required');
    }

    const existing = await this.prisma.vPSInstance.findUnique({
      where: { ipAddress: ip },
    });

    if (existing) {
      throw new BadRequestException('This IP is already registered');
    }

    // Call actual provider before saving the VPS
    const providerResult = await this.vpsService.buy(ip, ram);

    const vps = await this.prisma.vPSInstance.create({
      data: {
        userId: req.user.sub,
        provider: 'SMARTVPS',
        ipAddress: ip,
        hostname: `vps-${ip.replaceAll('.', '-')}`,
        operatingSystem: 'Ubuntu',
        ram,
        status: 'PENDING',
      },
    });

    return {
      message: 'VPS purchase request submitted',
      providerResult,
      vps,
    };
  }

  // Demo provisioning (DEMO mode only)
  @Post('demo/provision')
  async provisionDemoVps(@Req() req: AuthenticatedRequest) {
    if ((process.env.VPS_MODE || 'DEMO').toUpperCase() !== 'DEMO') {
      throw new ServiceUnavailableException(
        'Demo provisioning is available only in DEMO mode',
      );
    }

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

    await this.vpsService.buy(ipAddress, ram);

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
    return this.vpsService.getStatus(vps.ipAddress);
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

    return { message: 'VPS start request submitted', result };
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

    return { message: 'VPS stop request submitted', result };
  }

  // Change operating system
  @Post(':id/change-os')
  async changeOs(
    @Param('id') id: string,
    @Body() body: { os: string },
    @Req() req: AuthenticatedRequest,
  ) {
    if (!body.os?.trim()) {
      throw new BadRequestException('Operating system is required');
    }

    const vps = await this.findOwnedVps(id, req.user.sub);
    const result = await this.vpsService.changeOs(
      vps.ipAddress,
      body.os,
    );

    await this.prisma.vPSInstance.update({
      where: { id: vps.id },
      data: { operatingSystem: body.os },
    });

    return { message: 'OS change request submitted', result };
  }

  // Renew VPS
  @Post(':id/renew')
  async renewVps(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const vps = await this.findOwnedVps(id, req.user.sub);
    const result = await this.vpsService.renew(vps.ipAddress);

    return {
      message: 'VPS renewal request submitted',
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
