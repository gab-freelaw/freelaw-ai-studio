import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Provider } from '../../shared/entities/provider.entity';
import { PerformanceMetrics } from '../../shared/entities/performance-metrics.entity';
import { ServiceOrder } from '../../shared/entities/service-order.entity';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, PerformanceMetrics, ServiceOrder]),
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
