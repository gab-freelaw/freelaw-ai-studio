import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AITaskService } from './ai-task.service';
import { Task } from './entities/task.entity';
import { ServiceOrder } from '../../shared/entities/service-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, ServiceOrder]),
    BullModule.registerQueue({
      name: 'ai-tasks',
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService, AITaskService],
  exports: [TasksService, AITaskService],
})
export class TasksModule {}

