import { test, expect } from '@playwright/test';

test.describe('AI Features - Complete Coverage', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as office user
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('office@freelaw.com.br');
    await page.getByLabel('Senha').fill('office123');
    await page.getByRole('button', { name: /Entrar/i }).click();
  });

  test.describe('Legal AI Chat', () => {
    test('should access AI chat from dashboard', async ({ page }) => {
      await page.goto('/');
      
      await page.getByRole('button', { name: /Chat Jurídico/i }).click();
      
      await expect(page.locator('[data-testid="ai-chat-interface"]')).toBeVisible();
      await expect(page.getByText('Assistente Jurídico IA')).toBeVisible();
    });

    test('should send message to AI and get response', async ({ page }) => {
      await page.goto('/chat');
      
      const message = 'Como elaborar uma petição inicial?';
      await page.getByPlaceholder('Digite sua pergunta jurídica...').fill(message);
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      // Should show user message
      await expect(page.getByText(message)).toBeVisible();
      
      // Should show AI response
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
      await expect(page.getByText(/Para elaborar uma petição inicial/i)).toBeVisible();
    });

    test('should use multi-model AI selection', async ({ page }) => {
      await page.goto('/chat');
      
      // Open model selection
      await page.getByRole('button', { name: /Modelo IA/i }).click();
      
      // Should show available models
      await expect(page.getByText('GPT-4')).toBeVisible();
      await expect(page.getByText('Claude')).toBeVisible();
      await expect(page.getByText('Gemini')).toBeVisible();
      
      // Select Claude
      await page.getByText('Claude').click();
      
      await page.getByPlaceholder('Digite sua pergunta jurídica...').fill('Análise de contrato');
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      // Should show model indicator
      await expect(page.getByText('Claude')).toBeVisible();
    });

    test('should access process context in chat', async ({ page }) => {
      await page.goto('/chat');
      
      const message = 'Analise o processo 1001234-56.2023.8.26.0100';
      await page.getByPlaceholder('Digite sua pergunta jurídica...').fill(message);
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      // Should show process analysis
      await expect(page.getByText(/Processo localizado/i)).toBeVisible();
      await expect(page.getByText(/Análise do processo/i)).toBeVisible();
    });

    test('should suggest legal actions', async ({ page }) => {
      await page.goto('/chat');
      
      await page.getByPlaceholder('Digite sua pergunta jurídica...').fill('Cliente sofreu acidente de trabalho');
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      // Should suggest actions
      await expect(page.getByText(/Ações recomendadas/i)).toBeVisible();
      await expect(page.getByText(/Ação de Indenização/i)).toBeVisible();
    });

    test('should generate jurisprudence search', async ({ page }) => {
      await page.goto('/chat');
      
      await page.getByPlaceholder('Digite sua pergunta jurídica...').fill('Jurisprudência sobre danos morais');
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      // Should show jurisprudence
      await expect(page.getByText(/Jurisprudência encontrada/i)).toBeVisible();
      await expect(page.locator('[data-testid="jurisprudence-result"]')).toBeVisible();
    });
  });

  test.describe('Petition Generation AI', () => {
    test('should generate initial petition', async ({ page }) => {
      await page.goto('/peticoes/nova');
      
      // Select petition type
      await page.getByLabel('Tipo de Petição').selectOption('peticao-inicial');
      
      // Fill basic data
      await page.getByLabel('Área do Direito').selectOption('civil');
      await page.getByLabel('Autor').fill('João da Silva');
      await page.getByLabel('Réu').fill('Empresa XYZ Ltda');
      await page.getByLabel('Fatos').fill('Cliente sofreu danos em acidente');
      await page.getByLabel('Pedidos').fill('Indenização por danos morais e materiais');
      
      // Generate with AI
      await page.getByRole('button', { name: /Gerar com IA/i }).click();
      
      // Should show generation progress
      await expect(page.getByText('Gerando petição...')).toBeVisible();
      
      // Should show generated petition
      await expect(page.locator('[data-testid="generated-petition"]')).toBeVisible();
      await expect(page.getByText('EXCELENTÍSSIMO')).toBeVisible();
    });

    test('should apply office style to petition', async ({ page }) => {
      await page.goto('/peticoes/nova');
      
      // Enable office style
      await page.getByLabel('Usar Estilo do Escritório').check();
      
      await page.getByLabel('Tipo de Petição').selectOption('contestacao');
      await page.getByLabel('Área do Direito').selectOption('trabalhista');
      
      await page.getByRole('button', { name: /Gerar com IA/i }).click();
      
      // Should apply office formatting
      await expect(page.getByText('Estilo aplicado')).toBeVisible();
    });

    test('should use letterhead in petition', async ({ page }) => {
      await page.goto('/peticoes/nova');
      
      await page.getByLabel('Incluir Timbre').check();
      
      await page.getByRole('button', { name: /Gerar com IA/i }).click();
      
      // Should include letterhead
      await expect(page.locator('[data-testid="petition-letterhead"]')).toBeVisible();
    });

    test('should generate different petition types', async ({ page }) => {
      const petitionTypes = [
        'peticao-inicial',
        'contestacao', 
        'recurso-apelacao',
        'mandado-seguranca',
        'embargos-declaracao'
      ];
      
      for (const type of petitionTypes) {
        await page.goto('/peticoes/nova');
        
        await page.getByLabel('Tipo de Petição').selectOption(type);
        await page.getByRole('button', { name: /Gerar com IA/i }).click();
        
        await expect(page.locator('[data-testid="generated-petition"]')).toBeVisible();
      }
    });

    test('should enhance petition quality', async ({ page }) => {
      await page.goto('/peticoes/nova');
      
      await page.getByLabel('Tipo de Petição').selectOption('peticao-inicial');
      await page.getByRole('button', { name: /Gerar com IA/i }).click();
      
      // Wait for generation
      await expect(page.locator('[data-testid="generated-petition"]')).toBeVisible();
      
      // Use enhancement features
      await page.getByRole('button', { name: /Aprimorar/i }).click();
      
      await expect(page.getByText('Petição aprimorada')).toBeVisible();
    });

    test('should save generated petition', async ({ page }) => {
      await page.goto('/peticoes/nova');
      
      await page.getByLabel('Tipo de Petição').selectOption('peticao-inicial');
      await page.getByRole('button', { name: /Gerar com IA/i }).click();
      
      await expect(page.locator('[data-testid="generated-petition"]')).toBeVisible();
      
      await page.getByRole('button', { name: /Salvar/i }).click();
      
      await expect(page.getByText('Petição salva')).toBeVisible();
    });
  });

  test.describe('Document Analysis AI', () => {
    test('should upload and analyze document', async ({ page }) => {
      await page.goto('/documentos/analise');
      
      // Upload document
      const fileInput = page.getByLabel('Upload de Documento');
      await fileInput.setInputFiles('tests/fixtures/test-document.pdf');
      
      // Start analysis
      await page.getByRole('button', { name: /Analisar com IA/i }).click();
      
      // Should show analysis progress
      await expect(page.getByText('Analisando documento...')).toBeVisible();
      
      // Should show analysis results
      await expect(page.locator('[data-testid="document-analysis"]')).toBeVisible();
      await expect(page.getByText('Tipo de Documento:')).toBeVisible();
      await expect(page.getByText('Resumo:')).toBeVisible();
    });

    test('should extract key information', async ({ page }) => {
      await page.goto('/documentos/analise');
      
      await page.getByLabel('Upload de Documento').setInputFiles('tests/fixtures/contract.pdf');
      await page.getByRole('button', { name: /Analisar com IA/i }).click();
      
      // Should extract structured data
      await expect(page.getByText('Informações Extraídas')).toBeVisible();
      await expect(page.locator('[data-testid="extracted-parties"]')).toBeVisible();
      await expect(page.locator('[data-testid="extracted-dates"]')).toBeVisible();
      await expect(page.locator('[data-testid="extracted-values"]')).toBeVisible();
    });

    test('should classify document type', async ({ page }) => {
      await page.goto('/documentos/analise');
      
      await page.getByLabel('Upload de Documento').setInputFiles('tests/fixtures/petition.pdf');
      await page.getByRole('button', { name: /Analisar com IA/i }).click();
      
      // Should classify correctly
      await expect(page.getByText('Petição Inicial')).toBeVisible();
      await expect(page.getByText('Confiança: 95%')).toBeVisible();
    });

    test('should generate document summary', async ({ page }) => {
      await page.goto('/documentos/analise');
      
      await page.getByLabel('Upload de Documento').setInputFiles('tests/fixtures/judgment.pdf');
      await page.getByRole('button', { name: /Analisar com IA/i }).click();
      
      // Should generate summary
      await expect(page.getByText('Resumo Executivo')).toBeVisible();
      await expect(page.locator('[data-testid="document-summary"]')).toBeVisible();
    });

    test('should identify legal risks', async ({ page }) => {
      await page.goto('/documentos/analise');
      
      await page.getByLabel('Upload de Documento').setInputFiles('tests/fixtures/contract.pdf');
      await page.getByRole('button', { name: /Analisar com IA/i }).click();
      
      // Should identify risks
      await expect(page.getByText('Riscos Identificados')).toBeVisible();
      await expect(page.locator('[data-testid="risk-analysis"]')).toBeVisible();
    });
  });

  test.describe('Office Style AI Analysis', () => {
    test('should analyze document style', async ({ page }) => {
      await page.goto('/office-style');
      
      // Upload document for style analysis
      await page.getByLabel('Upload para Análise').setInputFiles('tests/fixtures/office-document.pdf');
      
      // Start analysis
      await page.getByRole('button', { name: /Analisar Estilo/i }).click();
      
      // Should show analysis progress
      await expect(page.getByText('Analisando estilo...')).toBeVisible();
      
      // Should show style analysis
      await expect(page.getByText('Análise de Estilo Completa')).toBeVisible();
      await expect(page.getByText('Tipografia:')).toBeVisible();
      await expect(page.getByText('Layout:')).toBeVisible();
      await expect(page.getByText('Linguagem:')).toBeVisible();
    });

    test('should extract letterhead', async ({ page }) => {
      await page.goto('/office-style');
      
      await page.getByLabel('Upload para Análise').setInputFiles('tests/fixtures/letterhead-document.pdf');
      await page.getByLabel('Extrair Timbre').check();
      
      await page.getByRole('button', { name: /Analisar Estilo/i }).click();
      
      // Should extract letterhead
      await expect(page.getByText('Timbre Extraído')).toBeVisible();
      await expect(page.locator('[data-testid="extracted-letterhead"]')).toBeVisible();
    });

    test('should save style as default', async ({ page }) => {
      await page.goto('/office-style');
      
      await page.getByLabel('Upload para Análise').setInputFiles('tests/fixtures/office-document.pdf');
      await page.getByLabel('Salvar como Padrão').check();
      
      await page.getByRole('button', { name: /Analisar Estilo/i }).click();
      
      // Should save as default
      await expect(page.getByText('Estilo salvo como padrão')).toBeVisible();
    });

    test('should show style preview', async ({ page }) => {
      await page.goto('/office-style');
      
      // Should show current styles
      await expect(page.locator('[data-testid="style-preview"]')).toBeVisible();
      await expect(page.getByText('Estilos do Escritório')).toBeVisible();
    });
  });

  test.describe('AI Task Management', () => {
    test('should generate AI insights for tasks', async ({ page }) => {
      await page.goto('/tarefas');
      
      // Should show AI insights
      await expect(page.getByText('Insights da IA')).toBeVisible();
      await expect(page.locator('[data-testid="ai-insights"]')).toBeVisible();
    });

    test('should suggest task priorities', async ({ page }) => {
      await page.goto('/tarefas');
      
      // Create new task
      await page.getByRole('button', { name: /Nova Tarefa/i }).click();
      
      await page.getByLabel('Título').fill('Analisar contrato urgente');
      await page.getByLabel('Descrição').fill('Cliente precisa de resposta hoje');
      
      // AI should suggest priority
      await expect(page.getByText('IA sugere: Prioridade Alta')).toBeVisible();
    });

    test('should recommend task distribution', async ({ page }) => {
      await page.goto('/tarefas');
      
      // Should show distribution recommendations
      await expect(page.getByText('Recomendações de Distribuição')).toBeVisible();
      await expect(page.locator('[data-testid="task-distribution"]')).toBeVisible();
    });

    test('should predict task completion time', async ({ page }) => {
      await page.goto('/tarefas');
      
      await page.locator('[data-testid="task-item"]').first().click();
      
      // Should show time prediction
      await expect(page.getByText('Tempo estimado:')).toBeVisible();
      await expect(page.getByText(/\d+ horas/)).toBeVisible();
    });
  });

  test.describe('AI Analytics Dashboard', () => {
    test('should show AI-powered insights', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should show AI analytics
      await expect(page.getByText('Insights Inteligentes')).toBeVisible();
      await expect(page.locator('[data-testid="ai-analytics"]')).toBeVisible();
    });

    test('should predict case outcomes', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should show predictions
      await expect(page.getByText('Previsões de Casos')).toBeVisible();
      await expect(page.locator('[data-testid="case-predictions"]')).toBeVisible();
    });

    test('should analyze productivity patterns', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should show productivity analysis
      await expect(page.getByText('Análise de Produtividade')).toBeVisible();
      await expect(page.locator('[data-testid="productivity-analysis"]')).toBeVisible();
    });

    test('should recommend optimizations', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should show recommendations
      await expect(page.getByText('Recomendações')).toBeVisible();
      await expect(page.locator('[data-testid="ai-recommendations"]')).toBeVisible();
    });
  });

  test.describe('Process Management AI', () => {
    test('should import processes automatically', async ({ page }) => {
      await page.goto('/processos');
      
      await page.getByRole('button', { name: /Importar Processos/i }).click();
      
      // Should use AI to import
      await expect(page.getByText('Buscando processos...')).toBeVisible();
      await expect(page.getByText('IA encontrou 15 processos')).toBeVisible();
    });

    test('should categorize processes with AI', async ({ page }) => {
      await page.goto('/processos');
      
      // Should show AI categorization
      await expect(page.locator('[data-testid="process-category"]')).toBeVisible();
      await expect(page.getByText('Categorizado por IA')).toBeVisible();
    });

    test('should predict deadlines', async ({ page }) => {
      await page.goto('/processos');
      
      await page.locator('[data-testid="process-item"]').first().click();
      
      // Should show deadline predictions
      await expect(page.getByText('Próximos Prazos Previstos')).toBeVisible();
      await expect(page.locator('[data-testid="deadline-predictions"]')).toBeVisible();
    });

    test('should analyze process patterns', async ({ page }) => {
      await page.goto('/processos/analytics');
      
      // Should show pattern analysis
      await expect(page.getByText('Padrões Identificados')).toBeVisible();
      await expect(page.locator('[data-testid="process-patterns"]')).toBeVisible();
    });
  });

  test.describe('Error Handling for AI Features', () => {
    test('should handle AI service failures gracefully', async ({ page }) => {
      // Mock AI service failure
      await page.route('/api/chat', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'AI service unavailable' })
        });
      });

      await page.goto('/chat');
      
      await page.getByPlaceholder('Digite sua pergunta jurídica...').fill('Teste');
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      await expect(page.getByText('Serviço de IA temporariamente indisponível')).toBeVisible();
    });

    test('should show fallback options when AI fails', async ({ page }) => {
      await page.route('/api/petitions/generate', route => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'AI generation failed' })
        });
      });

      await page.goto('/peticoes/nova');
      
      await page.getByRole('button', { name: /Gerar com IA/i }).click();
      
      await expect(page.getByText('Usar template manual')).toBeVisible();
      await expect(page.getByRole('button', { name: /Continuar sem IA/i })).toBeVisible();
    });

    test('should validate AI input data', async ({ page }) => {
      await page.goto('/chat');
      
      // Try to send empty message
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      await expect(page.getByText('Mensagem não pode estar vazia')).toBeVisible();
    });

    test('should handle large document processing', async ({ page }) => {
      await page.goto('/documentos/analise');
      
      // Mock large file
      await page.route('/api/documents/upload', route => {
        route.fulfill({
          status: 413,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Documento muito grande para processamento' })
        });
      });
      
      await page.getByLabel('Upload de Documento').setInputFiles('tests/fixtures/large-document.pdf');
      
      await expect(page.getByText('Documento muito grande')).toBeVisible();
    });
  });
});



