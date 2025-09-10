import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Provider } from '../../shared/entities/provider.entity';
import { ServiceOrder } from '../../shared/entities/service-order.entity';

// TODO: Implementar sistema de matching
@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, ServiceOrder]),
  ],
})
export class MatchingModule {}

