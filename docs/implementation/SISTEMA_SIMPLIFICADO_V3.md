# 🎯 SISTEMA FREELAW SIMPLIFICADO - O QUE VAMOS IMPLEMENTAR

**Data:** 06/01/2025  
**Objetivo:** Sistema financeiro simples, pricing dinâmico e gamificação moderna

---

## 💰 1. SISTEMA FINANCEIRO SIMPLIFICADO

### Conceito: "Fez, Ganhou, Sacou"
```typescript
interface ProviderWallet {
  providerId: string
  balance: number // Saldo disponível
  pendingBalance: number // Aguardando liberação
  blockedBalance: number // Em processo de saque
}

interface Transaction {
  id: string
  providerId: string
  serviceOrderId: string
  amount: number
  type: 'credit' | 'withdrawal'
  status: 'pending' | 'completed' | 'processing'
  createdAt: Date
}

interface BankAccount {
  providerId: string
  bankCode: string
  agency: string
  accountNumber: string
  accountType: 'checking' | 'savings'
  pixKey?: string
}
```

### Fluxo Simples:
1. **Serviço aprovado** → Plataforma paga prestador 100% do valor
2. **Crédito na carteira** → Valor integral disponível
3. **Prestador solicita saque** → Transferência para conta bancária
4. **Visualização clara** → Dashboard com saldo e histórico

### Modelo de receita:
- **Cliente** paga assinatura mensal (R$ 299-1499)
- **Prestador** recebe 100% do valor calculado por serviço
- **Plataforma** lucra com assinatura, não com comissão

---

## 💎 2. PRICING DINÂMICO (SEM PROPOSTAS)

### Fatores de Preço:
```typescript
interface PricingFactors {
  // 1. Plano do Contratante
  contractorPlan: 'starter' | 'professional' | 'enterprise'
  
  // 2. Categoria do Prestador
  providerCategory: 'calibration' | 'restricted' | 'adjustment' | 'elite'
  
  // 3. Tipo de Serviço
  serviceType: 'petition' | 'contract' | 'opinion' | 'hearing' | 'analysis'
  
  // 4. Área do Direito
  legalArea: 'civil' | 'criminal' | 'labor' | 'tax' | 'corporate' | 'family'
  
  // 5. Prazo
  urgency: 'normal' | 'urgent' | 'super_urgent' // 7 dias, 3 dias, 24h
}

interface ServicePricing {
  basePrice: number
  providerAmount: number // 80%
  platformFee: number // 20%
  urgencyMultiplier: number
  complexityMultiplier: number
  finalPrice: number
}
```

### Tabela de Preços Base (Exemplo):
```typescript
const BASE_PRICES = {
  petition: {
    simple: 200,
    medium: 400,
    complex: 800
  },
  contract: {
    simple: 300,
    medium: 600,
    complex: 1200
  },
  hearing: {
    remote: 500,
    presential: 1000
  }
}

// Multiplicadores
const URGENCY_MULTIPLIERS = {
  normal: 1.0,    // 7 dias
  urgent: 1.5,    // 3 dias
  super_urgent: 2.0 // 24h
}

const PROVIDER_CATEGORY_MULTIPLIERS = {
  calibration: 0.8,
  restricted: 0.9,
  adjustment: 1.0,
  elite: 1.2
}
```

---

## 🏆 3. SISTEMA DE PERFIL E GAMIFICAÇÃO

### Perfis de Prestadores:
```typescript
enum ProviderProfile {
  CALIBRATION = 'calibration',     // Primeiros 30 serviços
  RESTRICTED = 'restricted',       // Nota < 3.8
  ADJUSTMENT = 'adjustment',       // Nota 3.8-4.1
  ELITE = 'elite'                  // Nota > 4.1
}

interface ProviderLimits {
  [ProviderProfile.CALIBRATION]: 10,
  [ProviderProfile.RESTRICTED]: 5,
  [ProviderProfile.ADJUSTMENT]: 20,
  [ProviderProfile.ELITE]: 30
}
```

### Sistema de Desempenho:
```typescript
interface PerformanceMetrics {
  providerId: string
  last30Days: {
    servicesCompleted: number
    substitutions: number
    desistances: number
    lowRatings: number // Avaliações 1 e 2
    uniqueClients: number
  }
  
  // Cálculo: (intercorrências / aprovados) * 100
  performanceRate: number
  classification: 'super_lawyer' | 'good' | 'regular' | 'bad_experience'
}

// Classificações
const PERFORMANCE_BANDS = {
  super_lawyer: { min: 0, max: 5, color: '🟣', perks: true },
  good: { min: 5.01, max: 10, color: '🟡' },
  regular: { min: 10.01, max: 20, color: '🟠' },
  bad_experience: { min: 20.01, max: 100, color: '🔴', recovery: true }
}
```

### Badges e Conquistas:
```typescript
interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  criteria: {
    servicesCompleted?: number
    averageRating?: number
    uniqueClients?: number
    zeroIntercurrences?: boolean
  }
}

// Exemplos
const ACHIEVEMENTS = [
  {
    id: 'super_lawyer',
    name: 'Super Jurista',
    criteria: {
      servicesCompleted: 30,
      uniqueClients: 10,
      performanceRate: 5
    }
  },
  {
    id: 'first_100',
    name: 'Centurião',
    criteria: { servicesCompleted: 100 }
  },
  {
    id: 'perfect_month',
    name: 'Mês Perfeito',
    criteria: { zeroIntercurrences: true }
  }
]
```

