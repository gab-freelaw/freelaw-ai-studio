import { NextRequest, NextResponse } from 'next/server'
import { escavadorService } from '@/lib/services/escavador.service'

/**
 * GET /api/processes
 * Lista processos com filtros opcionais
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params = {
      numero_cnj: searchParams.get('numero_cnj') || undefined,
      numero_processo: searchParams.get('numero_processo') || undefined,
      cpf_cnpj: searchParams.get('cpf_cnpj') || undefined,
      nome_parte: searchParams.get('nome_parte') || undefined,
      tribunal: searchParams.get('tribunal') || undefined,
      incluir_movimentacoes: searchParams.get('incluir_movimentacoes') === 'true',
    }

    // Remove undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined)
    )

    const processos = await escavadorService.buscarProcessos(cleanParams)

    return NextResponse.json({
      success: true,
      data: processos,
      total: processos.length,
    })
  } catch (error) {
    console.error('Erro ao buscar processos:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar processos',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/processes
 * Cria um novo processo (para tracking interno)
 * e automaticamente cria os contatos das partes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contactSyncService } = await import('@/lib/services/contact-sync.service')
    
    // Validação básica
    if (!body.numero_cnj || !escavadorService.validarNumeroCNJ(body.numero_cnj)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Número CNJ inválido',
        },
        { status: 400 }
      )
    }

    // Busca o processo no Escavador para obter dados atualizados
    const processos = await escavadorService.buscarProcessos({
      numero_cnj: body.numero_cnj,
      incluir_movimentacoes: true,
    })

    if (processos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Processo não encontrado na base do Escavador',
        },
        { status: 404 }
      )
    }

    const processo = processos[0]
    
    // Buscar contatos existentes
    const contactsResponse = await fetch(`${request.nextUrl.origin}/api/contacts`)
    const contactsData = await contactsResponse.json()
    const existingContacts = contactsData || []
    
    // Sincronizar contatos do processo
    const syncResult = await contactSyncService.syncContactsFromProcess(
      processo,
      existingContacts
    )
    
    // Criar contatos novos
    const createdContacts = []
    for (const contactData of syncResult.created) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contactData)
        })
        
        if (response.ok) {
          const created = await response.json()
          createdContacts.push(created)
        }
      } catch (error) {
        console.error('Erro ao criar contato:', error)
      }
    }
    
    // TODO: Salvar processo no banco de dados local
    
    return NextResponse.json({
      success: true,
      data: processo,
      message: 'Processo adicionado com sucesso',
      contacts: {
        created: createdContacts.length,
        skipped: syncResult.skipped.length,
        total: createdContacts.length + syncResult.skipped.length,
        details: {
          created: createdContacts,
          skipped: syncResult.skipped
        }
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar processo:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar processo',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}