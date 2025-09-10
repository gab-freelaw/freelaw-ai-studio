import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import all entities
import { Provider } from '../../shared/entities/provider.entity';
import { ProviderWallet } from '../../shared/entities/provider-wallet.entity';
import { Transaction } from '../../shared/entities/transaction.entity';
import { ServiceOrder } from '../../shared/entities/service-order.entity';
import { RevisionRequest } from '../../shared/entities/revision-request.entity';
import { PerformanceMetrics } from '../../shared/entities/performance-metrics.entity';
import { BankAccount } from '../../modules/wallet/entities/bank-account.entity';
import { PricingRule } from '../../modules/pricing/entities/pricing-rule.entity';
import { Task } from '../../modules/tasks/entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [
          Provider,
          ProviderWallet,
          Transaction,
          ServiceOrder,
          RevisionRequest,
          PerformanceMetrics,
          BankAccount,
          PricingRule,
          Task,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
