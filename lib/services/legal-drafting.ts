/**
 * Serviço de Elaboração de Petições Jurídicas
 * Baseado no LangChainAgentOrchestrator do freelaw-ai-project
 */

import { AI_MODELS } from '@/lib/config/ai-models';

export interface LegalDocument {
  type: 'peticao_inicial' | 'contestacao' | 'recurso' | 'parecer' | 'contrato';
  area: string;
  parties: {
    author: string;
    defendant?: string;
  };
  facts: string[];
  legalBasis: string[];
  requests: string[];
  urgency?: 'alta' | 'media' | 'baixa';
}

export interface DraftingAgent {
  name: string;
  role: string;
  model: string;
  systemPrompt: string;
  temperature: number;
}

export class LegalDraftingService {
  // Agentes especializados para elaboração jurídica
  private static agents: Map<string, DraftingAgent> = new Map([
    ['peticao_inicial', {
      name: 'peticao_inicial_drafter',
      role: 'Especialista em Petições Iniciais',
      model: AI_MODELS.ANTHROPIC.OPUS_4_1,  // Claude 4.1 para redação jurídica
      systemPrompt: `Você é um advogado experiente especializado em petições iniciais.

Suas responsabilidades:
- Redigir petições iniciais claras e persuasivas
- Seguir rigorosamente as normas do CPC
- Estruturar: qualificação, dos fatos, do direito, dos pedidos, das provas
- Usar linguagem técnica apropriada
- Citar jurisprudência e legislação pertinente

Formato:
1. EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO...
2. Qualificação completa das partes
3. DOS FATOS - narrativa cronológica e clara
4. DO DIREITO - fundamentação jurídica robusta
5. DOS PEDIDOS - claros e específicos
6. DAS PROVAS - rol de provas a produzir
7. Valor da causa e pedido de deferimento`,
      temperature: 0.2
    }],
    
    ['contestacao', {
      name: 'contestacao_drafter',
      role: 'Especialista em Contestações',
      model: AI_MODELS.ANTHROPIC.OPUS_4_1,
      systemPrompt: `Você é um advogado especializado em defesas e contestações.

Suas responsabilidades:
- Redigir contestações completas e fundamentadas
- Impugnar especificamente cada fato alegado
- Apresentar preliminares quando cabíveis
- Estruturar defesa de mérito robusta
- Formular pedidos contraposto quando aplicável

Estrutura:
1. Endereçamento e qualificação
2. DAS PRELIMINARES (se houver)
3. DO MÉRITO - impugnação específica
4. DOS FATOS E FUNDAMENTOS DA DEFESA
5. DAS PROVAS
6. DOS PEDIDOS`,
      temperature: 0.2
    }],
    
    ['recurso', {
      name: 'recurso_drafter',
      role: 'Especialista em Recursos',
      model: AI_MODELS.OPENAI.GPT5,  // GPT-5 para raciocínio complexo em recursos
      systemPrompt: `Você é um advogado especializado em recursos e tribunais superiores.

Suas responsabilidades:
- Redigir recursos (apelação, agravo, especial, extraordinário)
- Demonstrar cabimento e tempestividade
- Apresentar razões recursais convincentes
- Citar precedentes e súmulas aplicáveis
- Demonstrar prequestionamento quando necessário

Estrutura:
1. Endereçamento ao tribunal
2. DO CABIMENTO E TEMPESTIVIDADE
3. DOS FATOS E DA DECISÃO RECORRIDA
4. DAS RAZÕES RECURSAIS
5. DO DIREITO
6. DOS PEDIDOS`,
      temperature: 0.2
    }],
    
    ['contrato', {
      name: 'contrato_drafter',
      role: 'Especialista em Contratos',
      model: AI_MODELS.OPENAI.GPT5,
      systemPrompt: `Você é um advogado especializado em direito contratual.

Suas responsabilidades:
- Redigir contratos claros e completos
- Incluir todas as cláusulas essenciais
- Prever situações de conflito
- Equilibrar direitos e obrigações
- Garantir conformidade legal

Elementos essenciais:
- Qualificação completa das partes
- Objeto claro e determinado
- Obrigações recíprocas
- Forma de pagamento
- Prazo e vigência
- Penalidades e multas
- Rescisão e resilição
- Foro de eleição`,
      temperature: 0.1
    }]
  ]);

