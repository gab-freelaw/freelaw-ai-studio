import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// import { generateDemonstracaoPeca } from '@/lib/services/mock-legal-data.service'
import { DocumentStyleAnalysis } from '@/lib/services/office-style.service'

interface GenerateDemoRequest {
  tipo: 'resumo' | 'ia' | 'especialista'
  processo?: {
    numero_cnj: string
    titulo: string
    cliente?: string
    valor_causa?: number
    status?: string
    ultima_movimentacao?: string
  }
  analysis?: DocumentStyleAnalysis
  officeId: string
}

/**
 * Aplica o estilo analisado ao conteúdo gerado
 */
function applyStyleToContent(content: string, analysis?: DocumentStyleAnalysis): string {
  if (!analysis) return content
  
  // Aplicar frases e termos comuns do escritório
  let styledContent = content
  
  if (analysis.language.commonPhrases?.length > 0) {
    // Adicionar algumas frases características no início ou fim
    const introPhrase = analysis.language.commonPhrases[0]
    const closingPhrase = analysis.language.commonPhrases[analysis.language.commonPhrases.length - 1]
    
    if (!styledContent.includes(introPhrase)) {
      styledContent = styledContent.replace(
        'EXCELENTÍSSIMO',
        `${introPhrase}\n\nEXCELENTÍSSIMO`
      )
    }
    
    if (!styledContent.includes(closingPhrase) && closingPhrase.toLowerCase().includes('defer')) {
      styledContent = styledContent.replace(
        'Pede deferimento.',
        closingPhrase
      )
    }
  }
  
  // Ajustar formalidade
  if (analysis.language.formality > 80) {
    // Tornar mais formal
    styledContent = styledContent
      .replace(/você/gi, 'Vossa Excelência')
      .replace(/precisa/gi, 'faz-se necessário')
      .replace(/deve/gi, 'há de')
  }
  
  // Aplicar termos preferidos
  if (analysis.language.preferredTerms?.length > 0) {
    analysis.language.preferredTerms.forEach(term => {
      // Adicionar termos técnicos preferidos onde apropriado
      if (term.toLowerCase().includes('data venia') && !styledContent.includes('data venia')) {
        styledContent = styledContent.replace(
          'Com o devido respeito',
          'Data venia'
        )
      }
    })
  }
  
  return styledContent
}

/**
 * Gera conteúdo de resumo inteligente baseado no processo
 */
