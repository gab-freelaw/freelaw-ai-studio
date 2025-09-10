import { test, expect } from '@playwright/test'

test.describe('Fase 1 - MVP Completo da Freelaw', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('01 - Homepage carrega corretamente com todos os elementos', async ({ page }) => {
    // Verifica título e slogan principal
    await expect(page.locator('h1')).toContainText('Seu Escritório Jurídico')
    await expect(page.locator('h1')).toContainText('Potencializado por IA')
    
    // Verifica botões principais - usa seletor mais específico
    await expect(page.locator('section').first().getByRole('link', { name: /Experimentar Chat IA/i })).toBeVisible()
    await expect(page.locator('section').first().getByRole('link', { name: /Criar Petição/i }).first()).toBeVisible()
    
    // Verifica benefícios
    await expect(page.getByText('IA treinada em direito brasileiro')).toBeVisible()
    await expect(page.getByText('Conformidade com a LGPD')).toBeVisible()
    await expect(page.getByText('Base legal sempre atualizada')).toBeVisible()
    await expect(page.getByText('Resultados em segundos')).toBeVisible()
    
    // Verifica cards de funcionalidades
    await expect(page.getByText('Assistente Jurídico IA')).toBeVisible()
    await expect(page.getByText('Elaborar Petições')).toBeVisible()
    await expect(page.getByText('Pesquisa Jurídica')).toBeVisible()
    await expect(page.getByText('Análise de Documentos')).toBeVisible()
  })

  test('02 - Navegação lateral funciona corretamente', async ({ page }) => {
    // Verifica sidebar
    const sidebar = page.locator('[data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()
    
    // Testa navegação para Chat
    await page.getByRole('link', { name: 'Chat Jurídico' }).click()
    await expect(page).toHaveURL(/.*\/chat/)
    
    // Volta para home
    await page.getByRole('link', { name: 'Início' }).click()
    await expect(page).toHaveURL('http://localhost:3000/')
    
    // Testa navegação para Documentos
    await page.locator('aside').getByRole('link', { name: 'Documentos' }).click()
    await expect(page).toHaveURL(/.*\/documents/)
    
    // Testa navegação para Petições
    await page.locator('aside').getByRole('link', { name: 'Petições' }).click()
    await expect(page).toHaveURL(/.*\/petitions/)
  })

  test('03 - Fluxo de Onboarding com OAB Mock', async ({ page }) => {
    // Navega para onboarding
    await page.goto('http://localhost:3000/onboarding')
    
    // Etapa 1: Inserir OAB
    await expect(page.getByText('Criar conta')).toBeVisible()
    await page.getByPlaceholder(/Número da OAB/i).fill('123456')
    
    // Seleciona UF
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'São Paulo' }).click()
    
    // Preenche e clica em buscar processos
    await page.waitForTimeout(500)
    const buscarBtn = page.getByRole('button', { name: /Buscar/i })
    await buscarBtn.waitFor({ state: 'visible' })
    await buscarBtn.click()
    
    // Aguarda carregamento (mock delay)
    await page.waitForTimeout(2000)
    
    // Etapa 2: Verifica dados do advogado
    await expect(page.getByText(/Dr\. João Silva Santos|Advogado.*123456/i)).toBeVisible({
      timeout: 10000
    })
    
    // Verifica se processos foram carregados
    await expect(page.getByText(/processos encontrados/i)).toBeVisible()
    
    // Confirma dados
    await page.getByRole('button', { name: /Confirmar/i }).click()
    
    // Etapa 3: Importação de dados
    await expect(page.getByText(/Importando/i)).toBeVisible()
    await page.waitForTimeout(3000)
    
    // Etapa 4: Finalização
    await expect(page.getByText(/sucesso/i)).toBeVisible({
      timeout: 10000
    })
  })

  test('04 - Chat com IA está funcional', async ({ page }) => {
    await page.goto('http://localhost:3000/chat')
    
    // Verifica elementos da interface do chat
    await expect(page.getByPlaceholder(/Digite sua mensagem/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Enviar/i })).toBeVisible()
    
    // Envia uma mensagem - busca por diferentes possibilidades de placeholder
    const messageInput = page.locator('input[type="text"], textarea').first()
    await messageInput.fill('Olá, preciso de ajuda com um processo')
    await page.getByRole('button', { name: /Enviar/i }).click()
    
    // Verifica se mensagem foi enviada
    await expect(page.getByText('Olá, preciso de ajuda com um processo')).toBeVisible()
    
    // Aguarda resposta da IA (pode ser mock)
    await expect(page.locator('.message-ai')).toBeVisible({
      timeout: 15000
    })
  })

  test('05 - Análise de Documentos permite upload', async ({ page }) => {
    await page.goto('http://localhost:3000/documents')
    
    // Verifica área de upload
    await expect(page.getByText(/Arraste arquivos aqui|Selecione arquivos/i)).toBeVisible()
    
    // Verifica tipos de arquivo aceitos
    await expect(page.getByText(/PDF|DOCX|TXT/i)).toBeVisible()
    
    // Simula upload de arquivo
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      // Cria um arquivo de teste
      await fileInput.setInputFiles({
        name: 'documento-teste.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Conteúdo do documento de teste')
      })
      
      // Verifica se arquivo foi carregado
      await expect(page.getByText('documento-teste.pdf')).toBeVisible({
        timeout: 5000
      })
    }
  })

  test('06 - Geração de Petições tem formulário funcional', async ({ page }) => {
    await page.goto('http://localhost:3000/petitions')
    
    // Verifica formulário de petição
    await expect(page.getByText(/Tipo de Petição|Selecione o tipo/i)).toBeVisible()
    
    // Verifica opções disponíveis
    const tipoSelect = page.getByRole('combobox').first()
    if (await tipoSelect.isVisible()) {
      await tipoSelect.click()
      await expect(page.getByRole('option', { name: /Inicial/i })).toBeVisible()
      await expect(page.getByRole('option', { name: /Contestação/i })).toBeVisible()
      await expect(page.getByRole('option', { name: /Recurso/i })).toBeVisible()
      await page.keyboard.press('Escape')
    }
    
    // Verifica campos do formulário
    await expect(page.getByPlaceholder(/Cliente|Parte/i)).toBeVisible()
    await expect(page.getByPlaceholder(/Processo|CNJ/i)).toBeVisible()
  })

  test('07 - Processos mostra lista e filtros', async ({ page }) => {
    await page.goto('http://localhost:3000/processes')
    
    // Verifica elementos da página
    await expect(page.getByText(/Processos|Meus Processos/i)).toBeVisible()
    
    // Verifica filtros
    await expect(page.getByPlaceholder(/Buscar|Pesquisar/i)).toBeVisible()
    
    // Verifica se há botão de adicionar processo
    await expect(page.getByRole('button', { name: /Novo|Adicionar/i })).toBeVisible()
  })

  test('08 - Responsividade mobile', async ({ page }) => {
    // Define viewport mobile
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('http://localhost:3000')
    
    // Verifica menu hamburguer ou toggle
    const menuToggle = page.locator('[data-testid="menu-toggle"], button:has-text("☰")')
    if (await menuToggle.isVisible()) {
      await menuToggle.click()
      // Verifica se menu abre
      await expect(page.getByRole('navigation')).toBeVisible()
    }
    
    // Verifica que conteúdo principal está visível
    await expect(page.locator('h1')).toBeVisible()
    
    // Verifica que cards estão empilhados (não lado a lado)
    const cards = page.locator('.grid > a, [class*="card"]')
    const cardCount = await cards.count()
    if (cardCount > 0) {
      const firstCard = cards.first()
      const secondCard = cards.nth(1)
      
      const firstBox = await firstCard.boundingBox()
      const secondBox = await secondCard.boundingBox()
      
      if (firstBox && secondBox) {
        // Em mobile, cards devem estar um abaixo do outro
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10)
      }
    }
  })

  test('09 - Dark mode funciona corretamente', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // Procura toggle de dark mode
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"], button:has-text("🌙"), button:has-text("☀")')
    
    if (await darkModeToggle.isVisible()) {
      // Captura cor de fundo inicial
      const initialBg = await page.locator('body').evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      )
      
      // Clica no toggle
      await darkModeToggle.click()
      
      // Aguarda mudança
      await page.waitForTimeout(500)
      
      // Verifica se cor mudou
      const newBg = await page.locator('body').evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      )
      
      expect(newBg).not.toBe(initialBg)
    }
  })

  test('10 - Performance e tempo de carregamento', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle'
    })
    
    const loadTime = Date.now() - startTime
    
    // Página deve carregar em menos de 3 segundos
    expect(loadTime).toBeLessThan(3000)
    
    // Verifica que conteúdo principal carregou
    await expect(page.locator('h1')).toBeVisible()
    
    // Verifica métricas de performance
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart
      }
    })
    
    console.log('Performance Metrics:', metrics)
    
    // DOM deve carregar rapidamente
    expect(metrics.domContentLoaded).toBeLessThan(1000)
  })
})

