import { Controller, Post, Body, Get, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import type { Response } from 'express';
import { AUTH_COOKIE_NAME } from './auth.constants';

type CookieSameSite = 'lax' | 'strict' | 'none';

function getCookieConfig() {
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? '';
  const defaultSameSite: CookieSameSite = frontendOrigin.startsWith('http://localhost')
    ? 'lax'
    : 'none';
  const sameSite =
    (process.env.AUTH_COOKIE_SAME_SITE as CookieSameSite | undefined) ??
    defaultSameSite;
  const secure =
    process.env.AUTH_COOKIE_SECURE !== undefined
      ? process.env.AUTH_COOKIE_SECURE === 'true'
      : sameSite === 'none';

  return {
    sameSite,
    secure,
    domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return result;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    const cookie = getCookieConfig();
    res.cookie(AUTH_COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
      domain: cookie.domain,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: '/',
    });
    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const cookie = getCookieConfig();
    res.clearCookie(AUTH_COOKIE_NAME, {
      path: '/',
      sameSite: cookie.sameSite,
      secure: cookie.secure,
      domain: cookie.domain,
    });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: User) {
    return this.authService.getMe(user.id);
  }
}
