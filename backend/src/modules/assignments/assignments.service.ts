import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AssignmentsRepository } from './assignments.repository';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { AssignCustomerDto } from './dto/assign-customer.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly repo: AssignmentsRepository,
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async assign(
    dto: AssignCustomerDto,
    organizationId: string,
    actorId: string,
  ) {
    // Verify customer belongs to org and is not deleted
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        organizationId,
        deletedAt: null,
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    // Verify user belongs to org
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, organizationId },
    });
    if (!user) throw new NotFoundException('User not found');

    const assignment = await this.repo.assignCustomer(
      dto.userId,
      dto.customerId,
      organizationId,
    );

    await this.activityLogs.log({
      action: 'CUSTOMER_ASSIGNED',
      customerId: dto.customerId,
      userId: actorId,
      metadata: {
        assignedTo: dto.userId,
        assignedToName: user.name,
      },
    });

    return assignment;
  }

  async unassign(
    dto: AssignCustomerDto,
    organizationId: string,
    actorId: string,
  ) {
    // Verify belongs to org
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const result = await this.repo.unassignCustomer(dto.userId, dto.customerId);

    await this.activityLogs.log({
      action: 'CUSTOMER_UNASSIGNED',
      customerId: dto.customerId,
      userId: actorId,
      metadata: { unassignedFrom: dto.userId },
    });

    return result;
  }

  async getUserAssignments(userId: string, organizationId: string) {
    // Verify user belongs to org
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.repo.getUserAssignments(userId, organizationId);
  }

  async getCustomerAssignments(customerId: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    return this.repo.getCustomerAssignments(customerId);
  }

  async getUserAssignmentCount(userId: string, organizationId: string) {
    return this.repo.getUserAssignmentCount(userId, organizationId);
  }
}
