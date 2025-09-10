import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { comunicaApiService } from '@/lib/services/comunicaapi.service'

/**
 * GET /api/publicacoes/urgentes
 * Buscar publicações que exigem ação urgente
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar publicações não processadas do usuário
    const { data: publicacoes, error: pubError } = await supabase
      .from('publicacoes')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['nova', 'lida'])
      .order('data_publicacao', { ascending: false })

    if (pubError) {
      console.error('Erro ao buscar publicações:', pubError)
      return NextResponse.json({ error: 'Erro ao buscar publicações' }, { status: 500 })
    }

    if (!publicacoes || publicacoes.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          publicacoes_urgentes: [],
          total: 0,
          resumo: {
            com_prazo: 0,
            sem_prazo: 0,
            vencendo_hoje: 0,
            vencendo_amanha: 0,
            vencendo_semana: 0
          }
        }
      })
    }

    // Converter para formato esperado pelo serviço
    const comunicacoes = publicacoes.map(pub => ({
      id: pub.id,
      numero_processo: pub.numero_processo,
      tribunal: pub.tribunal,
      data_publicacao: pub.data_publicacao,
      conteudo: pub.conteudo,
      tipo_movimento: pub.tipo_movimento,
      destinatarios: pub.destinatarios || [],
      advogados_mencionados: pub.advogados_mencionados || [],
      prazo_dias: pub.prazo_dias,
      urgente: pub.urgente || false,
      status: pub.status || 'nova'
    }))

    // Identificar publicações urgentes
    const publicacoesUrgentes = comunicaApiService.identificarPublicacoesUrgentes(comunicacoes)

    // Calcular resumo de prazos
    const hoje = new Date()
    const amanha = new Date(hoje)
    amanha.setDate(hoje.getDate() + 1)
    const proximaSemana = new Date(hoje)
    proximaSemana.setDate(hoje.getDate() + 7)

    const resumo = {
      com_prazo: 0,
      sem_prazo: 0,
      vencendo_hoje: 0,
      vencendo_amanha: 0,
      vencendo_semana: 0
    }

    publicacoesUrgentes.forEach(pub => {
      if (pub.prazo_dias && pub.prazo_dias > 0) {
        resumo.com_prazo++
        
        const dataVencimento = new Date(pub.data_publicacao)
        dataVencimento.setDate(dataVencimento.getDate() + pub.prazo_dias)
        
        if (dataVencimento <= hoje) {
          resumo.vencendo_hoje++
        } else if (dataVencimento <= amanha) {
          resumo.vencendo_amanha++
        } else if (dataVencimento <= proximaSemana) {
          resumo.vencendo_semana++
        }
      } else {
        resumo.sem_prazo++
      }
    })

    // Ordenar por urgência (prazo mais próximo primeiro)
    publicacoesUrgentes.sort((a, b) => {
      if (a.prazo_dias && b.prazo_dias) {
        return a.prazo_dias - b.prazo_dias
      }
      if (a.prazo_dias && !b.prazo_dias) return -1
      if (!a.prazo_dias && b.prazo_dias) return 1
      return new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime()
    })

    return NextResponse.json({
      success: true,
      data: {
        publicacoes_urgentes: publicacoesUrgentes,
        total: publicacoesUrgentes.length,
        resumo
      },
      message: `${publicacoesUrgentes.length} publicações urgentes encontradas`
    })

  } catch (error) {
    console.error('Erro ao buscar publicações urgentes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/publicacoes/urgentes
 * Marcar publicações urgentes como lidas
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      )
    }

    const { publicacao_ids } = body

    if (!publicacao_ids || !Array.isArray(publicacao_ids)) {
      return NextResponse.json(
        { error: 'IDs de publicações são obrigatórios' },
        { status: 400 }
      )
    }

    // Marcar como lidas
    const { error: updateError } = await supabase
      .from('publicacoes')
      .update({ 
        status: 'lida',
        updated_at: new Date().toISOString()
      })
      .in('id', publicacao_ids)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Erro ao marcar publicações como lidas:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar publicações' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${publicacao_ids.length} publicações marcadas como lidas`
    })

  } catch (error) {
    console.error('Erro ao marcar publicações como lidas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}




