import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { parseDurationToMs } from './duration.util';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw, 'utf8').digest('hex');
  }

  private newRawToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private refreshExpiresAt(): Date {
    const raw =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const ms = parseDurationToMs(raw, 7 * 86_400_000);
    return new Date(Date.now() + ms);
  }

  /**
   * Creates a new refresh session (new family). Caller should revoke other sessions if desired.
   */
  async createSession(userId: string): Promise<{ raw: string; familyId: string }> {
    const raw = this.newRawToken();
    const familyId = randomUUID();
    const tokenHash = this.hashToken(raw);
    const expiresAt = this.refreshExpiresAt();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash,
        expiresAt,
      },
    });

    return { raw, familyId };
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Validates raw token, rotates on success, detects reuse of revoked tokens.
   */
  async rotate(raw: string): Promise<{ raw: string; userId: string }> {
    const tokenHash = this.hashToken(raw);
    const now = new Date();

    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!row) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (row.revokedAt) {
      await this.revokeFamily(row.familyId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (row.expiresAt <= now) {
      await this.prisma.refreshToken.update({
        where: { id: row.id },
        data: { revokedAt: now },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    const newRaw = this.newRawToken();
    const newHash = this.hashToken(newRaw);
    const expiresAt = this.refreshExpiresAt();

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: row.id },
        data: { revokedAt: now },
      });
      await tx.refreshToken.create({
        data: {
          userId: row.userId,
          familyId: row.familyId,
          tokenHash: newHash,
          expiresAt,
        },
      });
    });

    return { raw: newRaw, userId: row.userId };
  }

  async revokeRaw(raw: string): Promise<void> {
    const tokenHash = this.hashToken(raw);
    const now = new Date();
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  private async revokeFamily(familyId: string): Promise<void> {
    const now = new Date();
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}
