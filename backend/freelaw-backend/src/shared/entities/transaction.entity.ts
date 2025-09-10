import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TransactionType, TransactionStatus, PaymentMethod } from '../enums';
import { ProviderWallet } from './provider-wallet.entity';
import { ServiceOrder } from './service-order.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wallet_id' })
  walletId: string;

  @Column({ name: 'service_order_id', nullable: true })
  serviceOrderId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fees: number;

  @Column({ name: 'net_amount', type: 'decimal', precision: 10, scale: 2 })
  netAmount: number;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'external_id', nullable: true })
  externalId: string; // ID do gateway de pagamento

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date;

  // Relationships
  @ManyToOne(() => ProviderWallet, wallet => wallet.transactions)
  @JoinColumn({ name: 'wallet_id' })
  wallet: ProviderWallet;

  @ManyToOne(() => ServiceOrder, order => order.transactions, { nullable: true })
  @JoinColumn({ name: 'service_order_id' })
  serviceOrder: ServiceOrder;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Static methods for fee calculation
  static calculateFees(amount: number, method: PaymentMethod): number {
    switch (method) {
      case PaymentMethod.PIX:
      case PaymentMethod.BANK_SLIP:
        return 1.75;
      case PaymentMethod.CREDIT_CARD:
        return Number(amount) * 0.023; // 2.30%
      default:
        return 0;
    }
  }

  static calculateNetAmount(amount: number, method: PaymentMethod): number {
    const fees = this.calculateFees(amount, method);
    return Number(amount) - fees;
  }
}

