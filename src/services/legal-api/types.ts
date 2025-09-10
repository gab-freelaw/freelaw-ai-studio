/**
 * Legal API Provider Types and Interfaces
 */

export interface ProcessSearchResult {
  id: string;
  number: string;
  court: string;
  status: string;
  parties: {
    plaintiff: string[];
    defendant: string[];
  };
  movements: ProcessMovement[];
  lastUpdate: Date;
  value?: number;
  subject?: string;
  rawData?: any;
}

export interface ProcessMovement {
  id: string;
  date: Date;
  type: string;
  description: string;
  content?: string;
  attachments?: ProcessAttachment[];
}

export interface ProcessAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface PersonSearchResult {
  id: string;
  name: string;
  document: string;
  documentType: 'CPF' | 'CNPJ';
  processes: ProcessSummary[];
  addresses?: Address[];
  phones?: string[];
  emails?: string[];
}

export interface ProcessSummary {
  id: string;
  number: string;
  court: string;
  role: 'plaintiff' | 'defendant' | 'lawyer' | 'other';
  status: string;
  lastMovement?: Date;
}

export interface Address {
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface LegalDocument {
  id: string;
  type: 'petition' | 'sentence' | 'decision' | 'order' | 'other';
  title: string;
  content: string;
  date: Date;
  processId?: string;
  author?: string;
  url?: string;
}

export interface ApiProviderConfig {
  name: string;
  apiKey: string;
  apiSecret?: string;
  baseUrl: string;
  rateLimit?: {
    requests: number;
    period: number; // in milliseconds
  };
  pricing: {
    processSearch: number;
    personSearch: number;
    documentDownload: number;
    movementTracking: number;
  };
  features: {
    processSearch: boolean;
    personSearch: boolean;
    documentDownload: boolean;
    movementTracking: boolean;
    bulkSearch: boolean;
    webhook: boolean;
  };
  reliability: number; // 0-100 score
  averageResponseTime: number; // in milliseconds
}

export enum ApiProvider {
  ESCAVADOR = 'escavador',
  SOLUCIONARE = 'solucionare',
}

export interface ApiUsageMetrics {
  provider: ApiProvider;
  endpoint: string;
  timestamp: Date;
  responseTime: number;
  success: boolean;
  cost: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ProviderHealthStatus {
  provider: ApiProvider;
  isHealthy: boolean;
  lastCheck: Date;
  averageResponseTime: number;
  successRate: number;
  currentCredits?: number;
  creditLimit?: number;
}

export interface SearchOptions {
  preferredProvider?: ApiProvider;
  maxCost?: number;
  maxResponseTime?: number;
  fallbackEnabled?: boolean;
  cacheEnabled?: boolean;
  cacheDuration?: number; // in seconds
}

export interface LegalApiProvider {
  readonly name: ApiProvider;
  readonly config: ApiProviderConfig;
  
  // Core search methods
  searchProcess(processNumber: string, options?: SearchOptions): Promise<ProcessSearchResult>;
  searchPerson(document: string, options?: SearchOptions): Promise<PersonSearchResult>;
  getDocument(documentId: string, options?: SearchOptions): Promise<LegalDocument>;
  trackMovements(processId: string, since?: Date): Promise<ProcessMovement[]>;
  
  // Health and metrics
  checkHealth(): Promise<ProviderHealthStatus>;
  getUsageMetrics(since?: Date): Promise<ApiUsageMetrics[]>;
  estimateCost(operation: string, quantity?: number): number;
  
  // Credits and limits
  getRemainingCredits(): Promise<number>;
  isAvailable(): Promise<boolean>;
}

export interface ProviderSelectionStrategy {
  selectProvider(
    operation: string,
    providers: LegalApiProvider[],
    options?: SearchOptions
  ): Promise<LegalApiProvider>;
}