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
import { RefreshTokenService } from './refresh-token.service';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

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

    const { accessToken, refreshToken } = await this.issueTokenPair(
      result.user.id,
      result.user.email,
      result.user.organizationId,
    );

    return {
      accessToken,
      refreshToken,
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

    await this.refreshTokens.revokeAllForUser(user.id);

    const { accessToken, refreshToken } = await this.issueTokenPair(
      user.id,
      user.email,
      user.organizationId,
    );

    return {
      accessToken,
      refreshToken,
      user: this.excludePassword(user),
    };
  }

  async refreshFromRaw(refreshRaw: string): Promise<TokenPair> {
    const { raw: newRefresh, userId } =
      await this.refreshTokens.rotate(refreshRaw);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const accessToken = this.signAccessToken(
      user.id,
      user.email,
      user.organizationId,
    );

    return { accessToken, refreshToken: newRefresh };
  }

  async logout(refreshRaw: string | undefined): Promise<void> {
    if (refreshRaw) {
      await this.refreshTokens.revokeRaw(refreshRaw);
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.excludePassword(user);
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    organizationId: string,
  ): Promise<TokenPair> {
    const accessToken = this.signAccessToken(userId, email, organizationId);
    const { raw } = await this.refreshTokens.createSession(userId);
    return { accessToken, refreshToken: raw };
  }

  private signAccessToken(
    userId: string,
    email: string,
    organizationId: string,
  ) {
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
