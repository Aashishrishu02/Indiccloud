import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [total, active, inactive] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({
        where: { role: 'CUSTOMER', isActive: true },
      }),
      this.prisma.user.count({
        where: { role: 'CUSTOMER', isActive: false },
      }),
    ]);

    return { total, active, inactive };
  }

  async findAll(search?: string, page = 1, limit = 10) {
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

    const where: any = {
      role: 'CUSTOMER',
      ...(search?.trim()
        ? {
            OR: [
              { name: { contains: search.trim(), mode: 'insensitive' } },
              { email: { contains: search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          emailVerifiedAt: true,
          createdAt: true,
          _count: { select: { vpsInstances: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      customers,
      pagination: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.user.findFirst({
      where: { id, role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        vpsInstances: {
          select: {
            id: true,
            provider: true,
            providerVpsId: true,
            ipAddress: true,
            hostname: true,
            operatingSystem: true,
            ram: true,
            status: true,
            expiresAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async updateStatus(id: string, isActive: boolean) {
    if (typeof isActive !== 'boolean') {
      throw new BadRequestException('isActive must be true or false');
    }

    const result = await this.prisma.user.updateMany({
      where: { id, role: 'CUSTOMER' },
      data: { isActive },
    });

    if (result.count === 0) {
      throw new NotFoundException('Customer not found');
    }

    return {
      message: `Customer ${isActive ? 'activated' : 'deactivated'} successfully`,
      id,
      isActive,
    };
  }
}
