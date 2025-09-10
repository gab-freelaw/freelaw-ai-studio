import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { WalletService } from './wallet.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { WithdrawalRequestDto } from './dto/withdrawal-request.dto';

@ApiTags('Carteira')
@ApiBearerAuth()
@Controller('wallet')
// @UseGuards(JwtAuthGuard) // Implementar depois
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Buscar saldo da carteira' })
  @ApiResponse({ status: 200, description: 'Saldo da carteira' })
  async getBalance(@Request() req: any) {
    // TODO: Extrair providerId do JWT
    const providerId = req.user?.providerId || 'test-provider-id';
    return this.walletService.getWalletBalance(providerId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Histórico de transações' })
  @ApiResponse({ status: 200, description: 'Lista de transações' })
  async getTransactions(
    @Request() req: any,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    const providerId = req.user?.providerId || 'test-provider-id';
    return this.walletService.getTransactionHistory(providerId, limit, offset);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Solicitar saque' })
  @ApiResponse({ status: 201, description: 'Saque solicitado com sucesso' })
  @ApiResponse({ status: 400, description: 'Saldo insuficiente ou dados inválidos' })
  async requestWithdrawal(
    @Body() withdrawalDto: WithdrawalRequestDto,
    @Request() req: any,
  ) {
    const providerId = req.user?.providerId || 'test-provider-id';
    return this.walletService.requestWithdrawal(providerId, withdrawalDto);
  }

  @Get('bank-accounts')
  @ApiOperation({ summary: 'Listar contas bancárias' })
  @ApiResponse({ status: 200, description: 'Lista de contas bancárias' })
  async getBankAccounts(@Request() req: any) {
    const providerId = req.user?.providerId || 'test-provider-id';
    return this.walletService.getBankAccounts(providerId);
  }

  @Post('bank-accounts')
  @ApiOperation({ summary: 'Cadastrar conta bancária' })
  @ApiResponse({ status: 201, description: 'Conta bancária cadastrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createBankAccount(
    @Body() bankAccountDto: CreateBankAccountDto,
    @Request() req: any,
  ) {
    const providerId = req.user?.providerId || 'test-provider-id';
    return this.walletService.createBankAccount(providerId, bankAccountDto);
  }

  @Delete('bank-accounts/:id')
  @ApiOperation({ summary: 'Excluir conta bancária' })
  @ApiResponse({ status: 200, description: 'Conta bancária excluída' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  async deleteBankAccount(
    @Param('id') accountId: string,
    @Request() req: any,
  ) {
    const providerId = req.user?.providerId || 'test-provider-id';
    await this.walletService.deleteBankAccount(providerId, accountId);
    return { message: 'Conta bancária excluída com sucesso' };
  }

  // Endpoint para adicionar crédito (usado internamente)
  @Post('credit')
  @ApiOperation({ summary: 'Adicionar crédito (interno)' })
  async addCredit(
    @Body() body: {
      providerId: string;
      amount: number;
      serviceOrderId: string;
      description?: string;
    },
  ) {
    return this.walletService.addCredit(
      body.providerId,
      body.amount,
      body.serviceOrderId,
      body.description,
    );
  }
}

