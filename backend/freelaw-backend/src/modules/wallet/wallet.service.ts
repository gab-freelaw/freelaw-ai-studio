import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

import { ProviderWallet } from '../../shared/entities/provider-wallet.entity';
import { Transaction } from '../../shared/entities/transaction.entity';
import { BankAccount } from './entities/bank-account.entity';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { WithdrawalRequestDto } from './dto/withdrawal-request.dto';
import { TransactionType, TransactionStatus, PaymentMethod } from '../../shared/enums';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(ProviderWallet)
    private walletRepository: Repository<ProviderWallet>,
    
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    
    @InjectQueue('wallet-processing')
    private walletQueue: Queue,
  ) {}

  // Criar ou buscar carteira do prestador
  async getOrCreateWallet(providerId: string): Promise<ProviderWallet> {
    let wallet = await this.walletRepository.findOne({
      where: { providerId },
      relations: ['transactions'],
    });

    if (!wallet) {
      wallet = this.walletRepository.create({
        providerId,
        balance: 0,
        pendingBalance: 0,
        blockedBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      });
      await this.walletRepository.save(wallet);
    }

    return wallet;
  }

  // Adicionar crédito na carteira (quando serviço é aprovado)
  async addCredit(
    providerId: string,
    amount: number,
    serviceOrderId: string,
    description?: string,
  ): Promise<Transaction> {
    const wallet = await this.getOrCreateWallet(providerId);

    // Criar transação
    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      serviceOrderId,
      type: TransactionType.CREDIT,
      amount,
      fees: 0,
      netAmount: amount,
      status: TransactionStatus.COMPLETED,
      description: description || `Pagamento por serviço #${serviceOrderId.slice(-8)}`,
      processedAt: new Date(),
    });

    await this.transactionRepository.save(transaction);

    // Atualizar saldo da carteira
    wallet.addCredit(amount);
    await this.walletRepository.save(wallet);

    return transaction;
  }

  // Solicitar saque
  async requestWithdrawal(
    providerId: string,
    withdrawalDto: WithdrawalRequestDto,
  ): Promise<Transaction> {
    const wallet = await this.getOrCreateWallet(providerId);

    // Validar saldo disponível
    if (Number(wallet.balance) < withdrawalDto.amount) {
      throw new BadRequestException('Saldo insuficiente para saque');
    }

    // Validar valor mínimo
    if (withdrawalDto.amount < 1) {
      throw new BadRequestException('Valor mínimo para saque é R$ 1,00');
    }

    // Calcular taxas
    const fees = Transaction.calculateFees(withdrawalDto.amount, withdrawalDto.paymentMethod);
    const netAmount = Transaction.calculateNetAmount(withdrawalDto.amount, withdrawalDto.paymentMethod);

    // Validar se após as taxas ainda há valor
    if (netAmount <= 0) {
      throw new BadRequestException('Valor do saque insuficiente para cobrir as taxas');
    }

    // Bloquear valor na carteira
    const blocked = wallet.blockAmount(withdrawalDto.amount);
    if (!blocked) {
      throw new BadRequestException('Não foi possível bloquear o valor para saque');
    }

    // Criar transação de saque
    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      type: TransactionType.WITHDRAWAL,
      amount: withdrawalDto.amount,
      fees,
      netAmount,
      status: TransactionStatus.PROCESSING,
      paymentMethod: withdrawalDto.paymentMethod,
      description: `Saque via ${withdrawalDto.paymentMethod.toUpperCase()}`,
    });

    await this.transactionRepository.save(transaction);
    await this.walletRepository.save(wallet);

    // Adicionar à fila de processamento
    await this.walletQueue.add('process-withdrawal', {
      transactionId: transaction.id,
      providerId,
      bankAccountId: withdrawalDto.bankAccountId,
    });

    return transaction;
  }

  // Buscar saldo da carteira
  async getWalletBalance(providerId: string) {
    const wallet = await this.getOrCreateWallet(providerId);
    
    return {
      balance: Number(wallet.balance),
      pendingBalance: Number(wallet.pendingBalance),
      blockedBalance: Number(wallet.blockedBalance),
      availableBalance: wallet.availableBalance,
      totalEarned: Number(wallet.totalEarned),
      totalWithdrawn: Number(wallet.totalWithdrawn),
    };
  }

  // Buscar histórico de transações
  async getTransactionHistory(
    providerId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const wallet = await this.getOrCreateWallet(providerId);

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { walletId: wallet.id },
      relations: ['serviceOrder'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        fees: Number(t.fees),
        netAmount: Number(t.netAmount),
        status: t.status,
        paymentMethod: t.paymentMethod,
        description: t.description,
        serviceOrderId: t.serviceOrderId,
        createdAt: t.createdAt,
        processedAt: t.processedAt,
      })),
      total,
      hasMore: offset + limit < total,
    };
  }

  // Gerenciar contas bancárias
  async createBankAccount(
    providerId: string,
    bankAccountDto: CreateBankAccountDto,
  ): Promise<BankAccount> {
    const bankAccount = this.bankAccountRepository.create({
      ...bankAccountDto,
      providerId,
    });

    return this.bankAccountRepository.save(bankAccount);
  }

  async getBankAccounts(providerId: string): Promise<BankAccount[]> {
    return this.bankAccountRepository.find({
      where: { providerId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteBankAccount(providerId: string, accountId: string): Promise<void> {
    const account = await this.bankAccountRepository.findOne({
      where: { id: accountId, providerId },
    });

    if (!account) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    account.isActive = false;
    await this.bankAccountRepository.save(account);
  }

  // Processar saque (chamado pela fila)
  async processWithdrawal(transactionId: string): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['wallet'],
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    try {
      // Aqui seria a integração com gateway de pagamento
      // Por enquanto, simular sucesso
      await this.simulatePaymentGateway(transaction);

      // Atualizar status da transação
      transaction.status = TransactionStatus.COMPLETED;
      transaction.processedAt = new Date();
      await this.transactionRepository.save(transaction);

      // Liberar valor bloqueado
      const wallet = transaction.wallet;
      wallet.releaseBlockedAmount(Number(transaction.amount));
      await this.walletRepository.save(wallet);

    } catch (error) {
      // Em caso de erro, reverter bloqueio
      transaction.status = TransactionStatus.FAILED;
      await this.transactionRepository.save(transaction);

      const wallet = transaction.wallet;
      wallet.balance = Number(wallet.balance) + Number(transaction.amount);
      wallet.blockedBalance = Number(wallet.blockedBalance) - Number(transaction.amount);
      await this.walletRepository.save(wallet);

      throw error;
    }
  }

  // Simular gateway de pagamento
  private async simulatePaymentGateway(transaction: Transaction): Promise<void> {
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular 95% de sucesso
    if (Math.random() > 0.95) {
      throw new Error('Falha no gateway de pagamento');
    }
    
    transaction.externalId = `PAY_${Date.now()}`;
  }
}
