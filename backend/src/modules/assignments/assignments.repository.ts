import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const MAX_CUSTOMERS_PER_USER = 5;

@Injectable()
export class AssignmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async assignCustomer(
    userId: string,
    customerId: string,
    organizationId: string,
  ) {
    // Check already assigned
    const existing = await this.prisma.customerAssignment.findUnique({
      where: {
        userId_customerId: { userId, customerId },
      },
    });
    if (existing)
      throw new ConflictException('Customer already assigned to this user');

    // Concurrency-safe assignment using transaction + raw SQL lock
    return await this.prisma.$transaction(async (tx) => {
      // Lock assignment rows first (PostgreSQL forbids COUNT(*) ... FOR UPDATE in one query)
      const result = await tx.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::bigint AS count
          FROM (
            SELECT ca.id
            FROM "CustomerAssignment" ca
            INNER JOIN "Customer" c ON c.id = ca."customerId"
            WHERE ca."userId" = ${userId}
              AND c."deletedAt" IS NULL
              AND c."organizationId" = ${organizationId}
            FOR UPDATE OF ca
          ) AS locked
        `;

      const currentCount = Number(result[0].count);

      if (currentCount >= MAX_CUSTOMERS_PER_USER) {
        throw new BadRequestException(
          `User already has ${MAX_CUSTOMERS_PER_USER} active customers assigned`,
        );
      }

      // Safe to assign now
      const assignment = await tx.customerAssignment.create({
        data: { userId, customerId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          customer: {
            select: { id: true, name: true, email: true, status: true },
          },
        },
      });

      return assignment;
    });
  }

  async unassignCustomer(userId: string, customerId: string) {
    const existing = await this.prisma.customerAssignment.findUnique({
      where: {
        userId_customerId: { userId, customerId },
      },
    });

    if (!existing) {
      throw new ConflictException('Assignment does not exist');
    }

    await this.prisma.customerAssignment.delete({
      where: {
        userId_customerId: { userId, customerId },
      },
    });

    return { message: 'Customer unassigned successfully' };
  }

  async getUserAssignments(userId: string, organizationId: string) {
    return this.prisma.customerAssignment.findMany({
      where: {
        userId,
        customer: {
          organizationId,
          deletedAt: null,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async getCustomerAssignments(customerId: string) {
    return this.prisma.customerAssignment.findMany({
      where: { customerId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async getUserAssignmentCount(userId: string, organizationId: string) {
    const result = await this.prisma.customerAssignment.count({
      where: {
        userId,
        customer: {
          organizationId,
          deletedAt: null,
        },
      },
    });

    return {
      assigned: result,
      remaining: MAX_CUSTOMERS_PER_USER - result,
      maxAllowed: MAX_CUSTOMERS_PER_USER,
    };
  }
}