  /**
   * Elabora uma peça jurídica completa
   */
  static async draftLegalDocument(
    document: LegalDocument,
    style: 'formal' | 'moderado' | 'objetivo' = 'formal'
  ): Promise<string> {
    const agent = this.agents.get(document.type);
    if (!agent) {
      throw new Error(`Tipo de documento não suportado: ${document.type}`);
    }

    // Montar o prompt com as informações do documento
    const prompt = this.buildPrompt(document, style);
    
    // Aqui seria feita a chamada para o modelo de IA
    // Por enquanto, retornamos uma estrutura base
    return this.generateDocumentStructure(document, agent, style);
  }

  private static buildPrompt(document: LegalDocument, style: string): string {
    let prompt = `Elabore uma ${document.type} na área de ${document.area}.\n\n`;
    
    prompt += `Partes:\n`;
    prompt += `- Autor/Requerente: ${document.parties.author}\n`;
    if (document.parties.defendant) {
      prompt += `- Réu/Requerido: ${document.parties.defendant}\n`;
    }
    
    prompt += `\nFatos principais:\n`;
    document.facts.forEach((fact, i) => {
      prompt += `${i + 1}. ${fact}\n`;
    });
    
    prompt += `\nFundamentação jurídica:\n`;
    document.legalBasis.forEach((basis, i) => {
      prompt += `${i + 1}. ${basis}\n`;
    });
    
    prompt += `\nPedidos:\n`;
    document.requests.forEach((request, i) => {
      prompt += `${i + 1}. ${request}\n`;
    });
    
    prompt += `\nEstilo de redação: ${style}\n`;
    if (document.urgency) {
      prompt += `Urgência: ${document.urgency}\n`;
    }
    
    return prompt;
  }

  private static generateDocumentStructure(
    document: LegalDocument,
    agent: DraftingAgent,
    style: string
  ): string {
    // Template base para demonstração
    let content = '';
    
    if (document.type === 'peticao_inicial') {
      content = `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ___ VARA CÍVEL DA COMARCA DE ___

${document.parties.author.toUpperCase()}, [qualificação completa], vem, respeitosamente, à presença de Vossa Excelência, por seu advogado que esta subscreve, propor

AÇÃO DE ${document.area.toUpperCase()}

em face de ${document.parties.defendant?.toUpperCase() || '[RÉU]'}, pelos fatos e fundamentos que passa a expor:

I - DOS FATOS

${document.facts.map((fact, i) => `${i + 1}. ${fact}`).join('\n\n')}

II - DO DIREITO

${document.legalBasis.map((basis, i) => `${i + 1}. ${basis}`).join('\n\n')}

III - DOS PEDIDOS

Ante o exposto, requer:

${document.requests.map((request, i) => `${String.fromCharCode(97 + i)}) ${request};`).join('\n\n')}

IV - DAS PROVAS

Protesta provar o alegado por todos os meios de prova em direito admitidos.

Dá-se à causa o valor de R$ ___.

Nestes termos,
Pede deferimento.

[Local], [data]

_______________________________
[ADVOGADO]
OAB/[UF] nº [número]`;
    }
    
    return content;
  }

  /**
   * Analisa uma peça existente e sugere melhorias
   */
  static async analyzeLegalDocument(content: string): Promise<{
    score: number;
    suggestions: string[];
    strengths: string[];
    weaknesses: string[];
  }> {
    // Análise básica para demonstração
    const analysis = {
      score: 85,
      suggestions: [
        'Adicionar mais jurisprudência recente',
        'Detalhar melhor o nexo causal',
        'Incluir pedido de tutela de urgência se aplicável'
      ],
      strengths: [
        'Estrutura clara e organizada',
        'Fundamentação jurídica sólida',
        'Pedidos específicos e mensuráveis'
      ],
      weaknesses: [
        'Falta citação de precedentes do STJ',
        'Valor da causa não especificado'
      ]
    };
    
    return analysis;
  }

  /**
   * Gera templates para diferentes tipos de documentos
   */
  static getDocumentTemplate(type: LegalDocument['type']): string {
    const templates: Record<LegalDocument['type'], string> = {
      peticao_inicial: 'Template de petição inicial...',
      contestacao: 'Template de contestação...',
      recurso: 'Template de recurso...',
      parecer: 'Template de parecer...',
      contrato: 'Template de contrato...'
    };
    
    return templates[type] || 'Template não encontrado';
  }
}