import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, organizationId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        role: dto.role,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });

    return user;
  }

  async findAll(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // Include count of related assignments without loading every assignment row.
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Fetches one user by id only if it belongs to the given organization.
  async findOne(id: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        assignments: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // findFirst returns null if no row matches; convert to HTTP 404.
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // Partially updates a user; reuses findOne so cross-org access is rejected the same way as reads.
  async update(id: string, dto: UpdateUserDto, organizationId: string) {
    await this.findOne(id, organizationId);

    // Build only fields that exist on User and that the DTO allows (typed update input for Prisma).
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.role !== undefined) {
      data.role = dto.role;
    }
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  // Deletes a user after verifying they exist in the organization.
  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    const [assignmentsCount, notesCount] = await Promise.all([
      this.prisma.customerAssignment.count({
        where: {
          userId: id,
          customer: { organizationId },
        },
      }),
      this.prisma.note.count({
        where: {
          userId: id,
          organizationId,
        },
      }),
    ]);

    if (assignmentsCount > 0) {
      throw new ConflictException(
        'Cannot delete user with assigned customers. Unassign customers first.',
      );
    }

    if (notesCount > 0) {
      throw new ConflictException(
        'Cannot delete user with notes. Reassign or remove notes first.',
      );
    }

    await this.prisma.user.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  }
}
