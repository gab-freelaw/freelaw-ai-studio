import { NextRequest, NextResponse } from 'next/server'
import { escavadorService } from '@/lib/services/escavador.service'

/**
 * POST /api/publications/analyze
 * Analisa uma publicação específica e retorna recomendações
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.publicacao) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados da publicação são obrigatórios',
        },
        { status: 400 }
      )
    }

    const analise = await escavadorService.analisarPublicacao(body.publicacao)

    // Enriquece a análise com informações adicionais
    const analiseCompleta = {
      ...analise,
      publicacao_id: body.publicacao.id,
      numero_processo: body.publicacao.numero_processo,
      tipo_publicacao: body.publicacao.tipo,
      dias_restantes: analise.prazo_calculado 
        ? Math.floor((new Date(analise.prazo_calculado).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
      recomendacoes_adicionais: getRecomendacoesAdicionais(body.publicacao.tipo, analise.prioridade),
    }

    return NextResponse.json({
      success: true,
      data: analiseCompleta,
      analyzed_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao analisar publicação:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao analisar publicação',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

function getRecomendacoesAdicionais(tipo: string, prioridade: string): string[] {
  const recomendacoes: string[] = []

  if (prioridade === 'URGENTE') {
    recomendacoes.push('Priorizar esta publicação imediatamente')
    recomendacoes.push('Considerar solicitar prazo adicional se necessário')
  }

  switch (tipo) {
    case 'INTIMACAO':
      recomendacoes.push('Verificar se há documentos anexos')
      recomendacoes.push('Analisar se há necessidade de produção de provas')
      break
    case 'SENTENCA':
      recomendacoes.push('Avaliar o mérito da decisão')
      recomendacoes.push('Verificar se há sucumbência')
      recomendacoes.push('Analisar viabilidade de recurso')
      break
    case 'DECISAO':
      recomendacoes.push('Verificar se é decisão interlocutória')
      recomendacoes.push('Avaliar prejuízo imediato ao cliente')
      break
    case 'DESPACHO':
      recomendacoes.push('Cumprir determinação judicial')
      recomendacoes.push('Verificar se há pedidos pendentes')
      break
    case 'ACORDAO':
      recomendacoes.push('Analisar fundamentação do acórdão')
      recomendacoes.push('Verificar possibilidade de embargos')
      recomendacoes.push('Avaliar cabimento de recursos aos tribunais superiores')
      break
    case 'EDITAL':
      recomendacoes.push('Verificar prazo do edital')
      recomendacoes.push('Avaliar necessidade de resposta')
      break
  }

  return recomendacoes
}