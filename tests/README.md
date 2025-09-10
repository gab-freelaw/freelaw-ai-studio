# Estratégia de Testes - Freelaw AI Studio

## 🎯 Objetivo
Executar testes de forma inteligente e ágil, garantindo qualidade sem sacrificar velocidade.

## 📊 Estrutura de Testes

### 1. **Smoke Tests** (`test:smoke`) - 30s
Testes rápidos para verificar se a aplicação está "viva":
- Homepage carrega
- API responde
- Sem erros críticos no console
- Login page acessível

### 2. **Critical Path Tests** (`test:critical`) - 2min
Funcionalidades essenciais do negócio:
- Fluxo de autenticação
- Registro de prestadores
- Chat com IA básico
- Upload de documentos
- Sistema de delegação

### 3. **API Tests** (`test:api`) - 3min
Testes paralelos de endpoints:
- Health checks
- CRUD operations
- Validações
- Error handling

### 4. **E2E Tests** (`test:e2e`) - 10min
Fluxos completos de usuário:
- Jornada completa do prestador
- Criação e aceitação de delegação
- Chat em tempo real
- Editor colaborativo

## 🚀 Comandos Rápidos

```bash
# Teste rápido (smoke + critical) - 2.5min
npm run test:quick

# Teste de API em paralelo - 3min
npm run test:parallel

# Teste completo CI - 5min
npm run test:ci

# Debug interativo
npm run test:debug

# Interface visual
npm run test:ui
```

## 🔄 Workflow de Desenvolvimento

1. **Durante desenvolvimento:**
   ```bash
   npm run test:smoke  # Após cada mudança significativa
   ```

2. **Antes de commit:**
   ```bash
   npm run test:quick  # Smoke + Critical
   ```

3. **Antes de PR:**
   ```bash
   npm run test:ci     # Smoke + Critical + API
   ```

4. **Release:**
   ```bash
   npm run test        # Todos os testes
   ```

## 📈 Métricas de Performance

| Tipo de Teste | Tempo | Cobertura | Quando Executar |
|---------------|-------|-----------|-----------------|
| Smoke | 30s | 10% | A cada mudança |
| Critical | 2min | 40% | Antes de commit |
| API | 3min | 30% | Antes de PR |
| E2E | 10min | 20% | Release |

## 🛠️ Otimizações Implementadas

1. **Testes Paralelos**: APIs testadas em paralelo (4 workers)
2. **Dependências**: E2E só roda se Critical passar
3. **Reuso de Servidor**: Dev server mantido entre testes
4. **Screenshots/Videos**: Apenas em falhas
5. **Retry Inteligente**: 2x no CI, 0x local

## ⚡ Tips para Testes Rápidos

1. Use `test.only()` durante desenvolvimento
2. Execute testes específicos: `npm run test -- --grep "login"`
3. Use `--headed` para debugging visual
4. Configure `PWDEBUG=1` para pausar em breakpoints

## 🔍 Debugging de Falhas

```bash
# Ver último relatório
npm run test:report

# Debug específico
npx playwright test path/to/test.spec.ts --debug

# Trace viewer
npx playwright show-trace trace.zip
```

## 📝 Checklist de Qualidade

- [ ] Smoke tests passando (30s)
- [ ] Critical paths cobertos (2min)
- [ ] APIs validadas (3min)
- [ ] Sem erros de console
- [ ] Performance aceitável (<5s page load)
- [ ] Mobile responsivo testado

## 🚨 Problemas Conhecidos

1. **Sentry Warnings**: Ignorados nos smoke tests
2. **API Health "degraded"**: Aceito como válido por enquanto
3. **Timeouts**: Aumentados para 30s em APIs externas

## 🎯 Próximos Passos

1. Implementar testes de performance
2. Adicionar testes de segurança
3. Criar testes de integração com Stripe
4. Adicionar visual regression tests





