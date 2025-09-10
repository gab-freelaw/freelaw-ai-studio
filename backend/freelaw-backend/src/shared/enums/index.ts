// Provider enums
export enum ProviderProfile {
  CALIBRATION = 'calibration',
  RESTRICTED = 'restricted', 
  ADJUSTMENT = 'adjustment',
  ELITE = 'elite',
}

export enum PerformanceClassification {
  SUPER_LAWYER = 'super_lawyer',
  GOOD = 'good',
  REGULAR = 'regular',
  BAD_EXPERIENCE = 'bad_experience',
}

// Service enums
export enum ServiceType {
  PETITION = 'petition',
  CONTRACT = 'contract',
  OPINION = 'opinion',
  HEARING = 'hearing',
  ANALYSIS = 'analysis',
}

export enum ServiceStatus {
  PENDING_MATCH = 'pending_match',
  MATCHED = 'matched',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DELIVERED = 'delivered',
  REVISION_REQUESTED = 'revision_requested',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum LegalArea {
  CIVIL = 'civil',
  CRIMINAL = 'criminal',
  LABOR = 'labor',
  TAX = 'tax',
  CORPORATE = 'corporate',
  FAMILY = 'family',
  ADMINISTRATIVE = 'administrative',
}

export enum UrgencyLevel {
  NORMAL = 'normal',      // 7 days
  URGENT = 'urgent',      // 3 days
  SUPER_URGENT = 'super_urgent', // 24h
}

// Financial enums
export enum TransactionType {
  CREDIT = 'credit',
  WITHDRAWAL = 'withdrawal',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  PROCESSING = 'processing',
  FAILED = 'failed',
}

export enum PaymentMethod {
  PIX = 'pix',
  BANK_SLIP = 'bank_slip',
  CREDIT_CARD = 'credit_card',
}

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
}

// Plan enums
export enum ContractorPlan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}
