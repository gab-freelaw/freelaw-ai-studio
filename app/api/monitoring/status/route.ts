import { NextRequest, NextResponse } from 'next/server'

// Estado global do monitoramento (em produção seria no banco de dados)
let monitoringState = {
  active: true,
  oab: '183619',
  uf: 'MG',
  interval_minutes: 60,
  last_check: new Date().toISOString(),
  next_check: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  stats: {
    total_processes_monitored: 0,
    total_publications_found: 0,
    publications_today: 0,
    urgent_publications: 0,
  }
}

/**
 * GET /api/monitoring/status
 * Retorna o status atual do monitoramento
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: monitoringState,
      server_time: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao obter status do monitoramento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao obter status do monitoramento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/monitoring/status
 * Atualiza configurações do monitoramento
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Atualiza o estado do monitoramento
    if (body.active !== undefined) {
      monitoringState.active = body.active
    }
    
    if (body.oab) {
      monitoringState.oab = body.oab
    }
    
    if (body.uf) {
      monitoringState.uf = body.uf
    }
    
    if (body.interval_minutes) {
      monitoringState.interval_minutes = body.interval_minutes
      monitoringState.next_check = new Date(
        Date.now() + body.interval_minutes * 60 * 1000
      ).toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações de monitoramento atualizadas',
      data: monitoringState,
    })
  } catch (error) {
    console.error('Erro ao atualizar monitoramento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar monitoramento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/monitoring/status/check
 * Força uma verificação imediata
 */
export async function POST(request: NextRequest) {
  try {
    // Simula uma verificação
    monitoringState.last_check = new Date().toISOString()
    monitoringState.next_check = new Date(
      Date.now() + monitoringState.interval_minutes * 60 * 1000
    ).toISOString()
    
    // Atualiza estatísticas simuladas
    monitoringState.stats.publications_today = Math.floor(Math.random() * 10)
    monitoringState.stats.urgent_publications = Math.floor(Math.random() * 3)

    return NextResponse.json({
      success: true,
      message: 'Verificação executada com sucesso',
      data: {
        checked_at: monitoringState.last_check,
        next_check: monitoringState.next_check,
        found: {
          publications: monitoringState.stats.publications_today,
          urgent: monitoringState.stats.urgent_publications,
        },
      },
    })
  } catch (error) {
    console.error('Erro ao executar verificação:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao executar verificação',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}