import { NextRequest, NextResponse } from 'next/server'
import { escavadorService } from '@/lib/services/escavador.service'

/**
 * GET /api/publications/monitor
 * Retorna publicações que precisam de atenção (novas, com prazo, urgentes)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const oab = searchParams.get('oab') || '183619'
    const uf = searchParams.get('uf') || 'MG'

    const result = await escavadorService.monitorarPublicacoes(oab, uf)

    // Análise adicional das publicações urgentes
    const urgentesComAnalise = await Promise.all(
      result.urgentes.map(async (pub) => {
        const analise = await escavadorService.analisarPublicacao(pub)
        return {
          ...pub,
          analise,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        novas: result.novas,
        com_prazo: result.com_prazo,
        urgentes: urgentesComAnalise,
        summary: {
          total_novas: result.novas.length,
          total_com_prazo: result.com_prazo.length,
          total_urgentes: result.urgentes.length,
        },
      },
      monitored_oab: `${oab}/${uf}`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao monitorar publicações:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao monitorar publicações',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/publications/monitor
 * Ativa/desativa monitoramento automático
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { active, oab, uf, interval_minutes = 60 } = body

    // TODO: Implementar sistema de monitoramento com cron job ou similar
    // Por enquanto, apenas retorna o status

    return NextResponse.json({
      success: true,
      data: {
        monitoring_active: active,
        oab: oab || '183619',
        uf: uf || 'MG',
        interval_minutes,
        next_check: new Date(Date.now() + interval_minutes * 60 * 1000).toISOString(),
      },
      message: `Monitoramento ${active ? 'ativado' : 'desativado'} com sucesso`,
    })
  } catch (error) {
    console.error('Erro ao configurar monitoramento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao configurar monitoramento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}