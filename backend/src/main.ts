import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

function getCorsOrigins(): string[] {
  const configured = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
  const values = configured
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const defaults = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  return Array.from(new Set([...defaults, ...values]));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const allowedOrigins = getCorsOrigins();
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Requests without Origin header (mobile apps, curl, server-to-server) are allowed.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  };

  app.enableCors(corsOptions);
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? '3001';
  await app.listen(port);
}

void bootstrap();
