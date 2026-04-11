import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, '');
}

function getCorsOriginRules(): string[] {
  const configured = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
  const values = configured
    .split(',')
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);

  const defaults = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  return Array.from(new Set([...defaults, ...values]));
}

function matchesOriginPattern(origin: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return origin === pattern;
  }

  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = `^${escaped.replace(/\*/g, '.*')}$`;
  return new RegExp(regexPattern).test(origin);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpApp = app.getHttpAdapter().getInstance();
  if (typeof httpApp?.set === 'function') {
    httpApp.set('trust proxy', 1);
  }

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(cookieParser());

  const allowedOriginRules = getCorsOriginRules();
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Requests without Origin header (mobile apps, curl, server-to-server) are allowed.
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);
      const isAllowed = allowedOriginRules.some((rule) =>
        matchesOriginPattern(normalizedOrigin, rule),
      );

      if (isAllowed) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${normalizedOrigin}`), false);
    },
    credentials: true,
  };

  app.enableCors(corsOptions);
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? '3001';
  await app.listen(port);
}

void bootstrap();
