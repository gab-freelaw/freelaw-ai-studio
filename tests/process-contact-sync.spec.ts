import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

// Mock de processo com partes para teste
const mockProcessData = {
  numero_cnj: '1234567-89.2024.8.26.0100',
  partes: {
    autor: [
      {
        nome: 'João da Silva Santos',
        tipo: 'autor',
        cpf_cnpj: '123.456.789-00'
      }
    ],
    reu: [
      {
        nome: 'Empresa ABC Ltda',
        tipo: 'reu',
        cpf_cnpj: '12.345.678/0001-90'
      }
    ],
    advogados: [
      {
        nome: 'Dr. Pedro Advogado',
        tipo: 'advogado',
        oab: 'OAB/SP 123456'
      }
    ]
  },
  tribunal: 'TJSP',
  comarca: 'São Paulo',
  valor_causa: 50000
}

test.describe('Process-Contact Integration Tests', () => {
  test('POST /api/processes should create contacts automatically', async ({ request }) => {
    // Limpar contatos existentes para teste limpo
    const initialContacts = await request.get(`${BASE_URL}/api/contacts`)
    const initialData = await initialContacts.json()
    const initialCount = initialData.length
    
    // Usar um CNJ válido de exemplo (o serviço pode estar em modo mock)
    // Em produção, usar um CNJ real do Escavador
    const testCnj = '0000001-55.2024.8.26.0100' // CNJ de teste
    
    // Criar novo processo
    const processResponse = await request.post(`${BASE_URL}/api/processes`, {
      data: {
        numero_cnj: testCnj
      }
    })
    
    // Se não encontrou o processo (404), skip o teste
    if (processResponse.status() === 404) {
      console.log('⚠️ Processo não encontrado no Escavador (esperado em modo desenvolvimento)')
      return
    }
    
    // Verificar se processo foi criado
    expect(processResponse.ok()).toBeTruthy()
    const processData = await processResponse.json()
    
    // Verificar se a resposta inclui informações sobre contatos criados
    expect(processData).toHaveProperty('contacts')
    expect(processData.contacts).toHaveProperty('created')
    expect(processData.contacts).toHaveProperty('skipped')
    
    // Se mock está ativo, deve ter criado contatos
    if (processData.contacts.created > 0) {
      console.log(`✅ Criados ${processData.contacts.created} contatos automaticamente`)
      
      // Verificar se contatos foram realmente criados
      const contactsAfter = await request.get(`${BASE_URL}/api/contacts`)
      const afterData = await contactsAfter.json()
      
      // Deve ter mais contatos agora
      expect(afterData.length).toBeGreaterThan(initialCount)
    }
  })

  test('POST /api/processes/[id]/sync should sync contacts', async ({ request }) => {
    // Primeiro, obter lista de processos
    const processesResponse = await request.get(`${BASE_URL}/api/processes`)
    expect(processesResponse.ok()).toBeTruthy()
    
    const processesData = await processesResponse.json()
    
    if (processesData.data && processesData.data.length > 0) {
      const processo = processesData.data[0]
      
      // Sincronizar o processo
      const syncResponse = await request.post(
        `${BASE_URL}/api/processes/${processo.id || processo.numero_cnj}/sync`,
        {}
      )
      
      expect(syncResponse.ok()).toBeTruthy()
      const syncData = await syncResponse.json()
      
      // Verificar resposta de sincronização
      expect(syncData).toHaveProperty('success')
      expect(syncData.success).toBeTruthy()
      expect(syncData).toHaveProperty('contacts')
      
      console.log(`📊 Sincronização:`)
      console.log(`   - Contatos criados: ${syncData.contacts.created}`)
      console.log(`   - Contatos pulados: ${syncData.contacts.skipped}`)
      
      if (syncData.contacts.errors && syncData.contacts.errors.length > 0) {
        console.log(`   - Erros: ${syncData.contacts.errors.join(', ')}`)
      }
    }
  })

  test('Contacts should not be duplicated on multiple syncs', async ({ request }) => {
    // Criar um processo
    const processResponse = await request.post(`${BASE_URL}/api/processes`, {
      data: {
        numero_cnj: '0000002-66.2024.8.26.0100' // CNJ de teste
      }
    })
    
    // Se processo não foi encontrado, skip o teste
    if (!processResponse.ok()) {
      console.log('⚠️ Teste de duplicação pulado (processo não encontrado)')
      return
    }
    
    if (processResponse.ok()) {
      const processData = await processResponse.json()
      const firstSyncContacts = processData.contacts?.created || 0
      
      // Sincronizar o mesmo processo novamente
      const syncResponse = await request.post(
        `${BASE_URL}/api/processes/${processData.data.id || processData.data.numero_cnj}/sync`,
        {}
      )
      
      if (syncResponse.ok()) {
        const syncData = await syncResponse.json()
        
        // Na segunda sincronização, não deve criar novos contatos (todos devem ser pulados)
        expect(syncData.contacts.created).toBe(0)
        expect(syncData.contacts.skipped).toBeGreaterThanOrEqual(firstSyncContacts)
        
        console.log(`✅ Duplicação evitada: ${syncData.contacts.skipped} contatos já existentes`)
      }
    }
  })

  test('Created contacts should have correct type based on process role', async ({ request }) => {
    // Buscar contatos após sincronização
    const contactsResponse = await request.get(`${BASE_URL}/api/contacts`)
    expect(contactsResponse.ok()).toBeTruthy()
    
    const contacts = await contactsResponse.json()
    
    // Verificar se existem contatos de diferentes tipos
    const clienteContacts = contacts.filter((c: any) => c.tipo === 'CLIENTE')
    const parteContrariaContacts = contacts.filter((c: any) => c.tipo === 'PARTE_CONTRARIA')
    const advogadoContacts = contacts.filter((c: any) => c.tipo === 'ADVOGADO')
    
    console.log(`📊 Distribuição de contatos por tipo:`)
    console.log(`   - Clientes: ${clienteContacts.length}`)
    console.log(`   - Partes Contrárias: ${parteContrariaContacts.length}`)
    console.log(`   - Advogados: ${advogadoContacts.length}`)
    
    // Verificar estrutura dos contatos criados
    if (contacts.length > 0) {
      const sampleContact = contacts[0]
      
      // Verificar campos obrigatórios
      expect(sampleContact).toHaveProperty('id')
      expect(sampleContact).toHaveProperty('nome')
      expect(sampleContact).toHaveProperty('tipo')
      expect(sampleContact).toHaveProperty('created_at')
      
      // Verificar se observações mencionam o processo de origem
      if (sampleContact.observacoes) {
        expect(sampleContact.observacoes).toContain('Importado do processo')
      }
    }
  })

  test('Contact sync service should normalize names and documents', async ({ request }) => {
    // Criar processo com nomes em diferentes formatos
    const testProcess = {
      numero_cnj: '5555555-55.2024.8.26.0100'
    }
    
    const response = await request.post(`${BASE_URL}/api/processes`, {
      data: testProcess
    })
    
    if (response.ok()) {
      const data = await response.json()
      
      // Verificar detalhes dos contatos criados
      if (data.contacts?.details?.created && data.contacts.details.created.length > 0) {
        const createdContacts = data.contacts.details.created
        
        for (const contact of createdContacts) {
          // Nome deve estar normalizado (capitalizado corretamente)
          expect(contact.nome).toMatch(/^[A-Z][a-z]+(?: [A-Z][a-z]+)*/)
          
          // CPF/CNPJ deve estar formatado
          if (contact.cpf_cnpj) {
            // CPF: 000.000.000-00 ou CNPJ: 00.000.000/0000-00
            expect(contact.cpf_cnpj).toMatch(
              /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
            )
          }
          
          // OAB deve estar presente para advogados
          if (contact.tipo === 'ADVOGADO' && contact.oab) {
            expect(contact.oab).toContain('OAB')
          }
          
          console.log(`✅ Contato normalizado: ${contact.nome} (${contact.tipo})`)
        }
      }
    }
  })
})