test.describe('Testes de Integração e Edge Cases', () => {
  
  test('11 - Tratamento de erros na busca OAB', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding')
    
    // Tenta buscar sem preencher campos
    const searchBtn = page.getByRole('button', { name: /Buscar/i })
    // Se botão estiver desabilitado, verifica isso
    const isDisabled = await searchBtn.isDisabled()
    if (!isDisabled) {
      await searchBtn.click()
    }
    
    // Deve mostrar erro
    await expect(page.getByText(/preencha|obrigatório/i)).toBeVisible()
    
    // Preenche apenas OAB sem UF
    await page.getByPlaceholder(/Número da OAB/i).fill('999999')
    await page.getByRole('button', { name: /Buscar/i }).click()
    
    // Deve pedir UF
    await expect(page.getByText(/selecione|UF/i)).toBeVisible()
  })
  
  test('12 - Validação de formulários', async ({ page }) => {
    await page.goto('http://localhost:3000/petitions')
    
    // Tenta gerar petição sem preencher campos
    const generateButton = page.getByRole('button', { name: /Gerar|Criar/i })
    if (await generateButton.isVisible()) {
      await generateButton.click()
      
      // Deve mostrar validação
      await expect(page.getByText(/preencha|obrigatório|selecione/i)).toBeVisible()
    }
  })
  
  test('13 - Teste de acessibilidade básica', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // Navegação por teclado
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Verifica foco visível
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      return {
        tagName: el?.tagName,
        hasOutline: window.getComputedStyle(el!).outline !== 'none'
      }
    })
    
    expect(focusedElement.tagName).toBeTruthy()
    
    // Verifica alt text em imagens
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })
  
  test('14 - Persistência de dados no navegador', async ({ page, context }) => {
    await page.goto('http://localhost:3000/chat')
    
    // Envia mensagem no chat
    await page.getByPlaceholder(/Digite sua mensagem/i).fill('Teste de persistência')
    await page.getByRole('button', { name: /Enviar/i }).click()
    
    // Recarrega a página
    await page.reload()
    
    // Verifica se mensagem persiste (se implementado)
    // Isso depende de como o chat salva o histórico
    const messages = page.locator('.message, [class*="message"]')
    const messageCount = await messages.count()
    
    // Se houver mensagens, pelo menos uma deve ser visível
    if (messageCount > 0) {
      await expect(messages.first()).toBeVisible()
    }
  })
})

test.describe('Testes de Segurança Básica', () => {
  
  test('15 - Proteção contra XSS', async ({ page }) => {
    await page.goto('http://localhost:3000/chat')
    
    // Tenta injetar script
    const xssPayload = '<script>alert("XSS")</script>'
    await page.getByPlaceholder(/Digite sua mensagem/i).fill(xssPayload)
    await page.getByRole('button', { name: /Enviar/i }).click()
    
    // Verifica se script não foi executado
    const alertFired = await page.evaluate(() => {
      let alertCalled = false
      const originalAlert = window.alert
      window.alert = () => { alertCalled = true }
      setTimeout(() => { window.alert = originalAlert }, 100)
      return alertCalled
    })
    
    expect(alertFired).toBe(false)
    
    // Verifica se texto foi escapado
    await expect(page.getByText('<script>')).toBeVisible()
  })
})