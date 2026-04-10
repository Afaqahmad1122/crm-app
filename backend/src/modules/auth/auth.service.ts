import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    // Create organization + user in one transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: dto.organizationName },
      });

      const hashed = await bcrypt.hash(dto.password, 10);

      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashed,
          role: 'ADMIN',
          organizationId: org.id,
        },
      });

      return { org, user };
    });

    const token = this.signToken(
      result.user.id,
      result.user.email,
      result.user.organizationId,
    );

    return {
      token,
      user: this.excludePassword(result.user),
      organization: result.org,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { organization: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(user.id, user.email, user.organizationId);

    return {
      token,
      user: this.excludePassword(user),
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.excludePassword(user);
  }

  private signToken(userId: string, email: string, organizationId: string) {
    return this.jwt.sign({
      sub: userId,
      email,
      organizationId,
    });
  }

  private excludePassword(user: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user as {
      password: string;
    } & Record<string, unknown>;
    return rest;
  }
}