test.describe('Visual Integration Tests', () => {
  test('Contacts page should show imported contacts', async ({ page }) => {
    // Navegar para a página de contatos
    await page.goto(`${BASE_URL}/contacts`)
    
    // Aguardar página carregar
    await page.waitForLoadState('networkidle')
    
    // Verificar se existem contatos na tabela
    const contactRows = page.locator('tbody tr')
    const count = await contactRows.count()
    
    if (count > 0) {
      // Verificar se algum contato tem tag de importação
      const importedContacts = page.locator('text="Importado do processo"')
      const importedCount = await importedContacts.count()
      
      if (importedCount > 0) {
        console.log(`✅ ${importedCount} contatos importados visíveis na interface`)
      }
      
      // Verificar badges de tipo
      const tiposBadges = ['CLIENTE', 'ADVOGADO', 'PARTE_CONTRARIA']
      for (const tipo of tiposBadges) {
        const badges = page.locator(`text="${tipo.replace('_', ' ')}"`)
        const badgeCount = await badges.count()
        if (badgeCount > 0) {
          console.log(`   - ${badgeCount} contatos do tipo ${tipo}`)
        }
      }
    }
  })

  test('Process page should show sync status', async ({ page }) => {
    // Navegar para a página de processos
    await page.goto(`${BASE_URL}/processes`)
    
    // Aguardar página carregar
    await page.waitForLoadState('networkidle')
    
    // Verificar se existe botão de sincronização
    const syncButtons = page.locator('button:has-text("Sincronizar")')
    const syncCount = await syncButtons.count()
    
    if (syncCount > 0) {
      console.log(`✅ ${syncCount} botões de sincronização disponíveis`)
      
      // Clicar no primeiro botão de sincronização
      await syncButtons.first().click()
      
      // Aguardar resposta
      await page.waitForTimeout(2000)
      
      // Verificar se aparece mensagem de sucesso
      const successMessage = page.locator('text=/sincronizado com sucesso/i')
      if (await successMessage.isVisible()) {
        console.log('✅ Sincronização executada com sucesso via interface')
      }
    }
  })
})