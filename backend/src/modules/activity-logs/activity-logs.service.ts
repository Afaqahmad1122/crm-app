import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type {
  ActivityLogPayload,
  IActivityLogsService,
} from './activity-logs.types';

@Injectable()
export class ActivityLogsService implements IActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(dto: ActivityLogPayload) {
    return this.prisma.activityLog.create({
      data: {
        action: dto.action,
        customerId: dto.customerId,
        userId: dto.userId,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findByCustomer(customerId: string) {
    return this.prisma.activityLog.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
