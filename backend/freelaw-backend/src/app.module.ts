import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Core modules
import { AuthModule } from './core/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';

// Business modules
import { ProvidersModule } from './modules/providers/providers.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { MatchingModule } from './modules/matching/matching.module';
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { RevisionsModule } from './modules/revisions/revisions.module';
// import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'freelaw',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),

    // Events
    EventEmitterModule.forRoot(),

    // Queues (Redis)
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),

    // Core modules
    AuthModule,
    DatabaseModule,

    // Business modules
    ProvidersModule,
    WalletModule,
    PricingModule,
    MatchingModule,
    ServiceOrdersModule,
    PerformanceModule,
    RevisionsModule,
    // TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}