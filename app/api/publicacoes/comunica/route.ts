import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { comunicaApiService, BuscaPublicacoesParams } from '@/lib/services/comunicaapi.service'
import { z } from 'zod'

const buscaPublicacoesSchema = z.object({
  oab_numero: z.string().min(1, 'Número da OAB é obrigatório'),
  oab_uf: z.string().length(2, 'UF da OAB deve ter 2 caracteres'),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  tribunal: z.string().optional(),
  numero_processo: z.string().optional(),
  tipo_movimento: z.string().optional(),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
})

/**
 * GET /api/publicacoes/comunica
 * Buscar publicações usando a Comunica API do PJE
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Extrair parâmetros da query string
    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    // Converter para objeto com tipos corretos
    const rawParams: any = {}
    for (const [key, value] of searchParams.entries()) {
      if (key === 'limit' || key === 'offset') {
        rawParams[key] = parseInt(value)
      } else {
        rawParams[key] = value
      }
    }

    const validated = buscaPublicacoesSchema.parse(rawParams)
    const validatedParams: BuscaPublicacoesParams = {
      oab_numero: validated.oab_numero,
      oab_uf: validated.oab_uf,
      data_inicio: validated.data_inicio,
      data_fim: validated.data_fim,
      tribunal: validated.tribunal,
      numero_processo: validated.numero_processo,
      tipo_movimento: validated.tipo_movimento,
      limit: validated.limit,
      offset: validated.offset
    }

    // Buscar publicações na Comunica API
    let resultado
    try {
      resultado = await comunicaApiService.buscarPublicacoes(validatedParams)
    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : 'Erro desconhecido'
      
      console.error('Erro na Comunica API:', errorMessage)
      
      return NextResponse.json({
        error: 'Erro na integração com Comunica API',
        message: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }, { status: 502 })
    }

    // Salvar publicações no banco para histórico
    if (resultado.comunicacoes.length > 0) {
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
      const { data: publicacoesInseridas } = await supabase
        .from('publicacoes')
        .upsert(publicacoesParaSalvar, { onConflict: 'id' })
        .select('id')

      // PROCESSAMENTO AUTOMÁTICO - Criar processos e clientes automaticamente
      try {
        const processamentosResults: any = {
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
        (resultado as any).processamento_automatico = processamentosResults

      } catch (autoProcessError) {
        console.error('Erro no processamento automático:', autoProcessError)
        // Não falhar a requisição principal por causa do processamento automático
      }
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      message: `${resultado.comunicacoes.length} publicações encontradas`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao buscar publicações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
