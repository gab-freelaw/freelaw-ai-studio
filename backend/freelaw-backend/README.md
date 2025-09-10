# 🚀 Freelaw AI Studio - Backend

Backend NestJS para a plataforma jurídica com IA.

## 🏗️ Arquitetura

### Módulos Implementados

#### ✅ Sistema de Carteira Digital (`/api/wallet`)
- **Saldo e transações** - Visualizar saldo disponível, pendente e bloqueado
- **Histórico completo** - Todas as transações com filtros
- **Saques automatizados** - PIX, Boleto, Cartão com taxas automáticas
- **Contas bancárias** - Cadastro e gerenciamento
- **Processamento assíncrono** - Filas Redis para saques

#### ✅ Sistema de Pricing Dinâmico (`/api/pricing`)
- **Cálculo inteligente** - 5 fatores: tipo, área, urgência, plano, perfil
- **Regras flexíveis** - Configuração por admin
- **Multiplicadores** - Urgência (1.0x, 1.5x, 2.0x), Perfil (0.8x-1.2x)
- **Split automático** - 80% prestador, 20% plataforma

#### 🔄 Entidades Core
- **Provider** - Prestadores com perfis e limites
- **ServiceOrder** - Ordens com status simplificados (8 status)
- **PerformanceMetrics** - Métricas de performance automáticas
- **RevisionRequest** - Sistema de correções (até 3 por serviço)

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- Redis

### Setup
```bash
# Instalar dependências
npm install

# Configurar variáveis
cp .env.example .env
# Editar .env com suas configurações

# Executar em desenvolvimento
npm run start:dev

# Build para produção
npm run build
npm run start:prod
```

### Endpoints Principais

#### Carteira Digital
```bash
GET    /api/wallet/balance              # Saldo atual
GET    /api/wallet/transactions         # Histórico
POST   /api/wallet/withdraw             # Solicitar saque
GET    /api/wallet/bank-accounts        # Contas cadastradas
POST   /api/wallet/bank-accounts        # Cadastrar conta
DELETE /api/wallet/bank-accounts/:id    # Remover conta
```

#### Pricing Dinâmico
```bash
POST   /api/pricing/calculate           # Calcular preço
GET    /api/pricing/rules               # Listar regras
POST   /api/pricing/rules               # Criar regra
PUT    /api/pricing/rules/:id           # Editar regra
DELETE /api/pricing/rules/:id           # Excluir regra
```

### Exemplo de Uso - Calcular Preço
```json
POST /api/pricing/calculate
{
  "serviceType": "petition",
  "legalArea": "civil", 
  "urgencyLevel": "urgent",
  "contractorPlan": "professional",
  "providerProfile": "elite",
  "complexityMultiplier": 1.2
}

# Resposta
{
  "basePrice": 200,
  "finalPrice": 432,
  "providerAmount": 345.60,
  "platformFee": 86.40,
  "appliedRule": {
    "id": "rule-123",
    "name": "Petição Simples - Cível"
  },
  "breakdown": {
    "urgencyMultiplier": 1.5,
    "complexityMultiplier": 1.2,
    "providerMultiplier": 1.2,
    "planMultiplier": 1.1
  }
}
```

### Exemplo de Uso - Solicitar Saque
```json
POST /api/wallet/withdraw
{
  "amount": 100.00,
  "paymentMethod": "pix",
  "bankAccountId": "account-123"
}

# Resposta
{
  "id": "transaction-456",
  "amount": 100.00,
  "fees": 1.75,
  "netAmount": 98.25,
  "status": "processing",
  "paymentMethod": "pix"
}
```

## 📊 Status dos Módulos

| Módulo | Status | Funcionalidades |
|--------|--------|----------------|
| 💰 Wallet | ✅ Completo | Saldo, transações, saques, contas bancárias |
| 💎 Pricing | ✅ Completo | Cálculo dinâmico, regras configuráveis |
| 👥 Providers | 🔄 Estrutura | Entidades criadas, controllers pendentes |
| 🎯 Matching | 🔄 Estrutura | Entidades criadas, algoritmo pendente |
| 📋 Orders | 🔄 Estrutura | Entidades criadas, CRUD pendente |
| 📈 Performance | 🔄 Estrutura | Entidades criadas, cálculos pendentes |
| 🔄 Revisions | 🔄 Estrutura | Entidades criadas, fluxo pendente |
| 🔐 Auth | 🔄 Estrutura | JWT configurado, estratégias pendentes |

## 🛠️ Tecnologias

- **Framework**: NestJS 10
- **Database**: PostgreSQL com TypeORM
- **Cache/Queues**: Redis + BullMQ
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI 3.0
- **Authentication**: JWT + Passport

## 📚 Documentação

Acesse a documentação interativa em: `http://localhost:4000/api/docs`

## 🔄 Próximos Passos

1. **Implementar autenticação** - JWT com Supabase
2. **Completar módulo Providers** - CRUD e dashboard
3. **Sistema de Matching** - Algoritmo inteligente
4. **Performance tracking** - Cálculo automático de métricas
5. **Sistema de correções** - Fluxo completo
6. **Integração frontend** - SDK TypeScript

## 🚀 Deploy

### Docker
```bash
# Build
docker build -t freelaw-backend .

# Run
docker run -p 4000:4000 freelaw-backend
```

### Vercel/Railway
Configurado para deploy automático via `package.json` scripts.