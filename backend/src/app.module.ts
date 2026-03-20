import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NotionModule } from './integrations/notion/notion.module';
import { ChartsModule } from './charts/charts.module';
import { EmbedModule } from './embed/embed.module';
import { NotionLPModule } from './notion-lp/notion-lp.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,   // ventana de 1 minuto
        limit: 60,     // max 60 req/min por IP (rutas normales)
      },
      {
        name: 'auth',
        ttl: 60_000,   // ventana de 1 minuto
        limit: 10,     // max 10 intentos/min por IP (rutas auth)
      },
    ]),
    DatabaseModule,
    UsersModule,
    AuthModule,
    NotionModule,
    ChartsModule,
    EmbedModule,
    NotionLPModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
