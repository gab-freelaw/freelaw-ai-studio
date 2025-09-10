import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { PricingService, PricingResult } from './pricing.service';
import { CalculatePriceDto } from './dto/calculate-price.dto';

@ApiTags('Precificação')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calcular preço de um serviço' })
  @ApiResponse({ status: 200, description: 'Preço calculado com sucesso' })
  @ApiResponse({ status: 404, description: 'Nenhuma regra de precificação encontrada' })
  async calculatePrice(@Body() calculateDto: CalculatePriceDto): Promise<PricingResult> {
    return this.pricingService.calculatePrice(calculateDto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Listar todas as regras de precificação' })
  @ApiResponse({ status: 200, description: 'Lista de regras' })
  async getAllRules() {
    return this.pricingService.getAllPricingRules();
  }

  @Post('rules')
  @ApiOperation({ summary: 'Criar nova regra de precificação' })
  @ApiResponse({ status: 201, description: 'Regra criada com sucesso' })
  async createRule(@Body() ruleData: any) {
    return this.pricingService.createPricingRule(ruleData);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: 'Atualizar regra de precificação' })
  @ApiResponse({ status: 200, description: 'Regra atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Regra não encontrada' })
  async updateRule(@Param('id') id: string, @Body() updates: any) {
    return this.pricingService.updatePricingRule(id, updates);
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: 'Excluir regra de precificação' })
  @ApiResponse({ status: 200, description: 'Regra excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Regra não encontrada' })
  async deleteRule(@Param('id') id: string) {
    await this.pricingService.deletePricingRule(id);
    return { message: 'Regra de precificação excluída com sucesso' };
  }

  @Post('seed-default-rules')
  @ApiOperation({ summary: 'Criar regras padrão (apenas desenvolvimento)' })
  @ApiResponse({ status: 200, description: 'Regras padrão criadas' })
  async seedDefaultRules() {
    await this.pricingService.seedDefaultRules();
    return { message: 'Regras padrão criadas com sucesso' };
  }
}
