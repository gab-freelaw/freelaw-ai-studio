# 📋 CHECKLIST DIÁRIO - Freelaw AI

**Início:** 06/01/2025  
**Meta:** MVP do Marketplace em 2 semanas

---

## 🗓️ SEMANA 1 (06-12 Janeiro)

### ✅ Segunda (06/01) - Setup e Migrations
- [ ] 🔴 Executar migration `001_initial_schema_with_rls.sql`
- [ ] 🔴 Executar migration `complete-petition-migration.sql`
- [ ] 🔴 Verificar tabelas criadas com query de verificação
- [ ] 🟡 Criar primeira API `/api/providers/register`
- [ ] 🟡 Conectar formulário de aplicação ao backend
- [ ] 🟢 Testar cadastro de prestador completo
- [ ] 🟢 Commit e documentar progresso

### ⬜ Terça (07/01) - APIs Core do Prestador
- [ ] Implementar autenticação de prestadores
- [ ] API de upload de documentos (OAB, certificados)
- [ ] API de perfil do prestador
- [ ] Validação de OAB via Escavador
- [ ] Sistema de status (pendente, aprovado, rejeitado)

### ⬜ Quarta (08/01) - Sistema de Avaliação IA
- [ ] Criar sistema de 5 peças teste
- [ ] Integrar GPT-4 para avaliação
- [ ] Sistema de scoring (0-100)
- [ ] Geração de feedback automático
- [ ] Dashboard de avaliação

### ⬜ Quinta (09/01) - Sistema de Delegação
- [ ] API para criar ordem de serviço
- [ ] Extração automática de contexto
- [ ] Sistema de precificação inteligente
- [ ] Upload de documentos do caso
- [ ] Notificações para prestadores

### ⬜ Sexta (10/01) - Matching Inteligente
- [ ] Algoritmo de match (skills × requisitos)
- [ ] Sistema de ranking de candidatos
- [ ] Aceite/recusa de trabalhos
- [ ] Reassignment automático
- [ ] Dashboard de oportunidades

---

## 🗓️ SEMANA 2 (13-19 Janeiro)

### ⬜ Segunda (13/01) - Chat e Colaboração
- [ ] Chat em tempo real (Supabase Realtime)
- [ ] Compartilhamento de arquivos
- [ ] Notificações de mensagens
- [ ] Histórico de conversas
- [ ] Status de leitura

### ⬜ Terça (14/01) - Workflow de Aprovação
- [ ] Sistema de versões de trabalho
- [ ] Aprovação/revisão pelo escritório
- [ ] Feedback e solicitação de ajustes
- [ ] Finalização e arquivamento
- [ ] Avaliação mútua

### ⬜ Quarta (15/01) - Integração e Testes
- [ ] Integrar todo o fluxo
- [ ] Testes E2E completos
- [ ] Correção de bugs
- [ ] Otimização de queries
- [ ] Performance tuning

### ⬜ Quinta (16/01) - Deploy e Config
- [ ] Deploy no Vercel
- [ ] Configurar domínio
- [ ] SSL e headers de segurança
- [ ] Configurar monitoring
- [ ] Backup strategy

### ⬜ Sexta (17/01) - Beta Testing
- [ ] Convidar 5 escritórios
- [ ] Convidar 10 advogados
- [ ] Criar casos de teste
- [ ] Coletar feedback
- [ ] Documentar melhorias

---

## 📊 Métricas de Progresso

### Semana 1
- **APIs Criadas**: 0/15
- **Testes Passando**: 28/28 (core) + 0/20 (marketplace)
- **Features Completas**: 0/10

### Semana 2
- **Delegações de Teste**: 0/10
- **Bugs Encontrados**: 0
- **Feedback Coletado**: 0/15

---

## 🎯 Definição de "Pronto"

### ✅ Uma tarefa está PRONTA quando:
1. Código implementado e testado
2. Documentação atualizada
3. Commit com mensagem clara
4. Teste E2E passando
5. Code review (se aplicável)

### ✅ O MVP está PRONTO quando:
1. Cadastro de prestador funcional
2. Avaliação por IA funcionando
3. Delegação completa possível
4. Chat funcionando
5. 10 delegações de teste bem-sucedidas

---

## 🚦 Legenda de Prioridades

- 🔴 **Crítico**: Bloqueia outras tarefas
- 🟡 **Alta**: Importante para o dia
- 🟢 **Normal**: Pode ser adiado se necessário
- 🔵 **Nice to Have**: Apenas se sobrar tempo

---

## 📝 Notas Diárias

### 06/01/2025
- Plano master criado
- MCPs configurados no Cursor
- Pronto para começar implementação

### 07/01/2025
- [Adicionar notas do progresso]

---

**Atualizar este checklist DIARIAMENTE às 18h!**