---

## 📊 4. STATUS SIMPLIFICADOS

### Apenas 8 Status Essenciais (com sistema de correções):
```typescript
enum ServiceStatus {
  PENDING_MATCH = 'pending_match',      // Aguardando match
  MATCHED = 'matched',                  // Prestador atribuído
  IN_PROGRESS = 'in_progress',          // Em elaboração
  IN_REVIEW = 'in_review',              // Em revisão interna
  DELIVERED = 'delivered',              // Entregue ao cliente
  REVISION_REQUESTED = 'revision_requested', // Cliente pediu correção
  COMPLETED = 'completed',              // Aprovado e pago
  CANCELLED = 'cancelled'               // Cancelado
}

// Fluxo com correções
PENDING_MATCH → MATCHED → IN_PROGRESS → IN_REVIEW → DELIVERED → COMPLETED
                                                        ↓          ↑
                                                REVISION_REQUESTED ↓
                                                        ↓
                                                    CANCELLED
```

### Sistema de Correções:
```typescript
interface RevisionRequest {
  id: string
  serviceOrderId: string
  requestedBy: string // ID do usuário do escritório
  requestedAt: Date
  reason: string
  detailedFeedback: string
  attachments?: string[] // Documentos de referência
  revisionNumber: number // 1ª, 2ª, 3ª correção
}

interface RevisionResponse {
  id: string
  revisionRequestId: string
  providerId: string
  submittedAt: Date
  changes: string // O que foi alterado
  newDocument: string // Documento corrigido
}

// Regras de negócio
const REVISION_RULES = {
  maxRevisions: 3, // Máximo de correções por serviço
  revisionDeadline: 24, // Horas para entregar correção
  affectsPerformance: true, // Conta como intercorrência após 2ª correção
  paymentOnApproval: true // Pagamento só após aprovação final
}
```

---

## 🚀 5. IMPLEMENTAÇÃO PRIORITÁRIA

### SPRINT 1 (1 semana): Sistema Financeiro
```typescript
// 1. Criar schemas/models
- ProviderWallet
- Transaction
- BankAccount

// 2. APIs essenciais
POST /api/wallet/withdraw
GET /api/wallet/balance
GET /api/wallet/transactions
POST /api/wallet/bank-account

// 3. Dashboard financeiro
- Saldo disponível
- Histórico de transações
- Solicitar saque
```

### SPRINT 2 (1 semana): Pricing Dinâmico
```typescript
// 1. Tabelas de preços
- Por tipo de serviço
- Por área do direito
- Por urgência

// 2. Calculadora de preços
- PricingService.calculate(factors)
- Aplicar multiplicadores
- Mostrar breakdown transparente

// 3. Interface de visualização
- Mostrar quanto o prestador vai receber
- Mostrar prazo esperado
```

### SPRINT 3 (1 semana): Perfis e Gamificação
```typescript
// 1. Sistema de perfis
- Calibração → Elite
- Limites por perfil
- Cálculo automático

// 2. Performance tracking
- Métricas últimos 30 dias
- Classificação automática
- Alertas de performance

// 3. Badges e conquistas
- Sistema de achievements
- Notificações de conquistas
- Display no perfil
```

### SPRINT 4 (1 semana): Status e Fluxos
```typescript
// 1. Migrar para 7 status
- Simplificar fluxos
- Automações em cada mudança
- Notificações

// 2. Dashboard unificado
- Visão clara do pipeline
- Ações disponíveis
- Prazos e alertas
```

---

## 💡 VANTAGENS DO MODELO SIMPLIFICADO

### Para Prestadores:
- ✅ **Transparência total**: "Fez X, ganhou Y"
- ✅ **Pagamento garantido**: Sem negociação de valores
- ✅ **Gamificação clara**: Metas e recompensas visíveis
- ✅ **Crescimento previsível**: Elite = mais serviços e melhor remuneração
- ✅ **Feedback construtivo**: Sistema de correções com orientações claras

### Para a Plataforma:
- ✅ **Pricing controlado**: Sem propostas variáveis
- ✅ **Qualidade garantida**: Sistema de performance automático
- ✅ **Escalabilidade**: Regras claras e automatizadas
- ✅ **Retenção**: Gamificação mantém engajamento
- ✅ **Melhoria contínua**: Correções geram aprendizado

### Para Contratantes:
- ✅ **Preço justo**: Baseado em fatores objetivos
- ✅ **Qualidade**: Apenas prestadores qualificados
- ✅ **Rapidez**: Match automático sem negociação
- ✅ **Confiança**: Sistema de performance transparente
- ✅ **Controle**: Podem solicitar até 3 correções

---

## 🎯 RESUMO EXECUTIVO

### O que estamos criando:
1. **Financeiro simples**: Carteira → Saque → Conta bancária
2. **Pricing algorítmico**: 5 fatores determinam o preço automaticamente
3. **4 perfis claros**: Calibração, Restrito, Ajuste, Elite
4. **Performance objetiva**: Taxa de intercorrências define classificação
5. **8 status apenas**: Fluxo linear com sistema de correções
6. **Sistema de correções**: Até 3 revisões com feedback detalhado

### Diferencial:
- Sem negociação de valores
- Sem propostas
- Sem complexidade desnecessária
- Foco em qualidade e performance
- Gamificação que engaja e retém

---

**PRÓXIMO PASSO:** Começar implementando o sistema de carteira digital!
