import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import type { Request, Response } from 'express';
import { AUTH_REFRESH_COOKIE_NAME } from './auth.constants';
import {
  clearAuthCookies,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from './auth-cookies.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
      organization: result.organization,
    };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[AUTH_REFRESH_COOKIE_NAME] as string | undefined;
    if (!raw) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const pair = await this.authService.refreshFromRaw(raw);
    setAccessTokenCookie(res, pair.accessToken);
    setRefreshTokenCookie(res, pair.refreshToken);

    return { accessToken: pair.accessToken };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[AUTH_REFRESH_COOKIE_NAME] as string | undefined;
    await this.authService.logout(raw);
    clearAuthCookies(res);
    return { ok: true as const };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: User) {
    return this.authService.getMe(user.id);
  }
}
