import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { TasksService } from './tasks.service';
import { AITaskService } from './ai-task.service';

@ApiTags('Tarefas Inteligentes')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly aiTaskService: AITaskService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar tarefas do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de tarefas' })
  async getUserTasks(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    const userId = req.user?.id || 'test-user-id';
    return this.tasksService.getUserTasks(userId, { status, priority, limit, offset });
  }

  @Get('insights')
  @ApiOperation({ summary: 'Insights de IA para tarefas' })
  @ApiResponse({ status: 200, description: 'Insights e estatísticas' })
  async getAIInsights(@Request() req: any) {
    const userId = req.user?.id || 'test-user-id';
    return this.aiTaskService.generateAIInsights(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova tarefa' })
  @ApiResponse({ status: 201, description: 'Tarefa criada' })
  async createTask(
    @Body() taskData: any,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'test-user-id';
    return this.tasksService.createTask(userId, taskData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar tarefa' })
  @ApiResponse({ status: 200, description: 'Tarefa atualizada' })
  async updateTask(
    @Param('id') id: string,
    @Body() updates: any,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'test-user-id';
    return this.tasksService.updateTask(id, userId, updates);
  }

  @Put(':id/start')
  @ApiOperation({ summary: 'Iniciar tarefa' })
  @ApiResponse({ status: 200, description: 'Tarefa iniciada' })
  async startTask(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'test-user-id';
    return this.tasksService.startTask(id, userId);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Completar tarefa' })
  @ApiResponse({ status: 200, description: 'Tarefa completada' })
  async completeTask(
    @Param('id') id: string,
    @Body() body: { spentMinutes?: number; notes?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'test-user-id';
    return this.tasksService.completeTask(id, userId, body.spentMinutes, body.notes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir tarefa' })
  @ApiResponse({ status: 200, description: 'Tarefa excluída' })
  async deleteTask(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'test-user-id';
    return this.tasksService.deleteTask(id, userId);
  }

  @Post('generate-from-service/:serviceOrderId')
  @ApiOperation({ summary: 'Gerar tarefas automaticamente de uma ordem de serviço' })
  @ApiResponse({ status: 201, description: 'Tarefas geradas pela IA' })
  async generateTasksFromService(
    @Param('serviceOrderId') serviceOrderId: string,
    @Request() req: any,
  ) {
    const tasks = await this.aiTaskService.generateTasksFromServiceOrder(serviceOrderId);
    
    return {
      message: `${tasks.length} tarefas geradas automaticamente pela IA`,
      tasks: tasks.map(t => ({
        id: t.id,
        titulo: t.titulo,
        tipo: t.tipo,
        prioridade: t.prioridade,
        aiSuggestion: t.aiSuggestion,
        estimatedMinutes: t.estimatedMinutes,
      })),
    };
  }

  @Put(':id/analyze-priority')
  @ApiOperation({ summary: 'Analisar prioridade da tarefa com IA' })
  @ApiResponse({ status: 200, description: 'Análise de prioridade' })
  async analyzePriority(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.aiTaskService.analyzeTaskPriority(id);
  }
}

