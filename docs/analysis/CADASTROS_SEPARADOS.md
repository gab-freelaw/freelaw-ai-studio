# 👥 CADASTROS SEPARADOS - CONTRATANTE VS PRESTADOR

**Data:** 06/01/2025  
**Objetivo:** Separar completamente as experiências de usuário

---

## 🎯 POR QUE CADASTROS SEPARADOS?

### **Contratante (Escritório):**
- **Perfil**: Pessoa jurídica (escritório de advocacia)
- **Objetivo**: Contratar serviços, delegar tarefas
- **Dados**: CNPJ, OAB do sócio, especialidades do escritório
- **Pagamento**: Assinatura mensal (R$ 299-1499)

### **Prestador (Advogado):**
- **Perfil**: Pessoa física (advogado autônomo)
- **Objetivo**: Prestar serviços, receber pagamentos
- **Dados**: CPF, OAB pessoal, especialidades individuais
- **Recebimento**: Por serviço executado

---

## 🏗️ ESTRUTURA DE CADASTROS

### **1. Cadastro de Escritório (Contratante)**
```typescript
interface ContractorRegistration {
  // Dados do escritório
  officeName: string
  cnpj: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  
  // Dados do responsável
  responsibleName: string
  responsibleEmail: string
  responsibleOAB: string
  responsibleOABState: string
  
  // Dados do escritório
  foundationYear: number
  lawyersCount: number
  specialties: string[]
  averageCasesPerMonth: number
  
  // Plano escolhido
  selectedPlan: 'starter' | 'professional' | 'enterprise'
  
  // Dados de pagamento
  billingEmail: string
  paymentMethod: 'credit_card' | 'bank_slip' | 'pix'
}
```

### **2. Cadastro de Prestador (Advogado)**
```typescript
interface ProviderRegistration {
  // Dados pessoais
  fullName: string
  cpf: string
  email: string
  phone: string
  
  // Dados profissionais
  oabNumber: string
  oabState: string
  yearsExperience: number
  specialties: string[]
  
  // Formação
  university: string
  graduationYear: number
  postGraduation?: string[]
  
  // Experiência
  summary: string
  previousWork: string
  portfolioLinks?: string[]
  
  // Disponibilidade
  weeklyHours: number
  availableDays: string[]
  workOnHolidays: boolean
  remoteWork: boolean
  
  // Dados bancários
  bankAccount: {
    bankCode: string
    agency: string
    accountNumber: string
    accountDigit: string
    accountType: 'checking' | 'savings'
    pixKey?: string
  }
}
```

---

## 🚪 FLUXOS DE ONBOARDING SEPARADOS

### **Fluxo Contratante:**
```
1. Landing page → "Quero contratar serviços"
2. Cadastro do escritório (CNPJ, OAB, etc)
3. Escolha do plano (Starter/Pro/Enterprise)
4. Configuração de pagamento
5. Dashboard do escritório
```

### **Fluxo Prestador:**
```
1. Landing page → "Quero prestar serviços"
2. Cadastro pessoal (CPF, OAB, etc)
3. Teste de avaliação por IA
4. Configuração bancária
5. Dashboard do prestador
```

---

## 🎨 INTERFACES SEPARADAS

### **URLs Específicas:**

#### 📋 **Contratante (Escritório):**
```
/escritorio/dashboard        # Dashboard principal
/escritorio/delegacoes       # Criar e gerenciar delegações
/escritorio/processos        # Gestão de processos
/escritorio/documentos       # Análise de documentos
/escritorio/agenda           # Agenda e prazos
/escritorio/contatos         # CRM de clientes
/escritorio/publicacoes      # Monitoramento
/escritorio/tarefas          # Tarefas do escritório
/escritorio/configuracoes    # Planos e billing
```

#### 👥 **Prestador (Advogado):**
```
/prestador/dashboard         # Dashboard de performance
/prestador/trabalhos         # Trabalhos disponíveis
/prestador/meus-servicos     # Serviços em andamento
/prestador/carteira          # Ganhos e saques
/prestador/performance       # Métricas e classificação
/prestador/perfil            # Dados pessoais
/prestador/configuracoes     # Conta bancária, etc
```

#### ⚙️ **Admin:**
```
/admin/dashboard             # Painel administrativo
/admin/prestadores           # Gerenciar prestadores
/admin/escritorios           # Gerenciar escritórios
/admin/precificacao          # Regras de preço
/admin/sistema               # Monitoramento técnico
```

---

## 🔐 AUTENTICAÇÃO SEPARADA

### **Supabase Auth Policies:**
```sql
-- Tabela de usuários com tipo
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_type TEXT CHECK (user_type IN ('contractor', 'provider', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS para separar dados
CREATE POLICY "Users see only their type data" 
ON user_profiles FOR ALL 
USING (auth.uid() = user_id);
```

### **Middleware de Rota:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const userType = await getUserType(request);
  const path = request.nextUrl.pathname;
  
  // Redirecionar se tipo não bate com rota
  if (path.startsWith('/prestador') && userType !== 'provider') {
    return NextResponse.redirect('/selecionar-perfil');
  }
  
  if (path.startsWith('/escritorio') && userType !== 'contractor') {
    return NextResponse.redirect('/selecionar-perfil');
  }
  
  return updateSession(request);
}
```

---

## 📱 NAVEGAÇÕES LIMPAS

### **Menu Contratante:**
```
🏠 Dashboard
💬 Chat Jurídico  
📄 Documentos
⚖️ Petições
📁 Processos
📅 Agenda & Prazos
📝 Tarefas IA
👥 Delegação
👤 Contatos
📰 Publicações
🏢 Escritório
⚙️ Configurações
```

### **Menu Prestador:**
```
🏠 Dashboard
💰 Carteira Digital
🎯 Trabalhos
📋 Meus Serviços
📊 Performance
💬 Suporte
⚙️ Configurações
```

### **Menu Admin:**
```
🛡️ Admin Dashboard
💰 Regras de Preço
👥 Prestadores
🏢 Escritórios
📋 Ordens de Serviço
🧠 Sistema Completo
```

---

## 🚀 IMPLEMENTAÇÃO

### **Próximos passos:**
1. **Criar páginas específicas** - `/escritorio/*` e `/prestador/*`
2. **Implementar middleware** - Proteção por tipo de usuário
3. **Separar dados** - Tabelas e RLS específicos
4. **Landing page** - Com escolha de perfil
5. **Onboarding separado** - Fluxos específicos

### **Benefícios:**
- ✅ **UX clara** - Cada usuário vê só o que precisa
- ✅ **Segurança** - Dados isolados por tipo
- ✅ **Escalabilidade** - Fácil adicionar novos tipos
- ✅ **Manutenção** - Código organizado por domínio

---

## 🎯 ESTRUTURA FINAL

```
Frontend Separado:
├── /                        # Landing page
├── /cadastro/escritorio     # Onboarding escritório
├── /cadastro/prestador      # Onboarding prestador
├── /escritorio/*           # Dashboard escritório
├── /prestador/*            # Dashboard prestador
└── /admin/*                # Dashboard admin

Backend NestJS:
├── /api/contractors/*      # APIs para escritórios
├── /api/providers/*        # APIs para prestadores
├── /api/admin/*           # APIs administrativas
└── /api/shared/*          # APIs compartilhadas (pricing, etc)
```

---

**Quer que eu implemente essa separação agora?**
