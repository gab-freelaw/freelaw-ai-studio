import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ProviderProfile } from '../enums';
import { ProviderWallet } from './provider-wallet.entity';
import { PerformanceMetrics } from './performance-metrics.entity';
import { ServiceOrder } from './service-order.entity';

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string; // Referência ao usuário do Supabase

  @Column({ name: 'full_name' })
  fullName: string;

  @Column()
  email: string;

  @Column({ name: 'oab_number' })
  oabNumber: string;

  @Column({ name: 'oab_state' })
  oabState: string;

  @Column({ type: 'enum', enum: ProviderProfile, default: ProviderProfile.CALIBRATION })
  profile: ProviderProfile;

  @Column({ name: 'years_experience', type: 'int', default: 0 })
  yearsExperience: number;

  @Column('text', { array: true, default: '{}' })
  specialties: string[];

  @Column('text', { nullable: true })
  summary: string;

  @Column({ name: 'university', nullable: true })
  university: string;

  @Column({ name: 'completion_year', type: 'int', nullable: true })
  completionYear: number;

  // Status flags
  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_partner', default: false })
  isPartner: boolean;

  @Column({ name: 'high_volume', default: false })
  highVolume: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Performance
  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ name: 'total_services', type: 'int', default: 0 })
  totalServices: number;

  @Column({ name: 'services_completed', type: 'int', default: 0 })
  servicesCompleted: number;

  // Preferences
  @Column({ name: 'weekly_availability', type: 'int', default: 40 })
  weeklyAvailability: number;

  @Column('text', { array: true, default: '{}' })
  availabilityDays: string[];

  @Column({ name: 'work_on_holidays', default: false })
  workOnHolidays: boolean;

  // Relationships
  @OneToOne(() => ProviderWallet, wallet => wallet.provider)
  wallet: ProviderWallet;

  @OneToOne(() => PerformanceMetrics, metrics => metrics.provider)
  performanceMetrics: PerformanceMetrics;

  @OneToMany(() => ServiceOrder, order => order.provider)
  serviceOrders: ServiceOrder[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties
  get maxConcurrentServices(): number {
    switch (this.profile) {
      case ProviderProfile.CALIBRATION:
        return 10;
      case ProviderProfile.RESTRICTED:
        return 5;
      case ProviderProfile.ADJUSTMENT:
        return 20;
      case ProviderProfile.ELITE:
        return 30;
      default:
        return 10;
    }
  }

  get canAcceptNewService(): boolean {
    // Implementar lógica baseada em serviços ativos
    return true; // Placeholder
  }
}

