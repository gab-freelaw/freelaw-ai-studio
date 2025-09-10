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

import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';

@ApiTags('Ordens de Serviço')
@ApiBearerAuth()
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova ordem de serviço' })
  @ApiResponse({ status: 201, description: 'Ordem criada com sucesso' })
  async create(
    @Body() createOrderDto: CreateServiceOrderDto,
    @Request() req: any,
  ) {
    const contractorId = req.user?.id || 'test-contractor-id';
    return this.serviceOrdersService.create(contractorId, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ordens de serviço' })
  @ApiResponse({ status: 200, description: 'Lista de ordens' })
  async findAll(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    const contractorId = req.user?.id || 'test-contractor-id';
    return this.serviceOrdersService.findAll(contractorId, { status, limit, offset });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar ordem de serviço por ID' })
  @ApiResponse({ status: 200, description: 'Ordem encontrada' })
  @ApiResponse({ status: 404, description: 'Ordem não encontrada' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const contractorId = req.user?.id || 'test-contractor-id';
    return this.serviceOrdersService.findOne(id, contractorId);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Aprovar trabalho entregue' })
  @ApiResponse({ status: 200, description: 'Trabalho aprovado' })
  async approve(
    @Param('id') id: string,
    @Body() body: { rating?: number; feedback?: string },
    @Request() req: any,
  ) {
    const contractorId = req.user?.id || 'test-contractor-id';
    return this.serviceOrdersService.approve(id, contractorId, body.rating, body.feedback);
  }

  @Post(':id/request-revision')
  @ApiOperation({ summary: 'Solicitar correção do trabalho' })
  @ApiResponse({ status: 201, description: 'Correção solicitada' })
  async requestRevision(
    @Param('id') id: string,
    @Body() revisionDto: RequestRevisionDto,
    @Request() req: any,
  ) {
    const contractorId = req.user?.id || 'test-contractor-id';
    return this.serviceOrdersService.requestRevision(id, contractorId, revisionDto);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancelar ordem de serviço' })
  @ApiResponse({ status: 200, description: 'Ordem cancelada' })
  async cancel(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    const contractorId = req.user?.id || 'test-contractor-id';
    return this.serviceOrdersService.cancel(id, contractorId, body.reason);
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'Listar correções da ordem' })
  @ApiResponse({ status: 200, description: 'Lista de correções' })
  async getRevisions(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const contractorId = req.user?.id || 'test-contractor-id';
    return this.serviceOrdersService.getRevisions(id, contractorId);
  }
}

