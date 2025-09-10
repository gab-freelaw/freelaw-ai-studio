import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { ProviderWallet } from '../../shared/entities/provider-wallet.entity';
import { Transaction } from '../../shared/entities/transaction.entity';
import { BankAccount } from './entities/bank-account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderWallet, Transaction, BankAccount]),
    BullModule.registerQueue({
      name: 'wallet-processing',
    }),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}

