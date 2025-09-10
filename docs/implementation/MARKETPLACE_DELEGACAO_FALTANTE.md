# 🔴 FEATURE CRÍTICA FALTANTE - Marketplace de Delegação de Advogados

## Data: 05/09/2025

---

## 🎯 O QUE É O MARKETPLACE DE DELEGAÇÃO

O **sistema legado (freelaw-back)** possui um **marketplace completo** que conecta:
- **Escritórios/Contratantes** que precisam delegar serviços
- **Advogados/Prestadores** que executam serviços sob demanda

Este é o **CORE BUSINESS** original do Freelaw e **NÃO FOI IMPLEMENTADO** no novo sistema!

---

## 📊 ARQUITETURA DO SISTEMA LEGADO

### 1. **Entidades Principais**

#### **Requestors (Contratantes/Escritórios)**
```python
- Nome, email, telefone
- Health Score (score de saúde do cliente)
- Histórico de pagamentos
- Volume de serviços contratados
- Avaliação média dada aos prestadores
- Status do plano (ativo, bloqueado, cancelado)
```

#### **Providers (Prestadores/Advogados)**
```python
- Perfil completo (OAB, experiência, formação)
- Especialidades e sub-áreas
- Complexidades aceitas
- Disponibilidade (dias, horários, feriados)
- Valor esperado por serviço
- Rankings (70-, 70+, 80+, 90+)
- Verificação (verificado, parceiro)
- Alto volume (aceita trabalhos em massa)
- Integração pagamento (Iugu PF/PJ)
```

#### **Service Orders (Ordens de Serviço)**
```python
- Tipo de serviço (petição, audiência, cálculo, etc)
- Especialidade e complexidade
- Prazo e urgência
- Orientações do contratante
- Arquivos anexados
- Status detalhado (20+ status diferentes)
- Chat integrado
- Versões do trabalho
- Sistema de aprovação/revisão
```

### 2. **Fluxo Completo de Delegação**

```mermaid
1. CRIAÇÃO DA OS
   Contratante → Define serviço → Upload docs → Define prazo → Define valor

2. MATCHING INTELIGENTE
   Sistema → Analisa requisitos → Busca prestadores → Ranking por fit → Notifica matches

3. SELEÇÃO
   Contratante → Vê perfis → Analisa rankings → Seleciona prestador → Confirma

4. EXECUÇÃO
   Prestador → Aceita trabalho → Envia 1ª versão → Chat com contratante → Revisões

5. APROVAÇÃO
   Contratante → Revisa trabalho → Pede ajustes ou → Aprova → Avalia

6. PAGAMENTO
   Sistema → Libera pagamento → Transfere para prestador → Emite NF
```

### 3. **Features Avançadas do Marketplace**

#### **Smart Match Algorithm**
```python
- Match por especialidade
- Match por complexidade
- Match por disponibilidade
- Match por preço
- Match por ranking
- Match por localização (para presencial)
- Match especial (forçado)
```

#### **Sistema de Rankings**
```python
CategoryRankProvider:
- Calibração 1 (novo)
- Calibração 2 (intermediário)
- Freelawyer 70-
- Freelawyer 70+
- Freelawyer 80+
- Freelawyer 90+
```

#### **Gestão Financeira**
```python
- Wallet (carteira) por prestador
- Saldo disponível
- Saldo para sub-contratação
- Histórico de transações
- Saques (withdraws)
- Invoices automáticas
- Split de pagamento
```

#### **Sistema de Avaliações**
```python
- Rating do serviço (1-5)
- Feedback detalhado
- NPS do prestador
- Health Score do contratante
- Histórico de performance
```

---

## 🚨 IMPACTO DA FALTA DESTE SISTEMA

### **Perdas de Funcionalidade**
1. ❌ **Sem delegação real** - Escritórios não podem contratar externos
2. ❌ **Sem marketplace** - Advogados não podem oferecer serviços
3. ❌ **Sem matching** - Conexão manual ineficiente
4. ❌ **Sem pagamentos** - Gestão financeira externa
5. ❌ **Sem escala** - Limitado a equipe interna

### **Perdas de Negócio**
1. 💰 **Perda de receita** - Sem comissão sobre delegações
2. 📉 **Menor engajamento** - Menos interações na plataforma
3. 🚫 **Barreira de crescimento** - Escritórios não escalam
4. ⚠️ **Competitividade** - Concorrentes oferecem isso

---

## 💡 FEATURES DO LEGADO A IMPLEMENTAR

### **Alta Prioridade**
1. **Cadastro de Prestadores**
   - Perfil profissional completo
   - Verificação de OAB
   - Upload de certificados
   - Portfolio de trabalhos

2. **Sistema de Ordens de Serviço**
   - Criação detalhada de OS
   - Upload de documentos
   - Definição de prazos
   - Orientações específicas

3. **Smart Matching**
   - Algoritmo de match
   - Notificações para prestadores
   - Aceite/recusa de trabalhos
   - Ranking de candidatos

4. **Chat Interno**
   - Comunicação contratante-prestador
   - Troca de arquivos
   - Histórico de conversas
   - Notificações em tempo real

5. **Gestão de Trabalho**
   - Envio de versões
   - Sistema de revisão
   - Aprovação final
   - Controle de prazos

