/**
 * Freelaw AI Studio - API SDK
 * SDK TypeScript para integração com backend NestJS
 */

export interface PricingFactors {
  serviceType: 'petition' | 'contract' | 'opinion' | 'hearing' | 'analysis';
  legalArea: 'civil' | 'criminal' | 'labor' | 'tax' | 'corporate' | 'family' | 'administrative';
  urgencyLevel: 'normal' | 'urgent' | 'super_urgent';
  contractorPlan: 'starter' | 'professional' | 'enterprise';
  providerProfile: 'calibration' | 'restricted' | 'adjustment' | 'elite';
  complexityMultiplier?: number;
  estimatedHours?: number;
}

export interface PricingResult {
  basePrice: number;
  finalPrice: number;
  providerAmount: number; // 100% para prestador
  appliedRule: {
    id: string;
    name: string;
    description?: string;
  };
  breakdown: {
    urgencyMultiplier: number;
    complexityMultiplier: number;
    providerMultiplier: number;
    planMultiplier: number;
  };
}

export interface WalletBalance {
  balance: number;
  pendingBalance: number;
  blockedBalance: number;
  availableBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'withdrawal';
  amount: number;
  fees: number;
  netAmount: number;
  status: 'pending' | 'completed' | 'processing' | 'failed';
  paymentMethod?: 'pix' | 'bank_slip' | 'credit_card';
  description: string;
  serviceOrderId?: string;
  createdAt: string;
  processedAt?: string;
}

export interface TransactionHistory {
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
}

export interface BankAccount {
  id: string;
  bankCode: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  accountDigit: string;
  accountType: 'checking' | 'savings';
  accountHolderName: string;
  accountHolderDocument: string;
  pixKey?: string;
  pixKeyType?: string;
  isVerified: boolean;
  isActive: boolean;
  formattedAccount: string;
  maskedAccount: string;
}

export interface WithdrawalRequest {
  amount: number;
  paymentMethod: 'pix' | 'bank_slip' | 'credit_card';
  bankAccountId?: string;
  notes?: string;
}

export interface CreateBankAccountRequest {
  bankCode: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  accountDigit: string;
  accountType: 'checking' | 'savings';
  accountHolderName: string;
  accountHolderDocument: string;
  pixKey?: string;
  pixKeyType?: string;
}

// Provider interfaces
export interface Provider {
  id: string;
  fullName: string;
  email: string;
  oabNumber: string;
  oabState: string;
  profile: 'calibration' | 'restricted' | 'adjustment' | 'elite';
  yearsExperience: number;
  specialties: string[];
  summary?: string;
  university?: string;
  completionYear?: number;
  isVerified: boolean;
  isPartner: boolean;
  highVolume: boolean;
  averageRating: number;
  totalServices: number;
  servicesCompleted: number;
  weeklyAvailability: number;
  availabilityDays: string[];
  workOnHolidays: boolean;
  maxConcurrentServices: number;
  canAcceptNewService: boolean;
  createdAt: string;
}

export interface CreateProviderRequest {
  fullName: string;
  email: string;
  oabNumber: string;
  oabState: string;
  yearsExperience: number;
  specialties: string[];
  summary?: string;
  university?: string;
  completionYear?: number;
  weeklyAvailability: number;
  availabilityDays: string[];
  workOnHolidays?: boolean;
  highVolume?: boolean;
}

// Service Order interfaces
export interface ServiceOrder {
  id: string;
  title: string;
  description: string;
  type: 'petition' | 'contract' | 'opinion' | 'hearing' | 'analysis';
  legalArea: 'civil' | 'criminal' | 'labor' | 'tax' | 'corporate' | 'family' | 'administrative';
  urgency: 'normal' | 'urgent' | 'super_urgent';
  status: string;
  basePrice: number;
  finalPrice: number;
  providerAmount: number;
  estimatedDelivery?: string;
  deliveredAt?: string;
  completedAt?: string;
  attachments: string[];
  finalDocument?: string;
  rating?: number;
  ratingFeedback?: string;
  revisionCount: number;
  provider?: {
    id: string;
    fullName: string;
    profile: string;
    averageRating: number;
    isVerified: boolean;
  };
  isOverdue: boolean;
  canRequestRevision: boolean;
  createdAt: string;
}

export interface CreateServiceOrderRequest {
  title: string;
  description: string;
  type: 'petition' | 'contract' | 'opinion' | 'hearing' | 'analysis';
  legalArea: 'civil' | 'criminal' | 'labor' | 'tax' | 'corporate' | 'family' | 'administrative';
  urgency?: 'normal' | 'urgent' | 'super_urgent';
  contractorPlan: 'starter' | 'professional' | 'enterprise';
  estimatedDelivery?: string;
  attachments?: string[];
  complexityMultiplier?: number;
  estimatedHours?: number;
}

export interface RevisionRequest {
  reason: string;
  detailedFeedback: string;
  attachments?: string[];
}

export class FreelawAPI {
  private baseURL: string;
  private token?: string;

  constructor(baseURL: string = 'http://localhost:4000/api') {
    this.baseURL = baseURL;
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Pricing APIs
  async calculatePrice(factors: PricingFactors): Promise<PricingResult> {
    return this.request<PricingResult>('/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(factors),
    });
  }

  // Wallet APIs
  async getWalletBalance(): Promise<WalletBalance> {
    return this.request<WalletBalance>('/wallet/balance');
  }

