import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceOrder } from './service-order.entity';

@Entity('revision_requests')
export class RevisionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_order_id' })
  serviceOrderId: string;

  @Column({ name: 'requested_by' })
  requestedBy: string; // ID do usuário que solicitou

  @Column({ name: 'revision_number', type: 'int' })
  revisionNumber: number; // 1ª, 2ª, 3ª correção

  @Column()
  reason: string;

  @Column({ name: 'detailed_feedback', type: 'text' })
  detailedFeedback: string;

  @Column('text', { array: true, default: '{}' })
  attachments: string[]; // Documentos de referência

  @Column({ name: 'deadline', nullable: true })
  deadline: Date; // 24h após solicitação

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  // Provider response
  @Column({ name: 'provider_response', nullable: true })
  providerResponse: string;

  @Column({ name: 'changes_made', nullable: true })
  changesMade: string;

  @Column({ name: 'revised_document', nullable: true })
  revisedDocument: string;

  // Relationships
  @ManyToOne(() => ServiceOrder, order => order.revisionRequests)
  @JoinColumn({ name: 'service_order_id' })
  serviceOrder: ServiceOrder;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties
  get isOverdue(): boolean {
    if (!this.deadline || this.isCompleted) return false;
    return new Date() > this.deadline;
  }

  get hoursRemaining(): number {
    if (!this.deadline || this.isCompleted) return 0;
    const diffTime = this.deadline.getTime() - new Date().getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60)));
  }

  // Static method to calculate deadline (24h from request)
  static calculateDeadline(): Date {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 24);
    return deadline;
  }
}

