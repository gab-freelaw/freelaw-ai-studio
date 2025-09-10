# 📊 ANÁLISE DE GAPS - O QUE JÁ TEMOS VS O QUE FALTA DO LEGADO

**Data:** 06/01/2025  
**Objetivo:** Mapear exatamente o que já implementamos e o que precisamos trazer do legado

---

## ✅ O QUE JÁ TEMOS IMPLEMENTADO NO GAB-AI-FREELAW

### 1. **Sistema de Prestadores** ✅ PARCIAL
```typescript
// TEMOS:
✅ Cadastro de prestadores (providers/apply)
✅ Upload de documentos
✅ Avaliação por IA
✅ Dashboard básico
✅ Tabelas: providers, provider_documents, provider_evaluations

// FALTA (comparando com legado):
❌ Níveis/Rankings (70-, 70+, 80+, 90+)
❌ Categorias com limites de serviços
❌ Sistema de créditos
❌ Verificação/badges (verificado, parceiro, alto volume)
❌ Preferências de trabalho (dias, horários, feriados)
❌ Missões/Quests para onboarding
```

### 2. **Sistema de Matching** ✅ BÁSICO
```typescript
// TEMOS:
✅ MatchingService básico
✅ Score por 6 critérios
✅ Atribuição automática/manual
✅ Tabela: matching_metrics

// FALTA (comparando com legado):
❌ Propostas com valores (provider_value, freelaw_value)
❌ Campo "why_are_you_the_best"
❌ Sistema de aceite/rejeição múltiplo
❌ Rejected_by_provider, rejected_by_requestor
❌ Match específico vs geral
❌ Histórico de matches
```

### 3. **Sistema de Delegações/Ordens** ✅ BÁSICO
```typescript
// TEMOS:
✅ Criar delegação
✅ Precificação automática
✅ Chat integrado
✅ Status básicos
✅ Tabela: delegations

// FALTA (comparando com legado):
❌ ServicePackage (agrupamento de ordens)
❌ Status granulares (15+ status no legado)
❌ Deadline com data + hora
❌ Parte representada (autor/réu)
❌ Orientações detalhadas
❌ Tracking completo do ciclo de vida
```

### 4. **Sistema Financeiro** ❌ NÃO IMPLEMENTADO
```typescript
// FALTA TUDO:
❌ Carteira digital (provider_wallet)
❌ Transações e saques
❌ Invoices/Faturas
❌ Métodos de pagamento (PIX, Boleto, Cartão)
❌ Cálculo de comissões (20% automático)
❌ Taxas por método de pagamento
❌ Histórico financeiro
❌ Integração com gateways (Iugu/Stripe)
```

### 5. **Publicações** ✅ MOCK APENAS
```typescript
// TEMOS:
✅ Interface de publicações
✅ Mock data

// FALTA:
❌ Integração real com Solucionare
❌ Captura automática de publicações
❌ Parser de diários oficiais
❌ Vinculação com processos
❌ Alertas de publicações
```

### 6. **Gamificação** ❌ NÃO IMPLEMENTADO
```typescript
// FALTA TUDO:
❌ Sistema de quests/missões
❌ Progresso do prestador
❌ Recompensas e pontos
❌ Achievements
❌ Onboarding gamificado
```

### 7. **Multi-tenancy/Escritórios** ❌ PARCIAL
```typescript
// TEMOS:
✅ Conceito de organization
✅ Office style (análise de estilo)

// FALTA:
❌ Gestão completa de escritórios
❌ Planos por escritório
❌ Créditos/limites
❌ Múltiplos usuários por escritório
❌ Permissões e roles
```

### 8. **Chat/Comunicação** ✅ IMPLEMENTADO
```typescript
// TEMOS:
✅ Chat com IA
✅ Sistema de mensagens
✅ Histórico

// FALTA:
❌ WebSockets para real-time
❌ Chat entre prestador/contratante
❌ Notificações push
```

---

## 🎯 O QUE PRECISAMOS COPIAR/RECRIAR DO LEGADO

### PRIORIDADE 1: Sistema Financeiro Completo
```typescript
// DO LEGADO: finance/, provider_wallet/, checkout/
interface ProviderWallet {
  provider: Provider
  balance: number
  available_balance: number
  blocked_balance: number
}

interface Transaction {
  wallet: ProviderWallet
  type: 'credit' | 'debit' | 'withdrawal'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  payment_method?: 'pix' | 'bank_slip' | 'credit_card'
  fees?: number
}

interface Invoice {
  match: SmartMatch
  total_amount: number
  provider_amount: number
  freelaw_commission: number
  payment_status: string
  payment_method: string
}
```