  async getTransactionHistory(limit: number = 50, offset: number = 0): Promise<TransactionHistory> {
    return this.request<TransactionHistory>(`/wallet/transactions?limit=${limit}&offset=${offset}`);
  }

  async requestWithdrawal(withdrawal: WithdrawalRequest): Promise<Transaction> {
    return this.request<Transaction>('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(withdrawal),
    });
  }

  async getBankAccounts(): Promise<BankAccount[]> {
    return this.request<BankAccount[]>('/wallet/bank-accounts');
  }

  async createBankAccount(account: CreateBankAccountRequest): Promise<BankAccount> {
    return this.request<BankAccount>('/wallet/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  }

  async deleteBankAccount(accountId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/wallet/bank-accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  // Provider APIs
  async applyAsProvider(application: CreateProviderRequest): Promise<{ message: string; providerId: string }> {
    return this.request<{ message: string; providerId: string }>('/providers/apply', {
      method: 'POST',
      body: JSON.stringify(application),
    });
  }

  async getProviderProfile(): Promise<Provider> {
    return this.request<Provider>('/providers/profile');
  }

  async updateProviderProfile(updates: Partial<CreateProviderRequest>): Promise<{ message: string }> {
    return this.request<{ message: string }>('/providers/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getProviderDashboard(): Promise<any> {
    return this.request<any>('/providers/dashboard');
  }

  async startEvaluation(): Promise<any> {
    return this.request<any>('/providers/evaluation/start', {
      method: 'POST',
    });
  }

  async submitEvaluation(evaluationId: string, pieces: any[]): Promise<any> {
    return this.request<any>('/providers/evaluation/submit', {
      method: 'POST',
      body: JSON.stringify({ evaluationId, pieces }),
    });
  }

  async getAvailableWork(limit: number = 20, offset: number = 0): Promise<any> {
    return this.request<any>(`/providers/available-work?limit=${limit}&offset=${offset}`);
  }

  async acceptWork(orderId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/providers/work/${orderId}/accept`, {
      method: 'POST',
    });
  }

  async submitWork(orderId: string, document: string, notes?: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/providers/work/${orderId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ document, notes }),
    });
  }

  // Service Order APIs
  async createServiceOrder(order: CreateServiceOrderRequest): Promise<any> {
    return this.request<any>('/service-orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async getServiceOrders(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: ServiceOrder[]; total: number; hasMore: boolean }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    return this.request<{ orders: ServiceOrder[]; total: number; hasMore: boolean }>(
      `/service-orders?${params.toString()}`
    );
  }

  async getServiceOrder(id: string): Promise<ServiceOrder> {
    return this.request<ServiceOrder>(`/service-orders/${id}`);
  }

  async approveServiceOrder(id: string, rating?: number, feedback?: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/service-orders/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ rating, feedback }),
    });
  }

  async requestRevision(id: string, revision: RevisionRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/service-orders/${id}/request-revision`, {
      method: 'POST',
      body: JSON.stringify(revision),
    });
  }

  async cancelServiceOrder(id: string, reason: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/service-orders/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async getServiceOrderRevisions(id: string): Promise<any> {
    return this.request<any>(`/service-orders/${id}/revisions`);
  }

  // Tasks APIs
  async getTasks(filters?: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    return this.request<any>(`/tasks?${params.toString()}`);
  }

  async createTask(taskData: any): Promise<any> {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: string, updates: any): Promise<any> {
    return this.request<any>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async startTask(id: string): Promise<any> {
    return this.request<any>(`/tasks/${id}/start`, {
      method: 'PUT',
    });
  }

  async completeTask(id: string, spentMinutes?: number, notes?: string): Promise<any> {
    return this.request<any>(`/tasks/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ spentMinutes, notes }),
    });
  }

  async deleteTask(id: string): Promise<any> {
    return this.request<any>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async getTaskInsights(): Promise<any> {
    return this.request<any>('/tasks/insights');
  }

  async generateTasksFromServiceOrder(serviceOrderId: string): Promise<any> {
    return this.request<any>(`/tasks/generate-from-service/${serviceOrderId}`, {
      method: 'POST',
    });
  }

  async analyzeTaskPriority(id: string): Promise<any> {
    return this.request<any>(`/tasks/${id}/analyze-priority`, {
      method: 'PUT',
    });
  }

  // Utility methods
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  }

  static getUrgencyLabel(level: string): string {
    const labels = {
      normal: 'Normal (7 dias)',
      urgent: 'Urgente (3 dias)',
      super_urgent: 'Super Urgente (24h)',
    };
    return labels[level as keyof typeof labels] || level;
  }

  static getProfileLabel(profile: string): string {
    const labels = {
      calibration: 'Calibração (até 10 serviços)',
      restricted: 'Acesso Restrito (até 5 serviços)',
      adjustment: 'Fase de Ajuste (até 20 serviços)',
      elite: 'Elite (até 30 serviços)',
    };
    return labels[profile as keyof typeof labels] || profile;
  }
}

// Export singleton instance
export const freelawAPI = new FreelawAPI();

// Export types for use in components
export type {
  PricingFactors,
  PricingResult,
  WalletBalance,
  Transaction,
  TransactionHistory,
  BankAccount,
  WithdrawalRequest,
  CreateBankAccountRequest,
};
