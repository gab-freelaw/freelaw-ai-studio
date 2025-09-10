import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum TaskType {
  PETITION = 'PETICAO',
  HEARING = 'AUDIENCIA',
  DEADLINE = 'PRAZO',
  DOCUMENT = 'DOCUMENTO',
  CALL = 'LIGACAO',
  EMAIL = 'EMAIL',
  ANALYSIS = 'ANALISE',
  OTHER = 'OUTRO',
}

export enum TaskPriority {
  URGENT = 'URGENTE',
  HIGH = 'ALTA',
  MEDIUM = 'MEDIA',
  LOW = 'BAIXA',
}

export enum TaskStatus {
  PENDING = 'PENDENTE',
  IN_PROGRESS = 'EM_ANDAMENTO',
  COMPLETED = 'CONCLUIDA',
  CANCELLED = 'CANCELADA',
}

export enum AIComplexity {
  SIMPLE = 'SIMPLES',
  MODERATE = 'MODERADA',
  COMPLEX = 'COMPLEXA',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column('text', { nullable: true })
  descricao: string;

  @Column({ type: 'enum', enum: TaskType })
  tipo: TaskType;

  @Column({ type: 'enum', enum: TaskPriority })
  prioridade: TaskPriority;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  // Relacionamentos
  @Column({ name: 'user_id' })
  userId: string; // Usuário responsável

  @Column({ name: 'office_id', nullable: true })
  officeId: string;

  @Column({ name: 'service_order_id', nullable: true })
  serviceOrderId: string;

  @Column({ name: 'process_id', nullable: true })
  processId: string;

  @Column({ name: 'contact_id', nullable: true })
  contactId: string;

  // Prazos e tempo
  @Column({ name: 'deadline', type: 'timestamp', nullable: true })
  deadline: Date | null;

  @Column({ name: 'estimated_minutes', type: 'int', nullable: true })
  estimatedMinutes: number;

  @Column({ name: 'spent_minutes', type: 'int', default: 0 })
  spentMinutes: number;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  // IA Integration
  @Column({ name: 'ai_suggestion', type: 'text', nullable: true })
  aiSuggestion: string;

  @Column({ name: 'ai_priority_score', type: 'int', nullable: true })
  aiPriorityScore: number; // 0-100

  @Column({ name: 'ai_complexity', type: 'enum', enum: AIComplexity, nullable: true })
  aiComplexity: AIComplexity;

  @Column({ name: 'ai_generated', default: false })
  aiGenerated: boolean; // Se foi criada pela IA

  @Column({ name: 'ai_auto_priority', default: false })
  aiAutoPriority: boolean; // Se prioridade foi definida pela IA

  // Metadata
  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column('jsonb', { nullable: true })
  metadata: any; // Dados adicionais específicos por tipo

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties
  get isOverdue(): boolean {
    if (!this.deadline) return false;
    return new Date() > this.deadline && this.status !== TaskStatus.COMPLETED;
  }

  get progressPercentage(): number {
    if (!this.estimatedMinutes || this.estimatedMinutes === 0) return 0;
    return Math.min(100, (this.spentMinutes / this.estimatedMinutes) * 100);
  }

  get timeRemaining(): number {
    if (!this.deadline) return 0;
    const now = new Date().getTime();
    const deadlineTime = this.deadline.getTime();
    const diff = deadlineTime - now;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60))); // Hours
  }

  get efficiency(): number {
    if (!this.estimatedMinutes || this.spentMinutes === 0 || this.status !== TaskStatus.COMPLETED) return 0;
    return Math.max(0, this.estimatedMinutes - this.spentMinutes);
  }
}
