import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { PerformanceClassification } from '../enums';
import { Provider } from './provider.entity';

@Entity('performance_metrics')
export class PerformanceMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provider_id' })
  providerId: string;

  // Métricas dos últimos 30 dias
  @Column({ name: 'services_completed_30d', type: 'int', default: 0 })
  servicesCompleted30d: number;

  @Column({ name: 'substitutions_30d', type: 'int', default: 0 })
  substitutions30d: number;

  @Column({ name: 'desistances_30d', type: 'int', default: 0 })
  desistances30d: number;

  @Column({ name: 'low_ratings_30d', type: 'int', default: 0 })
  lowRatings30d: number; // Avaliações 1 e 2

  @Column({ name: 'unique_clients_30d', type: 'int', default: 0 })
  uniqueClients30d: number;

  // Cálculos automáticos
  @Column({ name: 'performance_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  performanceRate: number; // (intercorrências / aprovados) * 100

  @Column({
    name: 'classification',
    type: 'enum',
    enum: PerformanceClassification,
    default: PerformanceClassification.GOOD,
  })
  classification: PerformanceClassification;

  // Flags especiais
  @Column({ name: 'is_super_lawyer', default: false })
  isSuperLawyer: boolean;

  @Column({ name: 'low_engagement', default: false })
  lowEngagement: boolean; // Menos de 30 serviços em 30 dias

  @Column({ name: 'needs_recovery', default: false })
  needsRecovery: boolean; // Performance ruim

  @Column({ name: 'recovery_deadline', nullable: true })
  recoveryDeadline: Date;

  // Histórico
  @Column({ name: 'last_calculated_at' })
  lastCalculatedAt: Date;

  // Relationships
  @OneToOne(() => Provider, provider => provider.performanceMetrics)
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Methods
  calculatePerformanceRate(): number {
    if (this.servicesCompleted30d === 0) return 0;
    
    const intercurrences = this.substitutions30d + this.desistances30d + this.lowRatings30d;
    return Number(((intercurrences / this.servicesCompleted30d) * 100).toFixed(2));
  }

  updateClassification(): void {
    this.performanceRate = this.calculatePerformanceRate();

    if (this.performanceRate <= 5) {
      this.classification = PerformanceClassification.SUPER_LAWYER;
      this.isSuperLawyer = this.servicesCompleted30d >= 30 && this.uniqueClients30d >= 10;
    } else if (this.performanceRate <= 10) {
      this.classification = PerformanceClassification.GOOD;
      this.isSuperLawyer = false;
    } else if (this.performanceRate <= 20) {
      this.classification = PerformanceClassification.REGULAR;
      this.isSuperLawyer = false;
    } else {
      this.classification = PerformanceClassification.BAD_EXPERIENCE;
      this.isSuperLawyer = false;
      this.needsRecovery = true;
      
      if (!this.recoveryDeadline) {
        this.recoveryDeadline = new Date();
        this.recoveryDeadline.setDate(this.recoveryDeadline.getDate() + 30);
      }
    }

    this.lowEngagement = this.servicesCompleted30d < 30;
    this.lastCalculatedAt = new Date();
  }

  get classificationEmoji(): string {
    switch (this.classification) {
      case PerformanceClassification.SUPER_LAWYER:
        return '🟣';
      case PerformanceClassification.GOOD:
        return '🟡';
      case PerformanceClassification.REGULAR:
        return '🟠';
      case PerformanceClassification.BAD_EXPERIENCE:
        return '🔴';
      default:
        return '⚪';
    }
  }

  get classificationName(): string {
    switch (this.classification) {
      case PerformanceClassification.SUPER_LAWYER:
        return 'Super Jurista';
      case PerformanceClassification.GOOD:
        return 'Bom';
      case PerformanceClassification.REGULAR:
        return 'Regular';
      case PerformanceClassification.BAD_EXPERIENCE:
        return 'Experiência Ruim';
      default:
        return 'Não Classificado';
    }
  }
}

