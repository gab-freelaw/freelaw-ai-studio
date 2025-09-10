import { NextRequest, NextResponse } from 'next/server'
import { escavadorService } from '@/lib/services/escavador.service'

/**
 * GET /api/publications
 * Lista publicações com filtros
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params = {
      data_inicio: searchParams.get('data_inicio') || undefined,
      data_fim: searchParams.get('data_fim') || undefined,
      numero_processo: searchParams.get('numero_processo') || undefined,
      oab: searchParams.get('oab') || undefined,
      uf: searchParams.get('uf') || undefined,
      tipo: searchParams.get('tipo') || undefined,
      tribunal: searchParams.get('tribunal') || undefined,
    }

    // Remove undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined)
    )

    const publicacoes = await escavadorService.buscarPublicacoes(cleanParams)

    // Analisa cada publicação para adicionar recomendações
    const publicacoesComAnalise = await Promise.all(
      publicacoes.map(async (pub) => {
        const analise = await escavadorService.analisarPublicacao(pub)
        return {
          ...pub,
          analise,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: publicacoesComAnalise,
      total: publicacoesComAnalise.length,
      filters: cleanParams,
    })
  } catch (error) {
    console.error('Erro ao buscar publicações:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar publicações',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/publications
 * Marca uma publicação como lida/respondida
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.publicacao_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID da publicação é obrigatório',
        },
        { status: 400 }
      )
    }

    // TODO: Salvar no banco de dados local
    const action = body.action || 'mark_as_read'
    
    return NextResponse.json({
      success: true,
      message: `Publicação ${action === 'mark_as_read' ? 'marcada como lida' : 'atualizada'}`,
      data: {
        publicacao_id: body.publicacao_id,
        action,
        timestamp: new Date().toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao processar publicação:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar publicação',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}