import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalCustomers,
      totalVps,
      activeVps,
      pendingVps,
      totalAdmins,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
      this.prisma.vPSInstance.count(),
      this.prisma.vPSInstance.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.vPSInstance.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.admin.count(),
    ]);

    return {
      totalCustomers,
      totalVps,
      activeVps,
      pendingVps,
      totalAdmins,
    };
  }
}
