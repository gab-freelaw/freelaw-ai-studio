import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AccountType } from '../../../shared/enums';
import { Provider } from '../../../shared/entities/provider.entity';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provider_id' })
  providerId: string;

  @Column({ name: 'bank_code' })
  bankCode: string;

  @Column({ name: 'bank_name' })
  bankName: string;

  @Column()
  agency: string;

  @Column({ name: 'account_number' })
  accountNumber: string;

  @Column({ name: 'account_digit' })
  accountDigit: string;

  @Column({ name: 'account_type', type: 'enum', enum: AccountType })
  accountType: AccountType;

  @Column({ name: 'account_holder_name' })
  accountHolderName: string;

  @Column({ name: 'account_holder_document' })
  accountHolderDocument: string; // CPF/CNPJ

  @Column({ name: 'pix_key', nullable: true })
  pixKey: string;

  @Column({ name: 'pix_key_type', nullable: true })
  pixKeyType: string; // CPF, EMAIL, PHONE, RANDOM

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Relationships
  @ManyToOne(() => Provider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties
  get formattedAccount(): string {
    return `${this.agency}-${this.accountNumber}-${this.accountDigit}`;
  }

  get maskedAccount(): string {
    const masked = this.accountNumber.replace(/\d(?=\d{4})/g, '*');
    return `${this.agency}-${masked}-${this.accountDigit}`;
  }
}

