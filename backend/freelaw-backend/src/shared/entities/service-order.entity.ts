import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import {
  ServiceStatus,
  ServiceType,
  LegalArea,
  UrgencyLevel,
  ContractorPlan,
} from '../enums';
import { Provider } from './provider.entity';
import { Transaction } from './transaction.entity';
import { RevisionRequest } from './revision-request.entity';

@Entity('service_orders')
export class ServiceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic info
  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: ServiceType })
  type: ServiceType;

  @Column({ name: 'legal_area', type: 'enum', enum: LegalArea })
  legalArea: LegalArea;

  @Column({ type: 'enum', enum: UrgencyLevel, default: UrgencyLevel.NORMAL })
  urgency: UrgencyLevel;

  @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.PENDING_MATCH })
  status: ServiceStatus;

  // Contractor info
  @Column({ name: 'contractor_id' })
  contractorId: string; // Referência ao escritório/usuário

  @Column({ name: 'contractor_plan', type: 'enum', enum: ContractorPlan })
  contractorPlan: ContractorPlan;

  // Provider assignment
  @Column({ name: 'provider_id', nullable: true })
  providerId: string;

  @Column({ name: 'matched_at', nullable: true })
  matchedAt: Date;

  // Pricing
  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ name: 'final_price', type: 'decimal', precision: 10, scale: 2 })
  finalPrice: number;

  @Column({ name: 'provider_amount', type: 'decimal', precision: 10, scale: 2 })
  providerAmount: number; // 100% do valor calculado

  // Deadlines
  @Column({ name: 'estimated_delivery', nullable: true })
  estimatedDelivery: Date;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  // Documents and files
  @Column('text', { array: true, default: '{}' })
  attachments: string[];

  @Column({ name: 'final_document', nullable: true })
  finalDocument: string;

  // Quality metrics
  @Column({ type: 'int', nullable: true, default: null })
  rating: number; // 1-5

  @Column({ name: 'rating_feedback', nullable: true })
  ratingFeedback: string;

  @Column({ name: 'revision_count', type: 'int', default: 0 })
  revisionCount: number;

  // Relationships
  @ManyToOne(() => Provider, provider => provider.serviceOrders, { nullable: true })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @OneToMany(() => Transaction, transaction => transaction.serviceOrder)
  transactions: Transaction[];

  @OneToMany(() => RevisionRequest, revision => revision.serviceOrder)
  revisionRequests: RevisionRequest[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties
  get isOverdue(): boolean {
    if (!this.estimatedDelivery) return false;
    return new Date() > this.estimatedDelivery && 
           ![ServiceStatus.COMPLETED, ServiceStatus.CANCELLED].includes(this.status);
  }

  get canRequestRevision(): boolean {
    return this.revisionCount < 3 && this.status === ServiceStatus.DELIVERED;
  }

  get daysSinceCreated(): number {
    const diffTime = Math.abs(new Date().getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
