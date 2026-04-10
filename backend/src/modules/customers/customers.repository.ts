import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, organizationId: string) {
    return this.prisma.customer.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async findAllPaginated(organizationId: string, pagination: PaginationDto) {
    const { page = 1, limit = 10, search, status } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CustomerWhereInput = {
      organizationId,
      deletedAt: null, // Soft delete filter
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Run count and data queries in parallel — performance optimization
    const [total, customers] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          assignments: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.customer.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  async update(id: string, dto: UpdateCustomerDto, organizationId: string) {
    const result = await this.prisma.customer.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: dto,
    });
    if (result.count === 0) return null;
    return this.prisma.customer.findUnique({ where: { id } });
  }

  async softDelete(id: string, organizationId: string) {
    const result = await this.prisma.customer.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) return null;
    return this.prisma.customer.findUnique({ where: { id } });
  }

  async restore(id: string, organizationId: string) {
    const result = await this.prisma.customer.updateMany({
      where: { id, organizationId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    if (result.count === 0) return null;
    return this.prisma.customer.findUnique({ where: { id } });
  }

  async findDeleted(organizationId: string) {
    return this.prisma.customer.findMany({
      where: {
        organizationId,
        deletedAt: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        deletedAt: true,
      },
      orderBy: { deletedAt: 'desc' },
    });
  }
}
