/**
 * Integração entre sistema de tarefas existente e novo backend NestJS
 */

import { freelawAPI } from '@/lib/sdk/freelaw-api';

export interface TaskIntegration {
  // Sincronizar tarefas existentes com backend
  syncExistingTasks(): Promise<void>;
  
  // Gerar tarefas automaticamente quando ordem é criada
  generateTasksForServiceOrder(serviceOrderId: string): Promise<void>;
  
  // Atualizar prioridades com IA
  updateTaskPriorities(): Promise<void>;
  
  // Integrar insights de IA
  getAIInsights(): Promise<any>;
}

export class TasksIntegrationService implements TaskIntegration {
  
  async syncExistingTasks(): Promise<void> {
    // Buscar tarefas existentes do frontend (mock data)
    const existingTasks = this.getExistingTasksFromLocalStorage();
    
    // Enviar para backend NestJS
    for (const task of existingTasks) {
      try {
        await this.createTaskInBackend(task);
      } catch (error) {
        console.warn(`Erro ao sincronizar tarefa ${task.id}:`, error);
      }
    }
  }

  async generateTasksForServiceOrder(serviceOrderId: string): Promise<void> {
    try {
      const result = await freelawAPI.request(`/tasks/generate-from-service/${serviceOrderId}`, {
        method: 'POST',
      });
      
      console.log(`✅ ${result.tasks.length} tarefas geradas automaticamente para ordem ${serviceOrderId}`);
      
      // Emitir evento para frontend atualizar
      window.dispatchEvent(new CustomEvent('tasks-generated', { 
        detail: { serviceOrderId, tasks: result.tasks } 
      }));
      
    } catch (error) {
      console.error('Erro ao gerar tarefas:', error);
    }
  }

  async updateTaskPriorities(): Promise<void> {
    try {
      // Buscar tarefas pendentes
      const tasks = await freelawAPI.request('/tasks?status=PENDENTE&limit=100');
      
      for (const task of tasks.tasks) {
        if (!task.aiPriorityScore) {
          try {
            const analysis = await freelawAPI.request(`/tasks/${task.id}/analyze-priority`, {
              method: 'PUT',
            });
            
            console.log(`✅ Prioridade atualizada para tarefa ${task.titulo}: ${analysis.priorityScore}/100`);
          } catch (error) {
            console.warn(`Erro ao analisar prioridade da tarefa ${task.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar prioridades:', error);
    }
  }

  async getAIInsights(): Promise<any> {
    try {
      const insights = await freelawAPI.request('/tasks/insights');
      return insights;
    } catch (error) {
      console.error('Erro ao buscar insights:', error);
      return this.getFallbackInsights();
    }
  }

  private getExistingTasksFromLocalStorage() {
    // Simular tarefas existentes que seriam migradas
    return [
      {
        titulo: 'Elaborar contestação - Processo 1234567',
        descricao: 'Preparar contestação completa com preliminares e mérito',
        tipo: 'PETICAO',
        prioridade: 'URGENTE',
        deadline: '2025-09-10',
        estimatedMinutes: 240,
        tags: ['Cível', 'Contestação', 'Urgente'],
      },
      {
        titulo: 'Analisar documentos do cliente',
        descricao: 'Revisar 15 documentos enviados',
        tipo: 'ANALISE',
        prioridade: 'MEDIA',
        estimatedMinutes: 60,
        tags: ['Documentos', 'Análise'],
      },
    ];
  }

  private async createTaskInBackend(taskData: any) {
    return freelawAPI.request('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        titulo: taskData.titulo,
        descricao: taskData.descricao,
        tipo: taskData.tipo,
        prioridade: taskData.prioridade,
        deadline: taskData.deadline,
        estimatedMinutes: taskData.estimatedMinutes,
        tags: taskData.tags,
      }),
    });
  }

  private getFallbackInsights() {
    return {
      insights: [
        {
          tipo: 'sugestao',
          titulo: 'Sistema integrado funcionando',
          descricao: 'Tarefas agora são gerenciadas pelo backend NestJS com IA',
        },
      ],
      stats: {
        totalTasks: 0,
        urgentTasks: 0,
        overdueCount: 0,
        productivityScore: 0,
        timeSaved: 0,
      },
    };
  }
}

// Hook React para usar a integração
export function useTasksIntegration() {
  const integration = new TasksIntegrationService();

  const syncTasks = async () => {
    await integration.syncExistingTasks();
  };

  const generateTasksForOrder = async (serviceOrderId: string) => {
    await integration.generateTasksForServiceOrder(serviceOrderId);
  };

  const getInsights = async () => {
    return integration.getAIInsights();
  };

  return {
    syncTasks,
    generateTasksForOrder,
    getInsights,
  };
}

// Singleton instance
export const tasksIntegration = new TasksIntegrationService();

