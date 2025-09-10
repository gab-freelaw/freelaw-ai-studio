import { NextRequest, NextResponse } from 'next/server'
import { escavadorService } from '@/lib/services/escavador.service'

interface Params {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/processes/[id]
 * Busca um processo específico pelo ID
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const processo = await escavadorService.buscarProcessoPorId(id)

    return NextResponse.json({
      success: true,
      data: processo,
    })
  } catch (error) {
    console.error('Erro ao buscar processo:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar processo',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/processes/[id]
 * Atualiza informações de um processo
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // TODO: Implementar atualização no banco de dados local
    // Por enquanto, apenas retorna sucesso simulado
    
    return NextResponse.json({
      success: true,
      message: 'Processo atualizado com sucesso',
      data: {
        id,
        ...body,
      },
    })
  } catch (error) {
    console.error('Erro ao atualizar processo:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar processo',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/processes/[id]
 * Remove um processo do tracking (não remove do Escavador)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    // TODO: Implementar remoção do banco de dados local
    
    return NextResponse.json({
      success: true,
      message: 'Processo removido do tracking com sucesso',
    })
  } catch (error) {
    console.error('Erro ao remover processo:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao remover processo',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}