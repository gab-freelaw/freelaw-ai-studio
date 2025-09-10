import { NextRequest, NextResponse } from 'next/server'
import { escavadorService } from '@/lib/services/escavador.service'

/**
 * GET /api/dashboard/stats
 * Retorna estatísticas gerais para o dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const oab = searchParams.get('oab') || '183619'
    const uf = searchParams.get('uf') || 'MG'
    const period = searchParams.get('period') || '7' // dias

    // Calcula datas para o período
    const hoje = new Date()
    const dataInicio = new Date(hoje)
    dataInicio.setDate(hoje.getDate() - parseInt(period))

    // Busca publicações do período
    const publicacoes = await escavadorService.buscarPublicacoes({
      oab,
      uf,
      data_inicio: dataInicio.toISOString().split('T')[0],
      data_fim: hoje.toISOString().split('T')[0],
    })

    // Analisa publicações para obter métricas
    const publicacoesComAnalise = await Promise.all(
      publicacoes.map(async (pub) => {
        const analise = await escavadorService.analisarPublicacao(pub)
        return { ...pub, analise }
      })
    )

    // Calcula estatísticas
    const stats = {
      processos: {
        total: new Set(publicacoes.map(p => p.numero_processo)).size,
        ativos: 0, // TODO: Buscar do banco local
        arquivados: 0, // TODO: Buscar do banco local
        suspensos: 0, // TODO: Buscar do banco local
      },
      publicacoes: {
        total: publicacoes.length,
        periodo: parseInt(period),
        por_tipo: publicacoes.reduce((acc, pub) => {
          acc[pub.tipo] = (acc[pub.tipo] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        urgentes: publicacoesComAnalise.filter(p => p.analise?.prioridade === 'URGENTE').length,
        alta_prioridade: publicacoesComAnalise.filter(p => p.analise?.prioridade === 'ALTA').length,
        com_prazo: publicacoes.filter(p => p.prazo_dias && p.prazo_dias > 0).length,
      },
      prazos: {
        vencendo_hoje: publicacoesComAnalise.filter(p => {
          if (!p.data_limite) return false
          const dataLimite = new Date(p.data_limite)
          return dataLimite.toDateString() === hoje.toDateString()
        }).length,
        proximos_5_dias: publicacoesComAnalise.filter(p => {
          if (!p.data_limite) return false
          const dataLimite = new Date(p.data_limite)
          const diffDays = Math.floor((dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
          return diffDays >= 0 && diffDays <= 5
        }).length,
        vencidos: publicacoesComAnalise.filter(p => {
          if (!p.data_limite) return false
          const dataLimite = new Date(p.data_limite)
          return dataLimite < hoje
        }).length,
      },
      tendencias: {
        media_publicacoes_dia: Math.round(publicacoes.length / parseInt(period)),
        dia_mais_movimentado: getDiaMaisMovimentado(publicacoes),
        tipo_mais_frequente: getTipoMaisFrequente(publicacoes),
      },
      monitoramento: {
        oab: `${oab}/${uf}`,
        ultimo_check: new Date().toISOString(),
        ativo: true, // TODO: Buscar do estado real
      }
    }

    return NextResponse.json({
      success: true,
      data: stats,
      period: {
        start: dataInicio.toISOString().split('T')[0],
        end: hoje.toISOString().split('T')[0],
        days: parseInt(period),
      },
    })
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao obter estatísticas',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

function getDiaMaisMovimentado(publicacoes: any[]): string {
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const contadorDias: Record<number, number> = {}
  
  publicacoes.forEach(pub => {
    const dia = new Date(pub.data_publicacao).getDay()
    contadorDias[dia] = (contadorDias[dia] || 0) + 1
  })

  let maxDia = 0
  let maxCount = 0
  
  Object.entries(contadorDias).forEach(([dia, count]) => {
    if (count > maxCount) {
      maxCount = count
      maxDia = parseInt(dia)
    }
  })

  return diasSemana[maxDia] || 'N/A'
}

function getTipoMaisFrequente(publicacoes: any[]): string {
  const tipos: Record<string, number> = {}
  
  publicacoes.forEach(pub => {
    tipos[pub.tipo] = (tipos[pub.tipo] || 0) + 1
  })

  let maxTipo = ''
  let maxCount = 0
  
  Object.entries(tipos).forEach(([tipo, count]) => {
    if (count > maxCount) {
      maxCount = count
      maxTipo = tipo
    }
  })

  return maxTipo ? maxTipo.charAt(0) + maxTipo.slice(1).toLowerCase().replace('_', ' ') : 'N/A'
}