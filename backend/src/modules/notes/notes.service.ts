import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { Role } from '@prisma/client';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async create(dto: CreateNoteDto, userId: string, organizationId: string) {
    // Verify customer belongs to org
    // Notes can be added even on soft-deleted customers
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        organizationId,
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const note = await this.prisma.note.create({
      data: {
        content: dto.content,
        customerId: dto.customerId,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await this.activityLogs.log({
      action: 'NOTE_ADDED',
      customerId: dto.customerId,
      userId,
      metadata: { noteId: note.id },
    });

    return note;
  }

  async findByCustomer(customerId: string, organizationId: string) {
    // Verify customer belongs to org (include soft deleted)
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.note.findMany({
      where: { customerId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    noteId: string,
    dto: UpdateNoteDto,
    userId: string,
    userRole: Role,
    organizationId: string,
  ) {
    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        customer: { organizationId },
      },
    });

    if (!note) throw new NotFoundException('Note not found');

    // Only note owner or ADMIN can update
    if (note.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You can only edit your own notes');
    }

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: { content: dto.content },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await this.activityLogs.log({
      action: 'NOTE_UPDATED',
      customerId: note.customerId,
      userId,
      metadata: { noteId },
    });

    return updated;
  }

  async remove(
    noteId: string,
    userId: string,
    userRole: Role,
    organizationId: string,
  ) {
    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        customer: { organizationId },
      },
    });

    if (!note) throw new NotFoundException('Note not found');

    // Only note owner or ADMIN can delete
    if (note.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    await this.prisma.note.delete({ where: { id: noteId } });

    await this.activityLogs.log({
      action: 'NOTE_DELETED',
      customerId: note.customerId,
      userId,
      metadata: { noteId },
    });

    return { message: 'Note deleted successfully' };
  }
}
