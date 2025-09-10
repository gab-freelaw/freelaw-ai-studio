import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Provider } from './provider.entity';
import { Transaction } from './transaction.entity';

@Entity('provider_wallets')
export class ProviderWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provider_id' })
  providerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'pending_balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingBalance: number;

  @Column({ name: 'blocked_balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  blockedBalance: number;

  @Column({ name: 'total_earned', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarned: number;

  @Column({ name: 'total_withdrawn', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalWithdrawn: number;

  // Relationships
  @OneToOne(() => Provider, provider => provider.wallet)
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @OneToMany(() => Transaction, transaction => transaction.wallet)
  transactions: Transaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Methods
  addCredit(amount: number): void {
    this.balance = Number(this.balance) + Number(amount);
    this.totalEarned = Number(this.totalEarned) + Number(amount);
  }

  blockAmount(amount: number): boolean {
    if (Number(this.balance) >= Number(amount)) {
      this.balance = Number(this.balance) - Number(amount);
      this.blockedBalance = Number(this.blockedBalance) + Number(amount);
      return true;
    }
    return false;
  }

  releaseBlockedAmount(amount: number): void {
    this.blockedBalance = Number(this.blockedBalance) - Number(amount);
    this.totalWithdrawn = Number(this.totalWithdrawn) + Number(amount);
  }

  get availableBalance(): number {
    return Number(this.balance) + Number(this.pendingBalance);
  }
}