### PRIORIDADE 2: Matching Avançado
```typescript
// DO LEGADO: smart_match/
interface SmartMatch {
  // Adicionar ao nosso matching:
  proposed_value: number
  provider_value: number
  freelaw_value: number // 20%
  proposed_hours: number
  why_are_you_the_best: string
  
  // Status múltiplos
  send_propose: boolean
  accept: boolean
  selected: boolean
  rejected: boolean
  rejected_by_provider: boolean
  rejected_by_requestor: boolean
  rejected_by_replaced: boolean
}
```

### PRIORIDADE 3: Níveis e Limites de Prestadores
```typescript
// DO LEGADO: providers/models.py RankProvider
interface ProviderRank {
  rank: 'freelawyer_70_minus' | 'freelawyer_70_plus' | 'freelawyer_80_plus' | 'freelawyer_90_plus'
  percent_value: number // Porcentagem de ganho
  max_concurrent_services: number
  min_concurrent_services: number
  credits_per_category: number
}

// Adicionar verificações
interface Provider {
  // Badges do legado
  is_partner: boolean
  verified: boolean
  high_volume: boolean
  massive_volume: boolean
  
  // Preferências do legado
  work_preference: 'remote' | 'presential' | 'both'
  weekly_availability: number // horas
  availability_days: string[]
  work_on_holidays: boolean
}
```

### PRIORIDADE 4: ServicePackage (Agrupamento)
```typescript
// DO LEGADO: service_package/
interface ServicePackage {
  id: string
  requestor: Requestor
  orders: ServiceOrder[]
  total_value: number
  status: string
  created_at: Date
  
  // Permitir múltiplas ordens em um pacote
  addOrder(order: ServiceOrder): void
  calculateTotalValue(): number
}
```

### PRIORIDADE 5: Status Granulares
```typescript
// DO LEGADO: 15+ status diferentes
enum ServiceOrderStatus {
  // Iniciais
  DRAFT = 'draft',
  WAITING_MATCH = 'waiting_match',
  MATCHING = 'matching',
  
  // Proposta
  PROPOSAL_SENT = 'proposal_sent',
  PROPOSAL_ACCEPTED = 'proposal_accepted',
  PROPOSAL_REJECTED = 'proposal_rejected',
  
  // Execução
  IN_PROGRESS = 'in_progress',
  WAITING_REVISION = 'waiting_revision',
  IN_REVISION = 'in_revision',
  
  // Finalização
  COMPLETED = 'completed',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  REPLACED = 'replaced',
  
  // Pagamento
  WAITING_PAYMENT = 'waiting_payment',
  PAID = 'paid'
}
```

### PRIORIDADE 6: Notificações e Eventos
```typescript
// DO LEGADO: Celery tasks
// RECRIAR com BullMQ ou similar:
- email_to_provider_new_service_order_available
- email_service_was_approved_and_feedback
- email_to_cancel_service_order
- email_to_provider_was_rejected
- notification_push_new_match
- notification_push_payment_received
```

---

## 📋 ROADMAP DE IMPLEMENTAÇÃO

### FASE 1: Financeiro (2 semanas)
```bash
1. Provider Wallet (saldo, transações)
2. Invoice system
3. Payment methods (PIX prioritário)
4. Comissões automáticas
5. Dashboard financeiro
```

### FASE 2: Matching 2.0 (1 semana)
```bash
1. Propostas com valores
2. Sistema de rejeições múltiplas
3. Why are you the best
4. Histórico de matches
```

### FASE 3: Níveis e Gamificação (1 semana)
```bash
1. Rankings (70-, 70+, 80+, 90+)
2. Limites por categoria
3. Sistema de créditos
4. Badges e verificações
```

### FASE 4: WebSockets e Real-time (1 semana)
```bash
1. Socket.io ou native WebSockets
2. Chat real-time
3. Notificações push
4. Status updates ao vivo
```

---

## 🎯 RESUMO: O QUE COPIAR

### DO LEGADO DJANGO, VAMOS RECRIAR:
1. **Modelo financeiro completo** - wallet, transactions, invoices
2. **SmartMatch avançado** - propostas, valores, rejeições
3. **Rankings e limites** - 70-, 70+, 80+, 90+
4. **Status granulares** - 15+ status do ciclo de vida
5. **ServicePackage** - agrupamento de ordens
6. **Preferências detalhadas** - dias, horários, feriados

### NÃO VAMOS COPIAR (já temos melhor):
1. **Chat com IA** - nosso está mais avançado
2. **Upload de documentos** - nosso com Supabase está ótimo
3. **Dashboard** - nosso design está mais moderno
4. **Análise por IA** - nossa implementação está superior

---

**PRÓXIMO PASSO:** Começar pelo sistema financeiro (Provider Wallet + Invoices)!

