import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
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

    // Serialize per user: locking only assignment rows misses the "zero rows" case,
    // so concurrent requests could all pass the count check. Lock the User row first.
    return await this.prisma.$transaction(
      async (tx) => {
        const userLock = await tx.$queryRaw<{ x: number }[]>`
        SELECT 1 AS x
        FROM "User" u
        WHERE u.id = ${userId} AND u."organizationId" = ${organizationId}
        FOR UPDATE
      `;
        if (userLock.length === 0) {
          throw new NotFoundException('User not found');
        }

        const currentCount = await tx.customerAssignment.count({
          where: {
            userId,
            customer: {
              organizationId,
              deletedAt: null,
            },
          },
        });

        if (currentCount >= MAX_CUSTOMERS_PER_USER) {
          throw new BadRequestException(
            `User already has ${MAX_CUSTOMERS_PER_USER} active customers assigned`,
          );
        }

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
      },
      {
        // Many parallel assigns for the same user queue on the User row lock; default 5s
        // interactive timeout surfaces as 500 before the 6th can return 400.
        maxWait: 15_000,
        timeout: 60_000,
      },
    );
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
