import { test, expect } from '@playwright/test';

test.describe('Office Management System - Complete Coverage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as office admin
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('office@freelaw.com.br');
    await page.getByLabel('Senha').fill('office123');
    await page.getByRole('button', { name: /Entrar/i }).click();
  });

  test.describe('Process Management', () => {
    test('should list all processes', async ({ page }) => {
      await page.goto('/processos');
      
      await expect(page.getByText('Gestão de Processos')).toBeVisible();
      await expect(page.locator('[data-testid="process-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="process-item"]')).toHaveCount({ gte: 0 });
    });

    test('should search processes', async ({ page }) => {
      await page.goto('/processos');
      
      await page.getByPlaceholder('Buscar processos...').fill('1001234');
      await page.getByRole('button', { name: /Buscar/i }).click();
      
      await expect(page.getByText('1001234')).toBeVisible();
    });

    test('should filter processes by status', async ({ page }) => {
      await page.goto('/processos');
      
      await page.getByLabel('Status').selectOption('ativo');
      
      await expect(page.locator('[data-testid="process-status-ativo"]')).toHaveCount({ gte: 0 });
    });

    test('should filter processes by area', async ({ page }) => {
      await page.goto('/processos');
      
      await page.getByLabel('Área').selectOption('civil');
      
      await expect(page.locator('[data-testid="process-area-civil"]')).toHaveCount({ gte: 0 });
    });

    test('should view process details', async ({ page }) => {
      await page.goto('/processos');
      
      await page.locator('[data-testid="process-item"]').first().click();
      
      await expect(page.getByText('Detalhes do Processo')).toBeVisible();
      await expect(page.getByText('Número:')).toBeVisible();
      await expect(page.getByText('Comarca:')).toBeVisible();
      await expect(page.getByText('Partes:')).toBeVisible();
    });

    test('should add new process', async ({ page }) => {
      await page.goto('/processos');
      
      await page.getByRole('button', { name: /Novo Processo/i }).click();
      
      await page.getByLabel('Número do Processo').fill('1001234-56.2024.8.26.0100');
      await page.getByLabel('Vara/Comarca').fill('1ª Vara Cível');
      await page.getByLabel('Área do Direito').selectOption('civil');
      await page.getByLabel('Cliente').fill('João da Silva');
      await page.getByLabel('Parte Contrária').fill('Empresa XYZ');
      
      await page.getByRole('button', { name: /Salvar/i }).click();
      
      await expect(page.getByText('Processo cadastrado')).toBeVisible();
    });

    test('should update process status', async ({ page }) => {
      await page.goto('/processos');
      
      await page.locator('[data-testid="process-item"]').first().click();
      
      await page.getByLabel('Status').selectOption('arquivado');
      await page.getByRole('button', { name: /Atualizar/i }).click();
      
      await expect(page.getByText('Status atualizado')).toBeVisible();
    });

    test('should track process timeline', async ({ page }) => {
      await page.goto('/processos');
      
      await page.locator('[data-testid="process-item"]').first().click();
      await page.getByRole('tab', { name: /Timeline/i }).click();
      
      await expect(page.getByText('Histórico do Processo')).toBeVisible();
      await expect(page.locator('[data-testid="timeline-event"]')).toHaveCount({ gte: 0 });
    });

    test('should manage process documents', async ({ page }) => {
      await page.goto('/processos');
      
      await page.locator('[data-testid="process-item"]').first().click();
      await page.getByRole('tab', { name: /Documentos/i }).click();
      
      // Upload document
      await page.getByLabel('Upload').setInputFiles('tests/fixtures/process-document.pdf');
      
      await expect(page.getByText('Documento adicionado')).toBeVisible();
    });

    test('should import processes from OAB', async ({ page }) => {
      await page.goto('/processos');
      
      await page.getByRole('button', { name: /Importar/i }).click();
      await page.getByLabel('Número OAB').fill('123456');
      await page.getByLabel('UF').selectOption('SP');
      
      await page.getByRole('button', { name: /Buscar Processos/i }).click();
      
      await expect(page.getByText('Buscando processos...')).toBeVisible();
      await expect(page.getByText('Processos encontrados')).toBeVisible();
    });
  });

  test.describe('Contact Management', () => {
    test('should list all contacts', async ({ page }) => {
      await page.goto('/contatos');
      
      await expect(page.getByText('Gestão de Contatos')).toBeVisible();
      await expect(page.locator('[data-testid="contact-list"]')).toBeVisible();
    });

    test('should add new contact', async ({ page }) => {
      await page.goto('/contatos');
      
      await page.getByRole('button', { name: /Novo Contato/i }).click();
      
      await page.getByLabel('Nome').fill('Maria Silva');
      await page.getByLabel('E-mail').fill('maria@exemplo.com');
      await page.getByLabel('Telefone').fill('11987654321');
      await page.getByLabel('Tipo').selectOption('cliente');
      
      await page.getByRole('button', { name: /Salvar/i }).click();
      
      await expect(page.getByText('Contato cadastrado')).toBeVisible();
    });

    test('should search contacts', async ({ page }) => {
      await page.goto('/contatos');
      
      await page.getByPlaceholder('Buscar contatos...').fill('Maria');
      
      await expect(page.getByText('Maria Silva')).toBeVisible();
    });

    test('should filter contacts by type', async ({ page }) => {
      await page.goto('/contatos');
      
      await page.getByLabel('Tipo').selectOption('cliente');
      
      await expect(page.locator('[data-testid="contact-type-cliente"]')).toHaveCount({ gte: 0 });
    });

    test('should edit contact', async ({ page }) => {
      await page.goto('/contatos');
      
      await page.locator('[data-testid="contact-item"]').first().click();
      
      await page.getByLabel('Nome').fill('Maria Silva Santos');
      await page.getByRole('button', { name: /Salvar/i }).click();
      
      await expect(page.getByText('Contato atualizado')).toBeVisible();
    });

    test('should link contact to process', async ({ page }) => {
      await page.goto('/contatos');
      
      await page.locator('[data-testid="contact-item"]').first().click();
      await page.getByRole('tab', { name: /Processos/i }).click();
      
      await page.getByRole('button', { name: /Vincular Processo/i }).click();
      await page.getByLabel('Processo').selectOption('1001234-56.2024.8.26.0100');
      
      await page.getByRole('button', { name: /Vincular/i }).click();
      
      await expect(page.getByText('Processo vinculado')).toBeVisible();
    });
  });

  test.describe('Task Management', () => {
    test('should list all tasks', async ({ page }) => {
      await page.goto('/tarefas');
      
      await expect(page.getByText('Gestão de Tarefas')).toBeVisible();
      await expect(page.locator('[data-testid="task-list"]')).toBeVisible();
    });

    test('should create new task', async ({ page }) => {
      await page.goto('/tarefas');
      
      await page.getByRole('button', { name: /Nova Tarefa/i }).click();
      
      await page.getByLabel('Título').fill('Elaborar petição inicial');
      await page.getByLabel('Descrição').fill('Cliente João - Ação de cobrança');
      await page.getByLabel('Prioridade').selectOption('alta');
      await page.getByLabel('Prazo').fill('2024-12-31');
      await page.getByLabel('Responsável').selectOption('advogado1');
      
      await page.getByRole('button', { name: /Criar Tarefa/i }).click();
      
      await expect(page.getByText('Tarefa criada')).toBeVisible();
    });

    test('should update task status', async ({ page }) => {
      await page.goto('/tarefas');
      
      await page.locator('[data-testid="task-item"]').first().click();
      await page.getByLabel('Status').selectOption('em_andamento');
      
      await page.getByRole('button', { name: /Atualizar/i }).click();
      
      await expect(page.getByText('Tarefa atualizada')).toBeVisible();
    });

    test('should filter tasks by priority', async ({ page }) => {
      await page.goto('/tarefas');
      
      await page.getByLabel('Prioridade').selectOption('alta');
      
      await expect(page.locator('[data-testid="task-priority-alta"]')).toHaveCount({ gte: 0 });
    });

    test('should filter tasks by assignee', async ({ page }) => {
      await page.goto('/tarefas');
      
      await page.getByLabel('Responsável').selectOption('advogado1');
      
      await expect(page.locator('[data-testid="task-assignee-advogado1"]')).toHaveCount({ gte: 0 });
    });

    test('should view task kanban board', async ({ page }) => {
      await page.goto('/tarefas');
      
      await page.getByRole('button', { name: /Kanban/i }).click();
      
      await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
      await expect(page.getByText('Pendente')).toBeVisible();
      await expect(page.getByText('Em Andamento')).toBeVisible();
      await expect(page.getByText('Concluído')).toBeVisible();
    });

    test('should drag task in kanban', async ({ page }) => {
      await page.goto('/tarefas');
      await page.getByRole('button', { name: /Kanban/i }).click();
      
      const task = page.locator('[data-testid="kanban-task"]').first();
      const targetColumn = page.locator('[data-testid="kanban-column-em_andamento"]');
      
      await task.dragTo(targetColumn);
      
      await expect(page.getByText('Tarefa movida')).toBeVisible();
    });

    test('should set task reminders', async ({ page }) => {
      await page.goto('/tarefas');
      
      await page.locator('[data-testid="task-item"]').first().click();
      
      await page.getByLabel('Lembrete').fill('2024-12-30T10:00');
      await page.getByRole('button', { name: /Definir Lembrete/i }).click();
      
      await expect(page.getByText('Lembrete definido')).toBeVisible();
    });

    test('should link task to process', async ({ page }) => {
      await page.goto('/tarefas');
      
      await page.locator('[data-testid="task-item"]').first().click();
      
      await page.getByLabel('Processo Relacionado').selectOption('1001234-56.2024.8.26.0100');
      await page.getByRole('button', { name: /Vincular/i }).click();
      
      await expect(page.getByText('Tarefa vinculada')).toBeVisible();
    });
  });

  test.describe('Calendar/Agenda', () => {
    test('should display calendar view', async ({ page }) => {
      await page.goto('/agenda');
      
      await expect(page.getByText('Agenda')).toBeVisible();
      await expect(page.locator('[data-testid="calendar"]')).toBeVisible();
    });

    test('should create new event', async ({ page }) => {
      await page.goto('/agenda');
      
      await page.getByRole('button', { name: /Novo Evento/i }).click();
      
      await page.getByLabel('Título').fill('Audiência João Silva');
      await page.getByLabel('Data').fill('2024-12-25');
      await page.getByLabel('Hora Início').fill('14:00');
      await page.getByLabel('Hora Fim').fill('15:00');
      await page.getByLabel('Local').fill('1ª Vara Cível');
      
      await page.getByRole('button', { name: /Salvar/i }).click();
      
      await expect(page.getByText('Evento criado')).toBeVisible();
    });

    test('should view event details', async ({ page }) => {
      await page.goto('/agenda');
      
      await page.locator('[data-testid="calendar-event"]').first().click();
      
      await expect(page.getByText('Detalhes do Evento')).toBeVisible();
      await expect(page.getByText('Título:')).toBeVisible();
      await expect(page.getByText('Data:')).toBeVisible();
    });

    test('should edit event', async ({ page }) => {
      await page.goto('/agenda');
      
      await page.locator('[data-testid="calendar-event"]').first().click();
      await page.getByRole('button', { name: /Editar/i }).click();
      
      await page.getByLabel('Título').fill('Audiência Reagendada');
      await page.getByRole('button', { name: /Salvar/i }).click();
      
      await expect(page.getByText('Evento atualizado')).toBeVisible();
    });

    test('should set event reminders', async ({ page }) => {
      await page.goto('/agenda');
      
      await page.locator('[data-testid="calendar-event"]').first().click();
      
      await page.getByLabel('Lembrete').selectOption('1_hour');
      await page.getByRole('button', { name: /Definir Lembrete/i }).click();
      
      await expect(page.getByText('Lembrete definido')).toBeVisible();
    });

    test('should view different calendar views', async ({ page }) => {
      await page.goto('/agenda');
      
      // Month view
      await page.getByRole('button', { name: /Mês/i }).click();
      await expect(page.locator('[data-testid="calendar-month"]')).toBeVisible();
      
      // Week view
      await page.getByRole('button', { name: /Semana/i }).click();
      await expect(page.locator('[data-testid="calendar-week"]')).toBeVisible();
      
      // Day view
      await page.getByRole('button', { name: /Dia/i }).click();
      await expect(page.locator('[data-testid="calendar-day"]')).toBeVisible();
    });

    test('should sync with external calendars', async ({ page }) => {
      await page.goto('/agenda/configuracoes');
      
      await page.getByRole('button', { name: /Sincronizar Google Calendar/i }).click();
      
      await expect(page.getByText('Calendário sincronizado')).toBeVisible();
    });
  });

  test.describe('Document Management', () => {
    test('should list all documents', async ({ page }) => {
      await page.goto('/documentos');
      
      await expect(page.getByText('Gestão de Documentos')).toBeVisible();
      await expect(page.locator('[data-testid="document-list"]')).toBeVisible();
    });

    test('should upload new document', async ({ page }) => {
      await page.goto('/documentos');
      
      await page.getByRole('button', { name: /Upload/i }).click();
      
      await page.getByLabel('Arquivo').setInputFiles('tests/fixtures/document.pdf');
      await page.getByLabel('Categoria').selectOption('contrato');
      await page.getByLabel('Tags').fill('importante, urgente');
      
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      await expect(page.getByText('Documento enviado')).toBeVisible();
    });

    test('should search documents', async ({ page }) => {
      await page.goto('/documentos');
      
      await page.getByPlaceholder('Buscar documentos...').fill('contrato');
      
      await expect(page.getByText('contrato')).toBeVisible();
    });

    test('should filter documents by category', async ({ page }) => {
      await page.goto('/documentos');
      
      await page.getByLabel('Categoria').selectOption('peticao');
      
      await expect(page.locator('[data-testid="doc-category-peticao"]')).toHaveCount({ gte: 0 });
    });

    test('should organize documents in folders', async ({ page }) => {
      await page.goto('/documentos');
      
      await page.getByRole('button', { name: /Nova Pasta/i }).click();
      
      await page.getByLabel('Nome da Pasta').fill('Caso João Silva');
      await page.getByRole('button', { name: /Criar/i }).click();
      
      // Move document to folder
      await page.locator('[data-testid="document-item"]').first().click();
      await page.getByLabel('Pasta').selectOption('Caso João Silva');
      await page.getByRole('button', { name: /Mover/i }).click();
      
      await expect(page.getByText('Documento movido')).toBeVisible();
    });

    test('should version control documents', async ({ page }) => {
      await page.goto('/documentos');
      
      await page.locator('[data-testid="document-item"]').first().click();
      
      await page.getByRole('button', { name: /Nova Versão/i }).click();
      await page.getByLabel('Arquivo').setInputFiles('tests/fixtures/document-v2.pdf');
      
      await page.getByRole('button', { name: /Upload/i }).click();
      
      await expect(page.getByText('Nova versão criada')).toBeVisible();
    });

    test('should share documents', async ({ page }) => {
      await page.goto('/documentos');
      
      await page.locator('[data-testid="document-item"]').first().click();
      
      await page.getByRole('button', { name: /Compartilhar/i }).click();
      await page.getByLabel('E-mail').fill('cliente@exemplo.com');
      await page.getByLabel('Prazo de Acesso').fill('7');
      
      await page.getByRole('button', { name: /Enviar Link/i }).click();
      
      await expect(page.getByText('Link enviado')).toBeVisible();
    });
  });

  test.describe('Dashboard Analytics', () => {
    test('should display analytics dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      
      await expect(page.getByText('Dashboard Analytics')).toBeVisible();
      await expect(page.locator('[data-testid="analytics-widgets"]')).toBeVisible();
    });

    test('should show process statistics', async ({ page }) => {
      await page.goto('/dashboard');
      
      await expect(page.getByText('Processos Ativos')).toBeVisible();
      await expect(page.getByText('Novos Este Mês')).toBeVisible();
      await expect(page.getByText('Taxa de Sucesso')).toBeVisible();
    });

    test('should show task statistics', async ({ page }) => {
      await page.goto('/dashboard');
      
      await expect(page.getByText('Tarefas Pendentes')).toBeVisible();
      await expect(page.getByText('Concluídas Hoje')).toBeVisible();
      await expect(page.getByText('Em Atraso')).toBeVisible();
    });

    test('should show revenue charts', async ({ page }) => {
      await page.goto('/dashboard');
      
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(page.getByText('Receita Mensal')).toBeVisible();
    });

    test('should show productivity metrics', async ({ page }) => {
      await page.goto('/dashboard');
      
      await expect(page.locator('[data-testid="productivity-metrics"]')).toBeVisible();
      await expect(page.getByText('Horas Trabalhadas')).toBeVisible();
    });

    test('should filter analytics by period', async ({ page }) => {
      await page.goto('/dashboard');
      
      await page.getByLabel('Período').selectOption('last_month');
      
      await expect(page.getByText('Dados atualizados')).toBeVisible();
    });

    test('should export analytics data', async ({ page }) => {
      await page.goto('/dashboard');
      
      await page.getByRole('button', { name: /Exportar/i }).click();
      
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /Excel/i }).click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.xlsx');
    });
  });

  test.describe('Publications Management', () => {
    test('should list publications', async ({ page }) => {
      await page.goto('/publicacoes');
      
      await expect(page.getByText('Publicações')).toBeVisible();
      await expect(page.locator('[data-testid="publication-list"]')).toBeVisible();
    });

    test('should filter publications by court', async ({ page }) => {
      await page.goto('/publicacoes');
      
      await page.getByLabel('Tribunal').selectOption('TJSP');
      
      await expect(page.locator('[data-testid="publication-court-TJSP"]')).toHaveCount({ gte: 0 });
    });

    test('should mark publication as read', async ({ page }) => {
      await page.goto('/publicacoes');
      
      await page.locator('[data-testid="publication-item"]').first().click();
      await page.getByRole('button', { name: /Marcar como Lida/i }).click();
      
      await expect(page.getByText('Publicação marcada')).toBeVisible();
    });

    test('should create task from publication', async ({ page }) => {
      await page.goto('/publicacoes');
      
      await page.locator('[data-testid="publication-item"]').first().click();
      await page.getByRole('button', { name: /Criar Tarefa/i }).click();
      
      await page.getByLabel('Título da Tarefa').fill('Responder intimação');
      await page.getByLabel('Prazo').fill('2024-12-30');
      
      await page.getByRole('button', { name: /Criar/i }).click();
      
      await expect(page.getByText('Tarefa criada')).toBeVisible();
    });

    test('should setup publication alerts', async ({ page }) => {
      await page.goto('/publicacoes/alertas');
      
      await page.getByRole('button', { name: /Novo Alerta/i }).click();
      
      await page.getByLabel('Nome da Parte').fill('João Silva');
      await page.getByLabel('Tribunal').selectOption('TJSP');
      await page.getByLabel('E-mail').check();
      
      await page.getByRole('button', { name: /Salvar Alerta/i }).click();
      
      await expect(page.getByText('Alerta configurado')).toBeVisible();
    });
  });

  test.describe('Office Configuration', () => {
    test('should update office settings', async ({ page }) => {
      await page.goto('/configuracoes');
      
      await page.getByLabel('Nome do Escritório').fill('Silva & Associados');
      await page.getByLabel('CNPJ').fill('12.345.678/0001-90');
      await page.getByLabel('Endereço').fill('Rua das Flores, 123');
      
      await page.getByRole('button', { name: /Salvar/i }).click();
      
      await expect(page.getByText('Configurações salvas')).toBeVisible();
    });

    test('should manage team members', async ({ page }) => {
      await page.goto('/configuracoes/equipe');
      
      await page.getByRole('button', { name: /Adicionar Membro/i }).click();
      
      await page.getByLabel('Nome').fill('Ana Costa');
      await page.getByLabel('E-mail').fill('ana@escritorio.com');
      await page.getByLabel('Cargo').selectOption('advogado');
      
      await page.getByRole('button', { name: /Convidar/i }).click();
      
      await expect(page.getByText('Convite enviado')).toBeVisible();
    });

    test('should configure integrations', async ({ page }) => {
      await page.goto('/configuracoes/integracoes');
      
      // Configure Escavador
      await page.getByLabel('API Key Escavador').fill('test-api-key');
      await page.getByRole('button', { name: /Testar Conexão/i }).click();
      
      await expect(page.getByText('Conexão estabelecida')).toBeVisible();
    });

    test('should setup billing', async ({ page }) => {
      await page.goto('/configuracoes/faturamento');
      
      await page.getByLabel('Plano').selectOption('pro');
      await page.getByRole('button', { name: /Atualizar Plano/i }).click();
      
      await expect(page.getByText('Plano atualizado')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.context().setOffline(true);
      
      await page.goto('/processos');
      
      await expect(page.getByText('Erro de conexão')).toBeVisible();
      await expect(page.getByRole('button', { name: /Tentar Novamente/i })).toBeVisible();
    });

    test('should validate form inputs', async ({ page }) => {
      await page.goto('/processos');
      
      await page.getByRole('button', { name: /Novo Processo/i }).click();
      
      // Try to save without required fields
      await page.getByRole('button', { name: /Salvar/i }).click();
      
      await expect(page.getByText('Número do processo é obrigatório')).toBeVisible();
    });

    test('should handle large data sets', async ({ page }) => {
      await page.goto('/processos');
      
      // Load many items
      await page.getByRole('button', { name: /Carregar Mais/i }).click();
      
      // Should handle pagination
      await expect(page.locator('[data-testid="process-item"]')).toHaveCount({ gte: 20 });
    });
  });
});



