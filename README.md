# Freelaw AI Studio

> Plataforma de automação jurídica com IA para escritórios de advocacia

## 🚀 Visão Geral

O Freelaw AI Studio é uma plataforma completa que combina inteligência artificial com automação jurídica, oferecendo ferramentas avançadas para escritórios de advocacia modernos.

### ✨ Principais Funcionalidades

- **🤖 Chat com IA Jurídica**: Assistente especializado em direito brasileiro
- **📄 Geração de Petições**: Criação automática de documentos jurídicos
- **📊 Monitoramento de Publicações**: Acompanhamento automático do DJE
- **👥 Sistema de Delegação**: Marketplace para serviços jurídicos
- **📈 Analytics Avançado**: Métricas e insights para o escritório
- **🔄 Integrações**: ComunicaAPI, Escavador, Solucionare

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 15** (React 19 RC)
- **TypeScript** para type safety
- **Tailwind CSS** + **Radix UI** para design system
- **SWR** para data fetching
- **Zustand** para state management

### Backend
- **NestJS** com TypeScript
- **PostgreSQL** via Supabase
- **Drizzle ORM** para database
- **JWT** para autenticação
- **Bull** para job queues

### IA & Integrações
- **OpenAI GPT-4** para chat e análise
- **Anthropic Claude** para documentos
- **Google Gemini** para visão computacional
- **Playwright** para web scraping
- **APIs Jurídicas** (ComunicaAPI, Escavador)

## 🚦 Status do Projeto

✅ **MVP Completo** - Sistema funcional com todas as features principais  
✅ **Testes E2E** - Cobertura completa com Playwright  
✅ **Segurança** - Variáveis sensíveis protegidas  
🔄 **Deploy** - Em processo de deployment  

## 📁 Estrutura do Projeto

```
freelaw-ai-studio/
├── app/                    # Next.js App Router
│   ├── (authenticated)/   # Páginas autenticadas
│   ├── api/               # API Routes
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── ui/               # Componentes base
│   ├── chat/             # Sistema de chat
│   ├── petitions/        # Geração de petições
│   └── providers/        # Context providers
├── lib/                  # Utilitários e serviços
│   ├── services/         # Serviços de negócio
│   ├── supabase/         # Cliente Supabase
│   └── utils.ts          # Funções utilitárias
├── db/                   # Database schemas
├── tests/                # Testes E2E Playwright
├── docs/                 # Documentação
└── backend/              # NestJS Backend
```

## 🔧 Configuração Local

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Supabase
- Chaves de API (OpenAI, Anthropic, etc.)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/gab-freelaw/freelaw-ai-studio.git
cd freelaw-ai-studio
```

2. **Instale as dependências**
```bash
npm install --legacy-peer-deps
cd backend/freelaw-backend && npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
# Preencha com suas credenciais
```

4. **Execute as migrações do banco**
```bash
npm run db:migrate
```

5. **Inicie o desenvolvimento**
```bash
# Frontend (porta 3000)
npm run dev

# Backend (porta 4000)
cd backend/freelaw-backend && npm run start:dev
```

## 🌐 Deploy

### Vercel (Recomendado)
```bash
# Deploy automático via GitHub
vercel --prod
```

### Variáveis de Ambiente Necessárias
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# Integrações Jurídicas
ESCAVADOR_API_TOKEN=
SOLUCIONARE_API_TOKEN=

# Outros
STRIPE_SECRET_KEY=
POSTHOG_API_KEY=
```

## 🧪 Testes

```bash
# Testes E2E com Playwright
npm run test:e2e

# Testes específicos
npm run test:chat
npm run test:petitions
npm run test:api
```

## 📚 Documentação

- [Guia de Deploy](docs/DEPLOY_GUIDE.md)
- [Configuração MCP](docs/MCP_SETUP.md)
- [Design System](docs/design/DESIGN_SYSTEM.md)
- [Planejamento](docs/planning/)
- [Status](docs/status/)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 Email: suporte@freelaw.com.br
- 💬 Discord: [Freelaw Community](https://discord.gg/freelaw)
- 📖 Docs: [docs.freelaw.com.br](https://docs.freelaw.com.br)

---

<div align="center">
  <strong>Desenvolvido com ❤️ pela equipe Freelaw</strong>
</div>
