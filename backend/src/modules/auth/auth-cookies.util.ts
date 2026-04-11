import type { Response } from 'express';
import {
  AUTH_ACCESS_COOKIE_NAME,
  AUTH_REFRESH_COOKIE_NAME,
} from './auth.constants';
import { parseDurationToMs } from './duration.util';

export type CookieSameSite = 'lax' | 'strict' | 'none';

function env(key: string): string | undefined {
  return (
    globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.[key];
}

export function getAuthCookieOptions() {
  const frontendOrigin = env('FRONTEND_ORIGIN') ?? '';
  const defaultSameSite: CookieSameSite = frontendOrigin.startsWith(
    'http://localhost',
  )
    ? 'lax'
    : 'none';
  const sameSite =
    (env('AUTH_COOKIE_SAME_SITE') as CookieSameSite | undefined) ??
    defaultSameSite;
  const secure =
    env('AUTH_COOKIE_SECURE') !== undefined
      ? env('AUTH_COOKIE_SECURE') === 'true'
      : sameSite === 'none';

  return {
    sameSite,
    secure,
    domain: env('AUTH_COOKIE_DOMAIN') || undefined,
  };
}

function accessCookieMaxAgeMs(): number {
  const raw = env('JWT_EXPIRES_IN') ?? '15m';
  return parseDurationToMs(raw, 15 * 60_000);
}

function refreshCookieMaxAgeMs(): number {
  const raw = env('JWT_REFRESH_EXPIRES_IN') ?? '7d';
  return parseDurationToMs(raw, 7 * 86_400_000);
}

export function setAccessTokenCookie(res: Response, accessToken: string): void {
  const cookie = getAuthCookieOptions();
  res.cookie(AUTH_ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    domain: cookie.domain,
    maxAge: accessCookieMaxAgeMs(),
    path: '/',
  });
}

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  const cookie = getAuthCookieOptions();
  res.cookie(AUTH_REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    domain: cookie.domain,
    maxAge: refreshCookieMaxAgeMs(),
    path: '/',
  });
}

export function clearAuthCookies(res: Response): void {
  const cookie = getAuthCookieOptions();
  const opts = {
    path: '/',
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    domain: cookie.domain,
  };
  res.clearCookie(AUTH_ACCESS_COOKIE_NAME, opts);
  res.clearCookie(AUTH_REFRESH_COOKIE_NAME, opts);
}
