import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { NotesModule } from './modules/notes/notes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: Number(config.get('THROTTLE_TTL_MS', '60000')),
          limit: Number(config.get('THROTTLE_LIMIT', '100')),
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    AssignmentsModule,
    NotesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
