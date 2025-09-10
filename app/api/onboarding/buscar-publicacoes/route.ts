import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { comunicaApiService } from '@/lib/services/comunicaapi.service'

const buscaPublicacoesOnboardingSchema = z.object({
  oab_numero: z.string().min(1, 'Número da OAB é obrigatório'),
  oab_uf: z.string().length(2, 'UF da OAB deve ter 2 caracteres'),
  dias_retrocesso: z.number().int().min(1).max(90).default(30), // padrão 30 dias
})

/**
 * POST /api/onboarding/buscar-publicacoes
 * Buscar publicações automaticamente durante o onboarding
 * Padrão: últimos 30 dias
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Para onboarding, autenticação é opcional (usuário pode estar se cadastrando)
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || 'onboarding-temp'

    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      )
    }

    const validatedData = buscaPublicacoesOnboardingSchema.parse(body)

    // Calcular data de início baseada nos dias de retrocesso
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - validatedData.dias_retrocesso)
    
    const dataFim = new Date()

    // Buscar publicações na Comunica API
    let resultado
    try {
      resultado = await comunicaApiService.buscarPublicacoes({
        oab_numero: validatedData.oab_numero,
        oab_uf: validatedData.oab_uf,
        data_inicio: dataInicio.toISOString().split('T')[0],
        data_fim: dataFim.toISOString().split('T')[0],
        limit: 100,
        offset: 0
      })
    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : 'Erro desconhecido'
      
      console.error('Erro na Comunica API durante onboarding:', errorMessage)
      
      return NextResponse.json({
        error: 'Erro na integração com Comunica API',
        message: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }, { status: 502 })
    }

    // Estatísticas para o onboarding
    const estatisticas: any = {
      total_publicacoes: resultado.comunicacoes.length,
      publicacoes_urgentes: resultado.comunicacoes.filter(p => p.urgente).length,
      tribunais_unicos: [...new Set(resultado.comunicacoes.map(p => p.tribunal))].length,
      processos_unicos: [...new Set(resultado.comunicacoes.map(p => p.numero_processo))].filter(n => n).length,
      periodo_dias: validatedData.dias_retrocesso
    }

    // Salvar publicações no banco se usuário autenticado
    if (user && resultado.comunicacoes.length > 0) {
      const publicacoesParaSalvar = resultado.comunicacoes.map(pub => ({
        id: pub.id,
        numero_processo: pub.numero_processo,
        tribunal: pub.tribunal,
        data_publicacao: pub.data_publicacao,
        conteudo: pub.conteudo,
        tipo_movimento: pub.tipo_movimento,
        destinatarios: pub.destinatarios,
        advogados_mencionados: pub.advogados_mencionados || [],
        prazo_dias: pub.prazo_dias,
        urgente: pub.urgente,
        status: pub.status,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      // Inserir publicações (ignorando duplicatas)
      await supabase
        .from('publicacoes')
        .upsert(publicacoesParaSalvar, { onConflict: 'id' })

      // PROCESSAMENTO AUTOMÁTICO para onboarding
      try {
        const processamentosResults = {
          processos_criados: 0,
          clientes_criados: 0,
          processos_atualizados: 0,
          clientes_atualizados: 0
        }

        // Extrair processos das publicações
        const processosExtraidos = comunicaApiService.extrairProcessos(resultado.comunicacoes)
        
        for (const processo of processosExtraidos) {
          // Verificar se processo já existe
          const { data: processoExistente } = await supabase
            .from('processes')
            .select('id')
            .eq('numero_cnj', processo.numero_cnj)
            .single()

          if (processoExistente) {
            // Atualizar processo existente
            await supabase
              .from('processes')
              .update({
                ultima_movimentacao: processo.ultima_movimentacao,
                status: processo.status,
                updated_at: new Date().toISOString()
              })
              .eq('id', processoExistente.id)
            
            processamentosResults.processos_atualizados++
          } else {
            // Criar novo processo
            await supabase
              .from('processes')
              .insert({
                numero_cnj: processo.numero_cnj,
                numero_processo: processo.numero_processo,
                tribunal: processo.tribunal,
                classe: processo.classe,
                assunto: processo.assunto,
                valor_causa: processo.valor_causa,
                data_distribuicao: processo.data_distribuicao,
                vara: processo.vara,
                partes: processo.partes,
                ultima_movimentacao: processo.ultima_movimentacao,
                status: processo.status,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            
            processamentosResults.processos_criados++
          }
        }

        // Extrair e criar clientes automaticamente
        const clientesExtraidos = comunicaApiService.extrairClientes(processosExtraidos)
        
        for (const cliente of clientesExtraidos) {
          if (!cliente.cpf_cnpj) continue // Pular clientes sem CPF/CNPJ
          
          // Verificar se cliente já existe
          const { data: clienteExistente } = await supabase
            .from('contacts')
            .select('id, processos_relacionados')
            .eq('cpf_cnpj', cliente.cpf_cnpj)
            .single()

          if (clienteExistente) {
            // Atualizar lista de processos relacionados
            const processosUnicos = Array.from(new Set([
              ...(clienteExistente.processos_relacionados || []),
              ...cliente.processos_relacionados
            ]))

            await supabase
              .from('contacts')
              .update({
                processos_relacionados: processosUnicos,
                updated_at: new Date().toISOString()
              })
              .eq('id', clienteExistente.id)
            
            processamentosResults.clientes_atualizados++
          } else {
            // Criar novo cliente
            await supabase
              .from('contacts')
              .insert({
                name: cliente.nome,
                cpf_cnpj: cliente.cpf_cnpj,
                tipo_pessoa: cliente.tipo_pessoa,
                email: cliente.email,
                phone: cliente.telefone,
                endereco: cliente.endereco,
                processos_relacionados: cliente.processos_relacionados,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            
            processamentosResults.clientes_criados++
          }
        }

        // Adicionar resultados do processamento automático à resposta
        estatisticas.processamento_automatico = processamentosResults

      } catch (autoProcessError) {
        console.error('Erro no processamento automático durante onboarding:', autoProcessError)
        // Não falhar o onboarding por causa do processamento automático
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        publicacoes: resultado.comunicacoes,
        estatisticas,
        periodo: {
          data_inicio: dataInicio.toISOString().split('T')[0],
          data_fim: dataFim.toISOString().split('T')[0],
          dias: validatedData.dias_retrocesso
        }
      },
      message: `Onboarding: ${resultado.comunicacoes.length} publicações encontradas dos últimos ${validatedData.dias_retrocesso} dias`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao buscar publicações no onboarding:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
