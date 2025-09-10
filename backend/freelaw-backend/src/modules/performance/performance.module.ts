import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PerformanceMetrics } from '../../shared/entities/performance-metrics.entity';
import { Provider } from '../../shared/entities/provider.entity';

// TODO: Implementar sistema de performance
@Module({
  imports: [
    TypeOrmModule.forFeature([PerformanceMetrics, Provider]),
  ],
})
export class PerformanceModule {}

