import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@ApiTags('Prestadores')
@ApiBearerAuth()
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Aplicar para ser prestador' })
  @ApiResponse({ status: 201, description: 'Aplicação enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async apply(
    @Body() createProviderDto: CreateProviderDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'test-user-id';
    return this.providersService.apply(userId, createProviderDto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Buscar perfil do prestador' })
  @ApiResponse({ status: 200, description: 'Perfil do prestador' })
  @ApiResponse({ status: 404, description: 'Prestador não encontrado' })
  async getProfile(@Request() req: any) {
    const userId = req.user?.id || 'test-user-id';
    return this.providersService.getProfile(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Atualizar perfil do prestador' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  async updateProfile(
    @Body() updateProviderDto: UpdateProviderDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'test-user-id';
    return this.providersService.updateProfile(userId, updateProviderDto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard do prestador' })
  @ApiResponse({ status: 200, description: 'Dados do dashboard' })
  async getDashboard(@Request() req: any) {
    const userId = req.user?.id || 'test-user-id';
    return this.providersService.getDashboard(userId);
  }

  @Post('evaluation/start')
  @ApiOperation({ summary: 'Iniciar avaliação por IA' })
  @ApiResponse({ status: 201, description: 'Avaliação iniciada' })
  async startEvaluation(@Request() req: any) {
    const userId = req.user?.id || 'test-user-id';
    return this.providersService.startEvaluation(userId);
  }

  @Post('evaluation/submit')
  @ApiOperation({ summary: 'Submeter peças para avaliação' })
  @ApiResponse({ status: 200, description: 'Peças submetidas' })
  async submitEvaluation(
    @Body() body: { evaluationId: string; pieces: any[] },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'test-user-id';
    return this.providersService.submitEvaluation(userId, body.evaluationId, body.pieces);
  }

  @Get('available-work')
  @ApiOperation({ summary: 'Buscar trabalhos disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de trabalhos' })
  async getAvailableWork(
    @Request() req: any,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    const providerId = req.user?.providerId || 'test-provider-id';
    return this.providersService.getAvailableWork(providerId, limit, offset);
  }

  @Post('work/:orderId/accept')
  @ApiOperation({ summary: 'Aceitar trabalho' })
  @ApiResponse({ status: 200, description: 'Trabalho aceito' })
  async acceptWork(
    @Param('orderId') orderId: string,
    @Request() req: any,
  ) {
    const providerId = req.user?.providerId || 'test-provider-id';
    return this.providersService.acceptWork(providerId, orderId);
  }

  @Post('work/:orderId/submit')
  @ApiOperation({ summary: 'Submeter trabalho concluído' })
  @ApiResponse({ status: 200, description: 'Trabalho submetido' })
  async submitWork(
    @Param('orderId') orderId: string,
    @Body() body: { document: string; notes?: string },
    @Request() req: any,
  ) {
    const providerId = req.user?.providerId || 'test-provider-id';
    return this.providersService.submitWork(providerId, orderId, body.document, body.notes);
  }
}

