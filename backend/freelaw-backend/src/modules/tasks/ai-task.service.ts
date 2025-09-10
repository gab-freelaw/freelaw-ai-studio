import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Task, TaskType, TaskPriority, TaskStatus, AIComplexity } from './entities/task.entity';
import { ServiceOrder } from '../../shared/entities/service-order.entity';

interface SuggestedTask {
  titulo: string;
  descricao: string;
  tipo: TaskType;
  prioridade: TaskPriority;
  estimatedMinutes: number;
  aiSuggestion: string;
  complexity: AIComplexity;
  tags: string[];
}

export interface AIInsight {
  tipo: 'sugestao' | 'alerta' | 'automacao';
  titulo: string;
  descricao: string;
}

interface AITaskAnalysis {
  suggestedTasks: SuggestedTask[];
  insights: AIInsight[];
}

@Injectable()
export class AITaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    
    @InjectRepository(ServiceOrder)
    private serviceOrderRepository: Repository<ServiceOrder>,
    
    private configService: ConfigService,
  ) {}

  async generateTasksFromServiceOrder(serviceOrderId: string): Promise<Task[]> {
    const serviceOrder = await this.serviceOrderRepository.findOne({
      where: { id: serviceOrderId },
    });

    if (!serviceOrder) {
      throw new Error('Ordem de serviço não encontrada');
    }

    // Analisar ordem e gerar tarefas automaticamente
    const analysis = await this.analyzeServiceOrderWithAI(serviceOrder);
    
    const tasks: Task[] = [];
    
    for (const suggestedTask of analysis.suggestedTasks) {
      const task = this.taskRepository.create({
        titulo: suggestedTask.titulo,
        descricao: suggestedTask.descricao,
        tipo: suggestedTask.tipo,
        prioridade: suggestedTask.prioridade,
        userId: serviceOrder.contractorId,
        serviceOrderId: serviceOrder.id,
        estimatedMinutes: suggestedTask.estimatedMinutes,
        aiSuggestion: suggestedTask.aiSuggestion,
        aiComplexity: suggestedTask.complexity,
        aiGenerated: true,
        aiAutoPriority: true,
        tags: suggestedTask.tags,
        deadline: this.calculateTaskDeadline(serviceOrder.estimatedDelivery, suggestedTask.tipo),
      });

      const savedTask = await this.taskRepository.save(task);
      tasks.push(savedTask);
    }

    return tasks;
  }

  async analyzeTaskPriority(taskId: string): Promise<{
    priorityScore: number;
    suggestedPriority: TaskPriority;
    reasoning: string;
  }> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['serviceOrder'],
    });

    if (!task) {
      throw new Error('Tarefa não encontrada');
    }

    // Fatores para cálculo de prioridade
    const factors = {
      deadline: this.getDeadlineFactor(task.deadline),
      type: this.getTypeFactor(task.tipo),
      serviceUrgency: task.serviceOrderId ? 1.2 : 1.0,
      currentLoad: await this.getUserLoadFactor(task.userId),
    };

    const priorityScore = Math.min(100, Math.round(
      factors.deadline * factors.type * factors.serviceUrgency * factors.currentLoad
    ));

    const suggestedPriority = this.scoreToPriority(priorityScore);

    return {
      priorityScore,
      suggestedPriority,
      reasoning: this.generatePriorityReasoning(factors, priorityScore),
    };
  }

  async generateAIInsights(userId: string): Promise<{
    insights: AIInsight[];
    stats: {
      totalTasks: number;
      urgentTasks: number;
      overdueCount: number;
      productivityScore: number;
      timeSaved: number;
    };
  }> {
    const tasks = await this.taskRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const insights: AIInsight[] = [];
    const urgentTasks = tasks.filter(t => t.prioridade === TaskPriority.URGENT && t.status !== TaskStatus.COMPLETED);
    const overdueTasks = tasks.filter(t => t.isOverdue);
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);

    // Alertas de prazo
    if (urgentTasks.length > 0) {
      insights.push({
        tipo: 'alerta',
        titulo: `${urgentTasks.length} tarefa${urgentTasks.length > 1 ? 's' : ''} urgente${urgentTasks.length > 1 ? 's' : ''}`,
        descricao: `${urgentTasks.map(t => t.titulo.substring(0, 30)).join(', ')}...`,
      });
    }

    // Sugestões de otimização
    if (overdueTasks.length > 2) {
      insights.push({
        tipo: 'sugestao',
        titulo: 'Reorganizar prioridades',
        descricao: `${overdueTasks.length} tarefas em atraso. Considere redistribuir ou delegar algumas.`,
      });
    }

    // Automações disponíveis
    const callTasks = tasks.filter(t => t.tipo === TaskType.CALL && t.status === TaskStatus.PENDING);
    if (callTasks.length >= 3) {
      insights.push({
        tipo: 'automacao',
        titulo: 'Automatizar follow-ups',
        descricao: `${callTasks.length} ligações pendentes podem ser convertidas em emails automáticos.`,
      });
    }

    // Estatísticas
    const totalMinutes = completedTasks.reduce((acc, t) => acc + (t.spentMinutes || 0), 0);
    const estimatedMinutes = completedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
    const timeSaved = Math.max(0, estimatedMinutes - totalMinutes);
    const productivityScore = estimatedMinutes > 0 ? Math.round((timeSaved / estimatedMinutes) * 100) : 0;

    return {
      insights,
      stats: {
        totalTasks: tasks.length,
        urgentTasks: urgentTasks.length,
        overdueCount: overdueTasks.length,
        productivityScore,
        timeSaved,
      },
    };
  }

  private async analyzeServiceOrderWithAI(serviceOrder: ServiceOrder): Promise<AITaskAnalysis> {
    // Simulação de análise por IA - em produção usaria OpenAI
    const taskSuggestions: SuggestedTask[] = [];

    // Tarefas baseadas no tipo de serviço
    switch (serviceOrder.type) {
      case 'petition':
        taskSuggestions.push(
          {
            titulo: `Pesquisar jurisprudência - ${serviceOrder.legalArea}`,
            descricao: `Buscar precedentes relevantes para ${serviceOrder.title}`,
            tipo: TaskType.ANALYSIS,
            prioridade: TaskPriority.HIGH,
            estimatedMinutes: 60,
            aiSuggestion: 'Focar em decisões dos últimos 2 anos do tribunal competente',
            complexity: AIComplexity.MODERATE,
            tags: ['Jurisprudência', serviceOrder.legalArea],
          },
          {
            titulo: `Elaborar ${serviceOrder.title}`,
            descricao: serviceOrder.description,
            tipo: TaskType.PETITION,
            prioridade: serviceOrder.urgency === 'super_urgent' ? TaskPriority.URGENT : TaskPriority.HIGH,
            estimatedMinutes: 180,
            aiSuggestion: 'Usar template base e personalizar conforme especificidades do caso',
            complexity: AIComplexity.COMPLEX,
            tags: ['Petição', 'Elaboração'],
          }
        );
        break;

      case 'contract':
        taskSuggestions.push(
          {
            titulo: `Revisar minutas - ${serviceOrder.title}`,
            descricao: 'Análise de cláusulas e adequação legal',
            tipo: TaskType.DOCUMENT,
            prioridade: TaskPriority.MEDIUM,
            estimatedMinutes: 90,
            aiSuggestion: 'Verificar cláusulas de rescisão e multas contratuais',
            complexity: AIComplexity.MODERATE,
            tags: ['Contrato', 'Revisão'],
          }
        );
        break;

      case 'hearing':
        taskSuggestions.push(
          {
            titulo: `Preparar para audiência - ${serviceOrder.title}`,
            descricao: 'Organizar documentos e estratégia',
            tipo: TaskType.HEARING,
            prioridade: TaskPriority.URGENT,
            estimatedMinutes: 120,
            aiSuggestion: 'Revisar histórico do processo e preparar perguntas para testemunhas',
            complexity: AIComplexity.COMPLEX,
            tags: ['Audiência', 'Preparação'],
          }
        );
        break;
    }

    const insights = [
      {
        tipo: 'sugestao' as const,
        titulo: 'Tarefas geradas automaticamente',
        descricao: `Criadas ${taskSuggestions.length} tarefas baseadas na análise da ordem de serviço`,
      },
    ];

    return {
      suggestedTasks: taskSuggestions,
      insights,
    };
  }

  private calculateTaskDeadline(serviceDeadline: Date | null, taskType: TaskType): Date | null {
    if (!serviceDeadline) return null;

    const deadline = new Date(serviceDeadline);
    
    // Ajustar deadline baseado no tipo de tarefa
    switch (taskType) {
      case TaskType.ANALYSIS:
        deadline.setDate(deadline.getDate() - 3); // 3 dias antes
        break;
      case TaskType.PETITION:
        deadline.setDate(deadline.getDate() - 1); // 1 dia antes
        break;
      case TaskType.HEARING:
        deadline.setHours(deadline.getHours() - 24); // 24h antes
        break;
      default:
        deadline.setDate(deadline.getDate() - 2); // 2 dias antes
    }

    return deadline;
  }

  private getDeadlineFactor(deadline: Date | null): number {
    if (!deadline) return 50;
    
    const now = new Date();
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) return 100; // Menos de 24h = urgente
    if (diffHours < 72) return 80;  // Menos de 3 dias = alta
    if (diffHours < 168) return 60; // Menos de 1 semana = média
    return 40; // Mais de 1 semana = baixa
  }

  private getTypeFactor(type: TaskType): number {
    const typeFactors = {
      [TaskType.DEADLINE]: 1.5,
      [TaskType.HEARING]: 1.4,
      [TaskType.PETITION]: 1.3,
      [TaskType.DOCUMENT]: 1.1,
      [TaskType.ANALYSIS]: 1.0,
      [TaskType.EMAIL]: 0.8,
      [TaskType.CALL]: 0.7,
      [TaskType.OTHER]: 0.9,
    };
    
    return typeFactors[type] || 1.0;
  }

  private async getUserLoadFactor(userId: string): Promise<number> {
    const activeTasks = await this.taskRepository.count({
      where: { 
        userId, 
        status: TaskStatus.IN_PROGRESS,
      },
    });

    // Quanto mais tarefas ativas, maior a prioridade das novas
    return 1 + (activeTasks * 0.1);
  }

  private scoreToPriority(score: number): TaskPriority {
    if (score >= 80) return TaskPriority.URGENT;
    if (score >= 60) return TaskPriority.HIGH;
    if (score >= 40) return TaskPriority.MEDIUM;
    return TaskPriority.LOW;
  }

  private generatePriorityReasoning(factors: any, score: number): string {
    const reasons: string[] = [];
    
    if (factors.deadline > 80) reasons.push('prazo crítico');
    if (factors.type > 1.2) reasons.push('tipo de alta importância');
    if (factors.serviceUrgency > 1.0) reasons.push('relacionada a serviço urgente');
    if (factors.currentLoad > 1.2) reasons.push('alta carga de trabalho atual');
    
    return reasons.length > 0 
      ? `Prioridade ${score}/100 devido a: ${reasons.join(', ')}`
      : `Prioridade ${score}/100 baseada em análise geral`;
  }
}
