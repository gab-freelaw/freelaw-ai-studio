import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { AI_MODELS, TaskType, TaskPriority } from '@/lib/config/ai-models';
import { ModelSelectionService } from '@/lib/services/model-selection';
import { LegalDraftingService, LegalDocument } from '@/lib/services/legal-drafting';

export const maxDuration = 60; // Petições podem demorar mais

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Aceitar dados diretamente ou em formData
    const isDirectData = body.area || body.parties || body.facts;
    const formData = isDirectData ? body : (body.formData || {});
    
    const { 
      templateId = body.type,
      useStream = true,
      style = body.style || 'formal'
    } = body;

    // Mapear tipo de template para tipo de documento
    const documentTypeMap: Record<string, LegalDocument['type']> = {
      'peticao-inicial': 'peticao_inicial',
      'contestacao': 'contestacao',
      'recurso-apelacao': 'recurso',
      'agravo-instrumento': 'recurso',
      'mandado-seguranca': 'peticao_inicial',
      'embargos-declaracao': 'recurso'
    };

    const documentType = documentTypeMap[templateId] || 'peticao_inicial';

    // Selecionar o melhor modelo para redação jurídica
    const recommendation = ModelSelectionService.selectModel(
      TaskType.LEGAL_DRAFTING,
      TaskPriority.QUALITY_FIRST,
      5000 // Estimativa de tokens para uma petição
    );

    console.log(`Selected model for legal drafting: ${recommendation.primary}`);
    console.log(`Reasoning: ${recommendation.reasoning}`);

    // Preparar documento para o serviço
    const legalDoc: LegalDocument = {
      type: documentType,
      area: formData.area || 'Cível',
      parties: formData.parties || {
        author: formData.autor || formData.author || 'Autor não especificado',
        defendant: formData.reu || formData.defendant
      },
      facts: formData.facts || (formData.fatos ? [formData.fatos] : []),
      legalBasis: formData.legalBasis || (formData.fundamentacao ? [formData.fundamentacao] : []),
      requests: formData.requests || (formData.pedidos ? [formData.pedidos] : []),
      urgency: formData.urgency || formData.urgencia || 'media'
    };

    // Construir prompt especializado
    const systemPrompt = `Você é um advogado brasileiro experiente, especializado em redação de peças processuais.
    
INSTRUÇÕES IMPORTANTES:
- Use Claude Opus 4.1 para máxima qualidade na redação jurídica
- Siga rigorosamente as normas do CPC e NCPC
- Use linguagem técnica e formal apropriada
- Cite artigos de lei, súmulas e jurisprudência quando aplicável
- Estruture a peça de forma clara e lógica
- Seja persuasivo mas sempre respeitoso
- Mantenha coerência argumentativa
- Respeite prazos e competências

ESTILO: ${style === 'formal' ? 'Formal e tradicional' : style === 'moderado' ? 'Formal mas acessível' : 'Objetivo e direto'}`;

    const userPrompt = await LegalDraftingService.draftLegalDocument(legalDoc, style as any);

    // Verificar chaves de API - Usar modelo estável
    const selectedModel = AI_MODELS.ANTHROPIC.SONNET_35; // Claude 3.5 Sonnet
    const isOpenAI = selectedModel.startsWith('gpt') || selectedModel.startsWith('o1');
    const isClaude = selectedModel.startsWith('claude');
    
    if (isOpenAI && !process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    if (isClaude && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    // Selecionar provider
    const provider = isClaude ? anthropic : openai;

    // Preparar mensagens
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      {
        role: 'user' as const,
        content: userPrompt
      }
    ];

    if (useStream) {
      // Streaming para feedback em tempo real
      const result = streamText({
        model: provider(selectedModel),
        messages,
        temperature: 0.2, // Baixa temperatura para consistência jurídica
      });

      return result.toTextStreamResponse();
    } else {
      // Geração completa
      const result = await generateText({
        model: provider(selectedModel),
        messages,
        temperature: 0.2,
      });

      return new Response(
        JSON.stringify({ 
          petition: result.text,
          model: selectedModel,
          cost: recommendation.estimatedCost
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Petition generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar petição' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}