import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminVpsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [total, running, stopped, pending, expired] =
      await Promise.all([
        this.prisma.vPSInstance.count(),
        this.prisma.vPSInstance.count({ where: { status: 'RUNNING' } }),
        this.prisma.vPSInstance.count({ where: { status: 'STOPPED' } }),
        this.prisma.vPSInstance.count({ where: { status: 'PENDING' } }),
        this.prisma.vPSInstance.count({
          where: { expiresAt: { lt: new Date() } },
        }),
      ]);

    return { total, running, stopped, pending, expired };
  }

  async findAll(
    search?: string,
    status?: string,
    provider?: string,
    page = 1,
    limit = 10,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const where: any = {};

    if (search?.trim()) {
      const term = search.trim();

      where.OR = [
        { ipAddress: { contains: term, mode: 'insensitive' } },
        { hostname: { contains: term, mode: 'insensitive' } },
        {
          user: {
            is: {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    if (status?.trim()) {
      where.status = status.trim().toUpperCase();
    }

    if (provider?.trim()) {
      where.provider = provider.trim();
    }

    const [vpsInstances, total] = await Promise.all([
      this.prisma.vPSInstance.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.vPSInstance.count({ where }),
    ]);

    return {
      vpsInstances,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findOne(id: string) {
    const vps = await this.prisma.vPSInstance.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!vps) {
      throw new NotFoundException('VPS instance not found');
    }

    return vps;
  }
}
