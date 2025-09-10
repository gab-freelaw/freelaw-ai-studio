import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { comunicaApiService } from '@/lib/services/comunicaapi.service'
import { z } from 'zod'

const processarPublicacoesSchema = z.object({
  publicacoes_ids: z.array(z.string()).min(1, 'Pelo menos uma publicação deve ser selecionada'),
  criar_processos: z.boolean().default(true),
  criar_clientes: z.boolean().default(true),
  escritorio_id: z.string().uuid().optional(),
})

/**
 * POST /api/publicacoes/processar
 * Processar publicações para extrair processos e clientes automaticamente
 */
export async function POST(request: NextRequest) {
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

    const validatedData = processarPublicacoesSchema.parse(body)

    // Buscar publicações selecionadas
    const { data: publicacoes, error: pubError } = await supabase
      .from('publicacoes')
      .select('*')
      .in('id', validatedData.publicacoes_ids)
      .eq('user_id', user.id)

    if (pubError) {
      console.error('Erro ao buscar publicações:', pubError)
      return NextResponse.json({ error: 'Erro ao buscar publicações' }, { status: 500 })
    }

    if (!publicacoes || publicacoes.length === 0) {
      return NextResponse.json({ error: 'Nenhuma publicação encontrada' }, { status: 404 })
    }

    const resultados = {
      processos_criados: 0,
      clientes_criados: 0,
      processos_atualizados: 0,
      clientes_atualizados: 0,
      erros: [] as string[]
    }

    // Converter publicações para o formato esperado pelo serviço
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

    // Extrair processos das publicações
    if (validatedData.criar_processos) {
      try {
        const processosExtraidos = comunicaApiService.extrairProcessos(comunicacoes)
        
        for (const processo of processosExtraidos) {
          // Verificar se processo já existe
          const { data: processoExistente } = await supabase
            .from('processes')
            .select('id')
            .eq('numero_cnj', processo.numero_cnj)
            .single()

          if (processoExistente) {
            // Atualizar processo existente
            const { error: updateError } = await supabase
              .from('processes')
              .update({
                ultima_movimentacao: processo.ultima_movimentacao,
                status: processo.status,
                updated_at: new Date().toISOString()
              })
              .eq('id', processoExistente.id)

            if (updateError) {
              resultados.erros.push(`Erro ao atualizar processo ${processo.numero_cnj}: ${updateError.message}`)
            } else {
              resultados.processos_atualizados++
            }
          } else {
            // Criar novo processo
            const { error: insertError } = await supabase
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
                organization_id: validatedData.escritorio_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (insertError) {
              resultados.erros.push(`Erro ao criar processo ${processo.numero_cnj}: ${insertError.message}`)
            } else {
              resultados.processos_criados++
            }
          }
        }

        // Extrair e criar clientes
        if (validatedData.criar_clientes) {
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

              const { error: updateError } = await supabase
                .from('contacts')
                .update({
                  processos_relacionados: processosUnicos,
                  updated_at: new Date().toISOString()
                })
                .eq('id', clienteExistente.id)

              if (updateError) {
                resultados.erros.push(`Erro ao atualizar cliente ${cliente.nome}: ${updateError.message}`)
              } else {
                resultados.clientes_atualizados++
              }
            } else {
              // Criar novo cliente
              const { error: insertError } = await supabase
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
                  organization_id: validatedData.escritorio_id,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })

              if (insertError) {
                resultados.erros.push(`Erro ao criar cliente ${cliente.nome}: ${insertError.message}`)
              } else {
                resultados.clientes_criados++
              }
            }
          }
        }

      } catch (extractError) {
        console.error('Erro ao extrair dados das publicações:', extractError)
        resultados.erros.push(`Erro ao processar publicações: ${extractError}`)
      }
    }

    // Marcar publicações como processadas
    await supabase
      .from('publicacoes')
      .update({ 
        status: 'processada',
        updated_at: new Date().toISOString()
      })
      .in('id', validatedData.publicacoes_ids)

    return NextResponse.json({
      success: true,
      data: resultados,
      message: `Processamento concluído: ${resultados.processos_criados} processos criados, ${resultados.clientes_criados} clientes criados`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao processar publicações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}