### **Média Prioridade**
6. **Sistema Financeiro**
   - Wallet por prestador
   - Gestão de pagamentos
   - Emissão de NF
   - Relatórios financeiros

7. **Avaliações e Rankings**
   - Sistema de rating
   - Feedback estruturado
   - Cálculo de rankings
   - Badges de qualidade

8. **Dashboard para Prestadores**
   - Trabalhos disponíveis
   - Histórico de serviços
   - Métricas de performance
   - Calendário de entregas

### **Baixa Prioridade**
9. **Features Avançadas**
   - Sub-contratação
   - Trabalhos em massa
   - Templates de serviços
   - API para integração

---

## 🏗️ ARQUITETURA PROPOSTA PARA O NOVO SISTEMA

### **Database Schema Necessário**

```typescript
// Tabelas principais necessárias
- providers (perfil dos prestadores)
- provider_specialties (especialidades)
- provider_availability (disponibilidade)
- provider_rankings (classificações)
- service_orders (ordens de serviço)
- service_order_status (histórico de status)
- service_order_files (arquivos)
- service_order_versions (versões do trabalho)
- service_order_chats (mensagens)
- provider_wallets (carteiras)
- provider_transactions (transações)
- service_ratings (avaliações)
```

### **APIs Necessárias**

```typescript
// Endpoints essenciais
POST   /api/providers/register
GET    /api/providers/profile
PUT    /api/providers/availability
GET    /api/providers/dashboard

POST   /api/service-orders/create
GET    /api/service-orders/available
POST   /api/service-orders/:id/accept
POST   /api/service-orders/:id/submit-version
POST   /api/service-orders/:id/approve
POST   /api/service-orders/:id/request-revision

POST   /api/matching/find-providers
POST   /api/matching/select-provider

POST   /api/chat/send-message
GET    /api/chat/conversation/:orderId

POST   /api/ratings/submit
GET    /api/ratings/provider/:id

GET    /api/wallet/balance
POST   /api/wallet/withdraw
GET    /api/wallet/transactions
```

### **Componentes UI Necessários**

```typescript
// Páginas principais
- /marketplace (listagem de trabalhos)
- /providers/register (cadastro de prestador)
- /providers/profile (perfil do prestador)
- /providers/dashboard (painel do prestador)
- /service-orders/create (criar OS)
- /service-orders/:id (detalhes da OS)
- /service-orders/:id/chat (chat da OS)
- /wallet (carteira do prestador)
- /rankings (rankings de prestadores)
```

---

## 📈 ESTIMATIVA DE IMPLEMENTAÇÃO

### **Esforço Total: 8-12 semanas**

#### **Fase 1: MVP Básico (3-4 semanas)**
- Cadastro de prestadores
- Criação de OS simples
- Match manual
- Chat básico
- Entrega e aprovação

#### **Fase 2: Smart Features (3-4 semanas)**
- Smart matching algorithm
- Sistema de rankings
- Avaliações
- Dashboard analytics
- Notificações avançadas

#### **Fase 3: Financeiro (2-4 semanas)**
- Integração pagamento
- Wallet system
- Emissão NF
- Relatórios
- Split payments

---

## 🎯 IMPACTO NO NEGÓCIO

### **Com o Marketplace Implementado:**
- ✅ **Receita adicional**: 15-20% de comissão por serviço
- ✅ **Crescimento**: Escritórios podem escalar infinitamente
- ✅ **Engajamento**: Prestadores ativos diariamente
- ✅ **Network Effect**: Mais prestadores = mais contratantes
- ✅ **Dados valiosos**: Insights sobre mercado jurídico

### **ROI Estimado:**
- **Investimento**: ~R$ 80-120k (desenvolvimento)
- **Retorno**: ~R$ 50k/mês (com 500 OS/mês)
- **Break-even**: 3-4 meses
- **Lucro anual**: ~R$ 500k+

---

## ✅ RECOMENDAÇÃO

### **IMPLEMENTAR COM URGÊNCIA!**

O marketplace de delegação é o **CORE** do modelo de negócio original e sua ausência:
1. **Limita drasticamente** o valor da plataforma
2. **Impede monetização** efetiva
3. **Reduz engajamento** dos usuários
4. **Perde vantagem** competitiva

### **Próximos Passos:**
1. **Validar** com stakeholders a prioridade
2. **Definir** MVP mínimo viável
3. **Iniciar** desenvolvimento em sprints
4. **Testar** com grupo beta
5. **Lançar** gradualmente

---

## 🔗 REFERÊNCIAS

### **Código Legado Relevante:**
```
/freelaw-back/providers/
/freelaw-back/requestors/
/freelaw-back/service_orders/
/freelaw-back/service_package/
/freelaw-back/smart_match/
/freelaw-back/provider_wallet/
/freelaw-back/ratings/
/freelaw-back/finance/
```

### **Modelos Principais:**
- `Provider` - modelo completo do prestador
- `Requestor` - modelo do contratante
- `NewServiceOrder` - ordem de serviço
- `SmartMatch` - algoritmo de matching
- `Wallet` - carteira do prestador
- `Rating` - sistema de avaliações

---

*Este é o GAP mais crítico entre o sistema legado e o novo. Sem ele, o Freelaw é apenas uma ferramenta de IA, não um marketplace.*