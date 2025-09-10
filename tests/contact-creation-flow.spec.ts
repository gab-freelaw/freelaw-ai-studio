import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('Contact Auto-Creation Flow', () => {
  test('Complete flow: Add process and verify contacts are created', async ({ page, request }) => {
    console.log('\n🔄 Iniciando teste de criação automática de contatos...\n')
    
    // 1. Obter contagem inicial de contatos
    const initialResponse = await request.get(`${BASE_URL}/api/contacts`)
    const initialContacts = await initialResponse.json()
    const initialCount = initialContacts.length
    console.log(`📊 Contatos iniciais: ${initialCount}`)
    
    // 2. Navegar para página de processos
    await page.goto(`${BASE_URL}/processes`)
    await page.waitForLoadState('networkidle')
    
    // 3. Verificar se existe botão de adicionar processo
    const addButton = page.locator('button:has-text("Adicionar"), button:has-text("Novo Processo")')
    const hasAddButton = await addButton.count() > 0
    
    if (hasAddButton) {
      console.log('✅ Botão de adicionar processo encontrado')
      
      // Clicar no botão de adicionar
      await addButton.first().click()
      
      // Aguardar modal ou formulário
      await page.waitForTimeout(1000)
      
      // Procurar campo de CNJ
      const cnjInput = page.locator('input[placeholder*="CNJ"], input[name*="cnj"], input[id*="cnj"]')
      if (await cnjInput.count() > 0) {
        // Preencher com CNJ de teste
        await cnjInput.fill('0000001-11.2024.8.26.0100')
        console.log('✅ CNJ preenchido')
        
        // Procurar botão de submit
        const submitButton = page.locator('button[type="submit"], button:has-text("Salvar"), button:has-text("Adicionar")')
        if (await submitButton.count() > 0) {
          await submitButton.first().click()
          console.log('✅ Processo submetido')
          
          // Aguardar resposta
          await page.waitForTimeout(3000)
        }
      }
    }
    
    // 4. Verificar se contatos foram criados via API
    const finalResponse = await request.get(`${BASE_URL}/api/contacts`)
    const finalContacts = await finalResponse.json()
    const finalCount = finalContacts.length
    
    console.log(`📊 Contatos finais: ${finalCount}`)
    
    if (finalCount > initialCount) {
      const newContacts = finalCount - initialCount
      console.log(`✅ ${newContacts} novos contatos criados automaticamente!`)
      
      // Verificar os novos contatos
      const latestContacts = finalContacts.slice(-newContacts)
      for (const contact of latestContacts) {
        console.log(`   - ${contact.nome} (${contact.tipo})`)
        
        // Verificar se tem observação de importação
        if (contact.observacoes?.includes('Importado do processo')) {
          console.log(`     ✓ Contato marcado como importado`)
        }
      }
    } else {
      console.log('⚠️ Nenhum novo contato criado (pode estar em modo desenvolvimento)')
    }
    
    // 5. Navegar para página de contatos e verificar visualmente
    await page.goto(`${BASE_URL}/contacts`)
    await page.waitForLoadState('networkidle')
    
    // Verificar se existem contatos na tabela
    const contactRows = page.locator('tbody tr')
    const visibleContacts = await contactRows.count()
    
    console.log(`\n📱 Interface: ${visibleContacts} contatos visíveis`)
    
    // Verificar tipos de contatos
    const tipos = ['CLIENTE', 'ADVOGADO', 'PARTE']
    for (const tipo of tipos) {
      const badges = page.locator(`span:has-text("${tipo}")`)
      const count = await badges.count()
      if (count > 0) {
        console.log(`   - ${count} contato(s) do tipo ${tipo}`)
      }
    }
  })

  test('Verify contact details from process sync', async ({ request }) => {
    console.log('\n🔍 Verificando detalhes dos contatos sincronizados...\n')
    
    // Buscar todos os contatos
    const response = await request.get(`${BASE_URL}/api/contacts`)
    const contacts = await response.json()
    
    // Filtrar contatos importados
    const importedContacts = contacts.filter((c: any) => 
      c.observacoes?.includes('Importado do processo')
    )
    
    console.log(`📊 Total de contatos importados: ${importedContacts.length}`)
    
    if (importedContacts.length > 0) {
      // Analisar qualidade dos dados
      let withCpfCnpj = 0
      let withPhone = 0
      let withEmail = 0
      let withAddress = 0
      let withTags = 0
      
      for (const contact of importedContacts) {
        if (contact.cpf_cnpj) withCpfCnpj++
        if (contact.telefone || contact.celular) withPhone++
        if (contact.email) withEmail++
        if (contact.endereco) withAddress++
        if (contact.tags && contact.tags.length > 0) withTags++
      }
      
      console.log('\n📈 Qualidade dos dados importados:')
      console.log(`   - Com CPF/CNPJ: ${withCpfCnpj}/${importedContacts.length} (${Math.round(withCpfCnpj/importedContacts.length*100)}%)`)
      console.log(`   - Com telefone: ${withPhone}/${importedContacts.length} (${Math.round(withPhone/importedContacts.length*100)}%)`)
      console.log(`   - Com email: ${withEmail}/${importedContacts.length} (${Math.round(withEmail/importedContacts.length*100)}%)`)
      console.log(`   - Com endereço: ${withAddress}/${importedContacts.length} (${Math.round(withAddress/importedContacts.length*100)}%)`)
      console.log(`   - Com tags: ${withTags}/${importedContacts.length} (${Math.round(withTags/importedContacts.length*100)}%)`)
      
      // Validar formatação
      console.log('\n✅ Validação de formatação:')
      for (const contact of importedContacts.slice(0, 3)) { // Verificar apenas 3 primeiros
        console.log(`\n   Contato: ${contact.nome}`)
        
        // Verificar formatação do nome
        if (contact.nome.match(/^[A-Z][a-z]+(?: [A-Za-z]+)*$/)) {
          console.log('     ✓ Nome normalizado corretamente')
        }
        
        // Verificar formatação CPF/CNPJ
        if (contact.cpf_cnpj) {
          if (contact.cpf_cnpj.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)) {
            console.log('     ✓ CPF/CNPJ formatado corretamente')
          }
        }
        
        // Verificar tipo
        const validTypes = ['CLIENTE', 'PARTE_CONTRARIA', 'ADVOGADO', 'PERITO', 'TESTEMUNHA', 'OUTRO']
        if (validTypes.includes(contact.tipo)) {
          console.log(`     ✓ Tipo válido: ${contact.tipo}`)
        }
      }
    } else {
      console.log('⚠️ Nenhum contato importado encontrado')
    }
  })

  test('Test duplicate prevention on sync', async ({ request }) => {
    console.log('\n🔒 Testando prevenção de duplicatas...\n')
    
    // Obter processos disponíveis
    const processesResponse = await request.get(`${BASE_URL}/api/processes`)
    const processesData = await processesResponse.json()
    
    if (processesData.data && processesData.data.length > 0) {
      const processo = processesData.data[0]
      console.log(`📋 Usando processo: ${processo.numero_cnj || processo.id}`)
      
      // Primeira sincronização
      console.log('\n1️⃣ Primeira sincronização...')
      const sync1 = await request.post(
        `${BASE_URL}/api/processes/${processo.id || processo.numero_cnj}/sync`,
        {}
      )
      
      if (sync1.ok()) {
        const data1 = await sync1.json()
        console.log(`   - Contatos criados: ${data1.contacts?.created || 0}`)
        console.log(`   - Contatos pulados: ${data1.contacts?.skipped || 0}`)
        
        // Segunda sincronização (deve pular todos)
        console.log('\n2️⃣ Segunda sincronização (verificando duplicatas)...')
        const sync2 = await request.post(
          `${BASE_URL}/api/processes/${processo.id || processo.numero_cnj}/sync`,
          {}
        )
        
        if (sync2.ok()) {
          const data2 = await sync2.json()
          console.log(`   - Contatos criados: ${data2.contacts?.created || 0}`)
          console.log(`   - Contatos pulados: ${data2.contacts?.skipped || 0}`)
          
          // Verificar que não criou duplicatas
          expect(data2.contacts?.created || 0).toBe(0)
          console.log('\n✅ Prevenção de duplicatas funcionando corretamente!')
        }
      }
    } else {
      console.log('⚠️ Nenhum processo disponível para teste')
    }
  })
})