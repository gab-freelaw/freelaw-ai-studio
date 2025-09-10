# 🚀 Guia de Deploy - Freelaw AI Studio

## 📋 Pré-requisitos

### 1. Contas Necessárias
- [ ] **Vercel** - Para hosting
- [ ] **Supabase** - Banco de dados e autenticação
- [ ] **OpenAI** - IA principal
- [ ] **Stripe** - Pagamentos
- [ ] **Sentry** - Monitoramento de erros
- [ ] **PostHog** - Analytics
- [ ] **Resend** - Envio de emails

### 2. APIs Jurídicas (Opcionais)
- [ ] **Escavador** - Dados jurídicos
- [ ] **Solucionare** - Processos e petições

## 🔧 Configuração do Supabase

### 1. Projeto Supabase
```bash
# 1. Criar projeto no Supabase
# 2. Copiar URL e chaves do projeto
# 3. Executar migrations do banco
```

### 2. Variáveis Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 3. Configurações de Autenticação
No painel do Supabase:
- **Authentication > Settings**
- **Site URL**: `https://seu-dominio.vercel.app`
- **Redirect URLs**: `https://seu-dominio.vercel.app/auth/callback`

### 4. Storage Buckets
Criar buckets no Supabase Storage:
- `provider_documents`
- `chat_attachments` 
- `audio_messages`

## ⚡ Deploy no Vercel

### 1. Conectar Repositório
```bash
# 1. Push do código para GitHub
# 2. Conectar repositório no Vercel
# 3. Configurar variáveis de ambiente
```

### 2. Variáveis de Ambiente
Copiar de `.env.example` para Vercel Environment Variables:

#### **Essenciais para Funcionamento**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

#### **Para Funcionalidades Premium**
```
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

#### **Para Monitoramento**
```
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
POSTHOG_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
```

### 3. Configurações do Vercel

#### **vercel.json**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

## 🔐 Configuração do Stripe

### 1. Webhooks
Configurar webhook no Stripe:
- **URL**: `https://seu-dominio.vercel.app/api/webhooks/stripe`
- **Eventos**: 
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 2. Produtos e Preços
Criar no painel do Stripe:
- **Plano Free** (R$ 0/mês)
- **Plano Pro** (R$ 97/mês)
- **Plano Enterprise** (R$ 297/mês)

## 📧 Configuração do Resend

### 1. Domínio
- Adicionar domínio no Resend
- Configurar DNS records
- Verificar domínio

### 2. Templates de Email
Criar templates para:
- Onboarding de prestadores
- Aprovação de cadastro
- Notificações de delegação
- Relatórios semanais

## 📊 Configuração do Sentry

### 1. Projeto
```bash
# 1. Criar projeto no Sentry
# 2. Copiar DSN
# 3. Configurar releases
```

### 2. Configurações
- **Environment**: production
- **Release**: usar GitHub Actions para auto-release
- **Error Sampling**: 100%
- **Performance Sampling**: 10%

## 📈 Configuração do PostHog

### 1. Projeto
- Criar projeto no PostHog
- Configurar domínio permitido
- Ativar session recordings

### 2. Feature Flags
Configurar flags no PostHog:
- `provider_portal_enabled`
- `ai_evaluation_enabled`
- `realtime_chat_enabled`
- `audio_transcription_enabled`

## 🔍 Monitoramento Pós-Deploy

### 1. Health Checks
Verificar endpoints:
- `GET /api/health` - Status geral
- `GET /api/health/db` - Conexão com banco
- `GET /api/health/ai` - APIs de IA

### 2. Métricas Importantes
- **Tempo de resposta** < 2s
- **Taxa de erro** < 1%
- **Uptime** > 99.9%

### 3. Alertas
Configurar alertas para:
- Erros 5xx > 10/min
- Tempo de resposta > 5s
- Falhas de pagamento
- Errors críticos no Sentry

## 🚦 Checklist de Deploy

### Pré-Deploy
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Migrations do banco executadas
- [ ] Buckets do Supabase criados
- [ ] Webhooks do Stripe configurados
- [ ] DNS do domínio configurado

### Pós-Deploy
- [ ] Health checks passando
- [ ] Autenticação funcionando
- [ ] Registro de prestadores funcionando
- [ ] Sistema de pagamentos testado
- [ ] Emails sendo enviados
- [ ] Monitoramento ativo
- [ ] Feature flags funcionando

### Testes de Produção
- [ ] Fluxo completo de onboarding
- [ ] Criação e resposta de delegação
- [ ] Chat em tempo real
- [ ] Upload de documentos
- [ ] Transcrição de áudio
- [ ] Processo de pagamento

## 🔄 CI/CD com GitHub Actions

### 1. Deploy Automático
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 2. Testes Automáticos
```yaml
name: E2E Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Playwright tests
        run: |
          npm ci
          npx playwright test
```

## 📞 Suporte e Troubleshooting

### Problemas Comuns

1. **Erro de CORS**
   - Verificar configurações do Supabase
   - Configurar headers no Vercel

2. **Timeouts de API**
   - Aumentar timeout no vercel.json
   - Otimizar queries do banco

3. **Falhas de Webhook**
   - Verificar URL do webhook
   - Conferir assinatura do Stripe

4. **Problemas de Email**
   - Verificar configuração DNS
   - Conferir templates do Resend

### Contatos de Emergência
- **Vercel Support**: Em caso de problemas de infrastructure
- **Supabase Support**: Para problemas de banco de dados
- **Stripe Support**: Para questões de pagamento

---

## 🎯 Próximos Passos Após Deploy

1. **Monitoramento Ativo** (primeira semana)
2. **Coleta de Feedback** dos primeiros usuários
3. **Otimizações de Performance**
4. **Implementação de Feature Flags**
5. **Escalabilidade** baseada no uso real

✅ **Deploy concluído com sucesso!** 🚀



