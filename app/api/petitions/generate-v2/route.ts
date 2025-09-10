import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const generateSchema = z.object({
  processId: z.string(),
  petitionType: z.enum(['initial', 'response', 'appeal', 'motion']),
  content: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  customInstructions: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }
    
    const data = generateSchema.parse(body)
    
    // Simular geração de petição v2 para testes
    const petition = {
      id: 'petition-v2-' + Date.now(),
      processId: data.processId,
      type: data.petitionType,
      content: `EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO

Nos autos do processo ${data.processId}, vem respeitosamente o requerente expor e requerer:

DOS FATOS:

[Petição gerada automaticamente pela IA v2]

${data.content || 'Conteúdo da petição baseado nos dados do processo e instruções fornecidas.'}

DO DIREITO:

Aplicam-se ao caso os dispositivos legais pertinentes conforme análise jurídica automatizada.

DOS PEDIDOS:

Diante do exposto, requer:
- Deferimento do pedido principal
- Concessão dos benefícios requeridos

Nestes termos, pede deferimento.

Local, ${new Date().toLocaleDateString()}

_____________________
Advogado(a) OAB/XX XXXXX`,
      urgency: data.urgency,
      customInstructions: data.customInstructions,
      generatedAt: new Date().toISOString(),
      version: '2.0',
      aiModel: 'claude-opus-4',
      estimatedWords: 450,
      estimatedPages: 2
    }
    
    return NextResponse.json({
      message: 'Petição v2 gerada com sucesso',
      petition
    }, { status: 200 })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
