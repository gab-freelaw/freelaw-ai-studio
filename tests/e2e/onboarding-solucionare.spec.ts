import { test, expect } from '@playwright/test';

test.describe('Onboarding com Solucionare', () => {
  test('fluxo completo de onboarding - OAB, validação, processos e clientes', async ({ page }) => {
    // 1. Navegar para a página de onboarding
    await page.goto('http://localhost:3002/onboarding');
    
    // Verificar se a página carregou corretamente
    await expect(page).toHaveTitle(/Freelaw/);
    await expect(page.getByText('Todos os seus processos no Freelaw AI com apenas um clique')).toBeVisible();
    
    // 2. Preencher OAB e UF
    console.log('Etapa 1: Preenchendo OAB e UF');
    
    // Preencher número da OAB
    await page.getByPlaceholder('Digite apenas os números').fill('123456');
    
    // Selecionar UF
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'São Paulo (SP)' }).click();
    
    // Verificar que os campos foram preenchidos
    await expect(page.getByPlaceholder('Digite apenas os números')).toHaveValue('123456');
    
    // 3. Buscar processos
    console.log('Etapa 2: Buscando processos com Solucionare');
    
    // Clicar no botão de buscar processos
    await page.getByRole('button', { name: /BUSCAR PROCESSOS/ }).click();
    
    // Aguardar a resposta da API (pode demorar um pouco)
    await page.waitForResponse(
      response => response.url().includes('/api/onboarding/buscar-processos') && response.status() === 200,
      { timeout: 30000 }
    );
    
    // 4. Validar dados do advogado
    console.log('Etapa 3: Validando informações do advogado');
    
    // Aguardar a tela de confirmação aparecer
    await expect(page.getByText('Encontramos os processos!')).toBeVisible({ timeout: 10000 });
    
    // Verificar se o nome do advogado está presente
    // Como estamos usando dados de exemplo, o nome pode variar
    const advogadoInfo = page.locator('.bg-blue-50').first();
    await expect(advogadoInfo).toBeVisible();
    
    // Verificar OAB e UF
    await expect(page.getByText('123456')).toBeVisible();
    await expect(page.getByText('SP')).toBeVisible();
    
    // Verificar estatísticas de processos e clientes
    const processosCard = page.locator('text=/Processos encontrados/').locator('..');
    await expect(processosCard).toBeVisible();
    
    const clientesCard = page.locator('text=/Clientes identificados/').locator('..');
    await expect(clientesCard).toBeVisible();
    
    // 5. Confirmar dados e iniciar importação
    console.log('Etapa 4: Confirmando dados e iniciando importação');
    
    await page.getByRole('button', { name: 'CONFIRMAR' }).click();
    
    // 6. Aguardar importação dos processos e clientes
    console.log('Etapa 5: Aguardando importação de processos e clientes');
    
    // Verificar tela de progresso
    await expect(page.getByText('Preparando seu ambiente')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Estamos importando seus processos e cadastrando seus clientes automaticamente')).toBeVisible();
    
    // Verificar barra de progresso
    const progressBar = page.getByRole('progressbar');
    await expect(progressBar).toBeVisible();
    
    // Aguardar conclusão da importação
    // Verificar checkmarks de conclusão
    await expect(page.locator('text=Dados do advogado salvos').first()).toBeVisible({ timeout: 30000 });
    
    // 7. Verificar tela de conclusão
    console.log('Etapa 6: Verificando conclusão do onboarding');
    
    // Aguardar tela final
    await expect(page.getByText(/Parabéns! O Freelaw AI está pronto/)).toBeVisible({ timeout: 30000 });
    
    // Verificar resumo de importação
    await expect(page.getByText('Processos importados com sucesso')).toBeVisible();
    await expect(page.getByText('Clientes cadastrados automaticamente')).toBeVisible();
    await expect(page.getByText('Monitoramento ativado')).toBeVisible();
    
    // Verificar botão para ver processos
    const verProcessosBtn = page.getByRole('button', { name: /VER MEUS PROCESSOS/ });
    await expect(verProcessosBtn).toBeVisible();
    
    // 8. Navegar para a página de processos
    console.log('Etapa 7: Navegando para página de processos');
    
    await verProcessosBtn.click();
    
    // Verificar redirecionamento
    await expect(page).toHaveURL(/.*\/processes/);
    
    console.log('✅ Onboarding concluído com sucesso!');
  });

  test('validação de campos obrigatórios', async ({ page }) => {
    await page.goto('http://localhost:3002/onboarding');
    
    // Tentar buscar sem preencher campos
    await page.getByRole('button', { name: /BUSCAR PROCESSOS/ }).click();
    
    // Verificar mensagem de erro
    await expect(page.getByText('Por favor, preencha o número da OAB e selecione a UF')).toBeVisible();
  });

  test('fluxo com OAB real para teste com Solucionare', async ({ page }) => {
    // Este teste usa uma OAB real para testar a integração com Solucionare
    // Só deve ser executado se tivermos credenciais válidas da API
    
    await page.goto('http://localhost:3002/onboarding');
    
    // Usar uma OAB de teste conhecida (substituir por uma válida para testes)
    await page.getByPlaceholder('Digite apenas os números').fill('183619');
    
    // Selecionar UF
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'São Paulo (SP)' }).click();
    
    // Buscar processos
    await page.getByRole('button', { name: /BUSCAR PROCESSOS/ }).click();
    
    // Interceptar a resposta da API
    const response = await page.waitForResponse(
      response => response.url().includes('/api/onboarding/buscar-processos'),
      { timeout: 30000 }
    );
    
    const responseData = await response.json();
    
    // Verificar estrutura da resposta
    expect(responseData).toHaveProperty('advogado');
    expect(responseData).toHaveProperty('processos');
    expect(responseData).toHaveProperty('clientes');
    expect(responseData).toHaveProperty('estatisticas');
    
    // Verificar que está usando Solucionare
    expect(responseData.estatisticas).toHaveProperty('usando_solucionare', true);
    expect(responseData.estatisticas).toHaveProperty('provedor', 'Solucionare');
    
    console.log('Resposta da API Solucionare:', {
      advogado: responseData.advogado?.nome,
      totalProcessos: responseData.estatisticas?.total_processos,
      totalClientes: responseData.estatisticas?.total_clientes,
      provedor: responseData.estatisticas?.provedor
    });
  });
});