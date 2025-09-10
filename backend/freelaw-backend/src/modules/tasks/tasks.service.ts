import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Task, TaskStatus, TaskType, TaskPriority } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    
    private eventEmitter: EventEmitter2,
  ) {}

  async getUserTasks(userId: string, filters: {
    status?: string;
    priority?: string;
    limit: number;
    offset: number;
  }) {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId });

    if (filters.status && filters.status !== 'TODOS') {
      queryBuilder.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters.priority && filters.priority !== 'TODOS') {
      queryBuilder.andWhere('task.prioridade = :priority', { priority: filters.priority });
    }

    const [tasks, total] = await queryBuilder
      .orderBy('task.aiPriorityScore', 'DESC')
      .addOrderBy('task.createdAt', 'DESC')
      .take(filters.limit)
      .skip(filters.offset)
      .getManyAndCount();

    return {
      tasks: tasks.map(task => ({
        id: task.id,
        titulo: task.titulo,
        descricao: task.descricao,
        tipo: task.tipo,
        prioridade: task.prioridade,
        status: task.status,
        deadline: task.deadline,
        estimatedMinutes: task.estimatedMinutes,
        spentMinutes: task.spentMinutes,
        aiSuggestion: task.aiSuggestion,
        aiPriorityScore: task.aiPriorityScore,
        aiComplexity: task.aiComplexity,
        tags: task.tags,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt,
        isOverdue: task.isOverdue,
        progressPercentage: task.progressPercentage,
        timeRemaining: task.timeRemaining,
        efficiency: task.efficiency,
      })),
      total,
      hasMore: filters.offset + filters.limit < total,
    };
  }

  async createTask(userId: string, taskData: {
    titulo: string;
    descricao?: string;
    tipo: TaskType;
    prioridade?: TaskPriority;
    deadline?: string;
    estimatedMinutes?: number;
    tags?: string[];
    serviceOrderId?: string;
    processId?: string;
    contactId?: string;
  }) {
    const task = this.taskRepository.create({
      ...taskData,
      userId,
      deadline: taskData.deadline ? new Date(taskData.deadline) : null,
      prioridade: taskData.prioridade || TaskPriority.MEDIUM,
      tags: taskData.tags || [],
    });

    const savedTask = await this.taskRepository.save(task);

    // Emitir evento
    this.eventEmitter.emit('task.created', savedTask);

    return {
      message: 'Tarefa criada com sucesso',
      task: savedTask,
    };
  }

  async updateTask(id: string, userId: string, updates: Partial<Task>) {
    const task = await this.taskRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    Object.assign(task, updates);
    const updatedTask = await this.taskRepository.save(task);

    // Emitir evento
    this.eventEmitter.emit('task.updated', updatedTask);

    return {
      message: 'Tarefa atualizada com sucesso',
      task: updatedTask,
    };
  }

  async startTask(id: string, userId: string) {
    const task = await this.taskRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    if (task.status === TaskStatus.COMPLETED) {
      throw new ForbiddenException('Não é possível iniciar uma tarefa já completada');
    }

    task.status = TaskStatus.IN_PROGRESS;
    task.startedAt = new Date();
    
    await this.taskRepository.save(task);

    return {
      message: 'Tarefa iniciada com sucesso',
      task: {
        id: task.id,
        status: task.status,
        startedAt: task.startedAt,
      },
    };
  }

  async completeTask(id: string, userId: string, spentMinutes?: number, notes?: string) {
    const task = await this.taskRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    
    if (spentMinutes) {
      task.spentMinutes = spentMinutes;
    }
    
    if (notes) {
      task.metadata = { ...task.metadata, notes };
    }

    await this.taskRepository.save(task);

    // Emitir evento para análise de performance
    this.eventEmitter.emit('task.completed', task);

    return {
      message: 'Tarefa completada com sucesso',
      task: {
        id: task.id,
        status: task.status,
        completedAt: task.completedAt,
        efficiency: task.efficiency,
      },
    };
  }

  async deleteTask(id: string, userId: string) {
    const task = await this.taskRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    await this.taskRepository.remove(task);

    return {
      message: 'Tarefa excluída com sucesso',
    };
  }
}