function generateSmartSummary(processo: any, analysis?: DocumentStyleAnalysis): string {
  const formality = analysis?.language.formality || 70
  const technicality = analysis?.language.technicality || 75
  
  let summary = `## Análise do Processo ${processo.numero_cnj}\n\n`
  
  // Adicionar saudação apropriada ao nível de formalidade
  if (formality > 80) {
    summary += `### Síntese Jurídica\n\n`
  } else {
    summary += `### Resumo Executivo\n\n`
  }
  
  summary += `**Natureza da Demanda:** ${processo.titulo}\n`
  
  if (processo.cliente) {
    summary += `**${formality > 70 ? 'Parte Representada' : 'Cliente'}:** ${processo.cliente}\n`
  }
  
  if (processo.valor_causa) {
    summary += `**Valor da Causa:** R$ ${processo.valor_causa.toLocaleString('pt-BR')}\n`
  }
  
  summary += `**Status Processual:** ${processo.status || 'Em andamento'}\n\n`
  
  // Análise técnica baseada no nível de tecnicidade
  if (technicality > 70) {
    summary += `### Análise Jurídica\n\n`
    summary += `Considerando os elementos fáticos e jurídicos apresentados, verifica-se que:\n\n`
    summary += `1. **Fundamentos Legais:** A presente demanda encontra amparo nos dispositivos legais pertinentes à matéria.\n`
    summary += `2. **Precedentes Jurisprudenciais:** Há jurisprudência consolidada favorável à tese defendida.\n`
    summary += `3. **Estratégia Processual:** Recomenda-se a adoção de medidas cautelares para assegurar o resultado útil do processo.\n\n`
  } else {
    summary += `### Pontos Importantes\n\n`
    summary += `1. O processo está em fase inicial e requer acompanhamento.\n`
    summary += `2. Existem boas chances de êxito com a estratégia adotada.\n`
    summary += `3. É importante manter a documentação atualizada.\n\n`
  }
  
  // Movimentação e recomendações
  if (processo.ultima_movimentacao) {
    summary += `### Última Movimentação\n`
    summary += `${processo.ultima_movimentacao}\n\n`
  }
  
  summary += `### Recomendações e Próximos Passos\n\n`
  
  if (formality > 70) {
    summary += `Diante do exposto, sugere-se:\n\n`
    summary += `1. **Diligência Probatória:** Providenciar a juntada de documentação complementar.\n`
    summary += `2. **Acompanhamento Processual:** Monitorar diariamente as publicações oficiais.\n`
    summary += `3. **Preparação Estratégica:** Elaborar teses subsidiárias para eventual recurso.\n`
    summary += `4. **Comunicação com o Cliente:** Manter a parte informada sobre o andamento processual.\n`
  } else {
    summary += `1. Reunir documentos adicionais que possam fortalecer o caso.\n`
    summary += `2. Acompanhar o processo diariamente para não perder prazos.\n`
    summary += `3. Preparar argumentos alternativos caso seja necessário.\n`
    summary += `4. Manter o cliente informado sobre os desenvolvimentos.\n`
  }
  
  // Adicionar elementos de estilo identificados
  if (analysis?.language.commonPhrases && analysis.language.commonPhrases.length > 0) {
    summary += `\n\n---\n`
    summary += `*${analysis.language.commonPhrases[Math.floor(Math.random() * analysis.language.commonPhrases.length)]}*`
  }
  
  return summary
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar se há body
    let body: GenerateDemoRequest
    try {
      body = await request.json()
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }
    
    const { tipo, processo, analysis, officeId } = body
    
    let content = ''
    
    switch (tipo) {
      case 'resumo':
        if (processo) {
          // Gerar resumo inteligente com recomendações
          content = generateSmartSummary(processo, analysis)
        } else {
          content = `**RESUMO INTELIGENTE**

Este é um exemplo de resumo gerado por IA que analisaria os documentos e extrairia os pontos principais automaticamente.

**Principais informações:**
- Tipo: Documento genérico
- Data: ${new Date().toLocaleDateString()}
- Status: Demonstração

*Esta é uma demonstração. Na versão final, nossa IA analisaria os documentos reais e geraria um resumo personalizado baseado no estilo do seu escritório.*`
        }
        break
        
      case 'ia':
        // Gerar peça com IA aplicando o estilo
        const basePeca = `**PETIÇÃO INICIAL GERADA POR IA**

EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO

REQUERENTE, brasileiro(a), civilmente capaz, vem, respeitosamente, à presença de Vossa Excelência, por meio de seu advogado que esta subscreve, propor a presente

**AÇÃO DEMONSTRATIVA**

em face de REQUERIDO, pelas razões de fato e de direito a seguir expostas:

DOS FATOS

*Esta é uma demonstração de como nossa IA geraria uma petição aplicando o estilo único do seu escritório. A versão final seria totalmente personalizada com base nos seus padrões.*

DO DIREITO

*Seção legal seria gerada automaticamente baseada na jurisprudência mais recente.*

DOS PEDIDOS

Diante do exposto, requer-se a Vossa Excelência:

a) A procedência do pedido;
b) A condenação do réu ao pagamento das custas processuais e honorários advocatícios.

Nestes termos, pede deferimento.

Local, Data

Advogado(a)
OAB/UF XXXXX`
        content = applyStyleToContent(basePeca, analysis)
        break
        
      case 'especialista':
        // Para o plano premium, simular peça elaborada por especialista
        content = `## Peça Elaborada por Especialista Sênior\n\n`
        content += `**[RECURSO PREMIUM]**\n\n`
        content += `Esta funcionalidade permite que advogados especialistas do nosso time elaborem peças processuais personalizadas com:\n\n`
        content += `• Análise aprofundada da jurisprudência mais recente\n`
        content += `• Argumentação técnica avançada\n`
        content += `• Revisão por especialista na área\n`
        content += `• Garantia de qualidade e conformidade\n`
        content += `• Prazo de entrega em até 24h\n\n`
        content += `Para acessar este recurso, faça upgrade para o plano Premium.`
        break
        
      default:
        content = 'Tipo de demonstração não reconhecido'
    }
    
    // Salvar a demonstração no banco para análise futura
    if (officeId && tipo !== 'especialista') {
      await supabase
        .from('office_demos')
        .insert({
          office_id: officeId,
          demo_type: tipo,
          content: content,
          has_style_applied: !!analysis,
          processo_cnj: processo?.numero_cnj
        })
    }
    
    return NextResponse.json({ 
      content,
      styled: !!analysis,
      type: tipo
    })
    
  } catch (error) {
    console.error('Erro ao gerar demonstração:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar demonstração' },
      { status: 500 }
    )
  }
}