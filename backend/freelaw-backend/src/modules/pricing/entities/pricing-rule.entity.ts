import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ServiceType,
  LegalArea,
  UrgencyLevel,
  ContractorPlan,
  ProviderProfile,
} from '../../../shared/enums';

@Entity('pricing_rules')
export class PricingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Identificação da regra
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  // Critérios de aplicação
  @Column({ name: 'service_type', type: 'enum', enum: ServiceType, nullable: true })
  serviceType: ServiceType;

  @Column({ name: 'legal_area', type: 'enum', enum: LegalArea, nullable: true })
  legalArea: LegalArea;

  @Column({ name: 'urgency_level', type: 'enum', enum: UrgencyLevel, nullable: true })
  urgencyLevel: UrgencyLevel;

  @Column({ name: 'contractor_plan', type: 'enum', enum: ContractorPlan, nullable: true })
  contractorPlan: ContractorPlan;

  @Column({ name: 'provider_profile', type: 'enum', enum: ProviderProfile, nullable: true })
  providerProfile: ProviderProfile;

  // Valores
  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ name: 'min_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  minPrice: number;

  @Column({ name: 'max_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxPrice: number;

  // Multiplicadores
  @Column({ name: 'urgency_multiplier', type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  urgencyMultiplier: number;

  @Column({ name: 'complexity_multiplier', type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  complexityMultiplier: number;

  @Column({ name: 'provider_multiplier', type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  providerMultiplier: number;

  @Column({ name: 'plan_multiplier', type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  planMultiplier: number;

  // Prestador recebe 100% do valor calculado
  @Column({ name: 'provider_percentage', type: 'decimal', precision: 5, scale: 2, default: 100.0 })
  providerPercentage: number;

  // Controle
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'priority', type: 'int', default: 0 })
  priority: number; // Para resolver conflitos entre regras

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Método para calcular preço final (prestador recebe 100%)
  calculatePrice(factors: {
    urgencyMultiplier?: number;
    complexityMultiplier?: number;
    providerMultiplier?: number;
    planMultiplier?: number;
  } = {}): {
    basePrice: number;
    finalPrice: number;
    providerAmount: number;
  } {
    const urgency = factors.urgencyMultiplier || this.urgencyMultiplier;
    const complexity = factors.complexityMultiplier || this.complexityMultiplier;
    const provider = factors.providerMultiplier || this.providerMultiplier;
    const plan = factors.planMultiplier || this.planMultiplier;

    const finalPrice = Number(this.basePrice) * urgency * complexity * provider * plan;
    const providerAmount = finalPrice * (Number(this.providerPercentage) / 100);

    return {
      basePrice: Number(this.basePrice),
      finalPrice: Number(finalPrice.toFixed(2)),
      providerAmount: Number(providerAmount.toFixed(2)),
    };
  }
}
