import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RevisionRequest } from '../../shared/entities/revision-request.entity';
import { ServiceOrder } from '../../shared/entities/service-order.entity';

// TODO: Implementar sistema de correções
@Module({
  imports: [
    TypeOrmModule.forFeature([RevisionRequest, ServiceOrder]),
  ],
})
export class RevisionsModule {}

