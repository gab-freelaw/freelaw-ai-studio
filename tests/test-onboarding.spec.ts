import { test, expect } from '@playwright/test';

test('Fluxo completo de onboarding com OAB real 183619/MG', async ({ page }) => {
  // Navegar para a página de onboarding
  await page.goto('http://localhost:3000/onboarding');
  
  // Etapa 1: Preencher OAB e UF
  console.log('Etapa 1: Preenchendo OAB e UF...');
  
  // Preencher número da OAB
  await page.fill('input[placeholder="Digite apenas os números"]', '183619');
  
  // Selecionar UF (MG)
  await page.click('button:has-text("Selecione")');
  await page.click('text=MG');
  
  // Clicar em buscar processos
  await page.click('button:has-text("BUSCAR MEUS PROCESSOS")');
  
  // Aguardar a resposta da API
  await page.waitForTimeout(3000);
  
  // Etapa 2: Verificar se o nome do advogado aparece corretamente
  console.log('Etapa 2: Verificando dados do advogado...');
  
  // Verificar se chegou na tela de confirmação
  await expect(page.locator('text=Encontramos os processos!')).toBeVisible({ timeout: 10000 });
  
  // Verificar se o nome do advogado está sendo exibido (não deve ser "João Silva")
  const nomeAdvogado = await page.locator('h3.text-lg.font-semibold').textContent();
  console.log('Nome do advogado exibido:', nomeAdvogado);
  
  // Verificar que não é o nome mockado genérico
  expect(nomeAdvogado).not.toBe('João Silva');
  expect(nomeAdvogado).toContain('Gabriel');
  
  // Verificar OAB e UF
  await expect(page.locator('text=183619')).toBeVisible();
  await expect(page.locator('text=MG').first()).toBeVisible();
  
  // Verificar contadores de processos e clientes
  const processosCount = await page.locator('.text-2xl.font-bold.text-freelaw-purple').textContent();
  const clientesCount = await page.locator('.text-2xl.font-bold.text-blue-500').textContent();
  
  console.log('Processos encontrados:', processosCount);
  console.log('Clientes identificados:', clientesCount);
  
  // Clicar em confirmar
  await page.click('button:has-text("CONFIRMAR")');
  
  // Etapa 3: Verificar importação
  console.log('Etapa 3: Verificando importação...');
  
  // Aguardar tela de importação
  await expect(page.locator('text=Preparando seu ambiente')).toBeVisible({ timeout: 5000 });
  
  // Aguardar progresso
  await page.waitForTimeout(2000);
  
  // Verificar que o progresso está acontecendo
  const progressBar = page.locator('[role="progressbar"]');
  await expect(progressBar).toBeVisible();
  
  console.log('Teste concluído com sucesso!');
  console.log('Nome exibido:', nomeAdvogado);
  console.log('OAB: 183619/MG');
});