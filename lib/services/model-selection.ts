/**
 * Serviço de Seleção Inteligente de Modelos
 * Baseado no ModelSelectionService do freelaw-ai-project
 */

import { 
  AI_MODELS, 
  MODEL_PRICING, 
  TaskType, 
  TaskPriority, 
  ModelRecommendation 
} from '@/lib/config/ai-models';

export class ModelSelectionService {
  /**
   * Seleciona o melhor modelo baseado na tarefa
   */
  static selectModel(
    taskType: TaskType,
    priority: TaskPriority = TaskPriority.BALANCED,
    estimatedTokens: number = 1000
  ): ModelRecommendation {
    switch (taskType) {
      case TaskType.REASONING:
        return this.selectReasoningModel(priority, estimatedTokens);
      
      case TaskType.CODE_GENERATION:
        return this.selectCodeModel(priority, estimatedTokens);
      
      case TaskType.LEGAL_DRAFTING:
        return this.selectLegalDraftingModel(priority, estimatedTokens);
      
      case TaskType.LEGAL_ANALYSIS:
        return this.selectLegalAnalysisModel(priority, estimatedTokens);
      
      case TaskType.CONTRACT_ANALYSIS:
        return this.selectContractModel(priority, estimatedTokens);
      
      case TaskType.DOCUMENT_ANALYSIS:
        return this.selectDocumentModel(priority, estimatedTokens);
      
      case TaskType.CHAT:
        return this.selectChatModel(priority, estimatedTokens);
      
      case TaskType.SUMMARIZATION:
        return this.selectSummarizationModel(priority, estimatedTokens);
      
      case TaskType.DATA_EXTRACTION:
        return this.selectExtractionModel(priority, estimatedTokens);
      
      default:
        return this.selectDefaultModel(priority, estimatedTokens);
    }
  }

  private static selectReasoningModel(priority: TaskPriority, tokens: number): ModelRecommendation {
    if (priority === TaskPriority.QUALITY_FIRST) {
      return {
        primary: AI_MODELS.OPENAI.GPT5,
        fallback: AI_MODELS.ANTHROPIC.OPUS_4_1,
        reasoning: 'GPT-5 oferece o melhor raciocínio (94.6% AIME 2025)',
        estimatedCost: this.calculateCost(AI_MODELS.OPENAI.GPT5, tokens),
        performanceScore: 98
      };
    }
    
    if (priority === TaskPriority.COST_OPTIMIZED) {
      return {
        primary: AI_MODELS.OPENAI.O1_MINI,
        fallback: AI_MODELS.OPENAI.GPT5_NANO,
        reasoning: 'o1-mini oferece bom raciocínio com custo reduzido',
        estimatedCost: this.calculateCost(AI_MODELS.OPENAI.O1_MINI, tokens),
        performanceScore: 85
      };
    }

    return {
      primary: AI_MODELS.OPENAI.GPT5_MINI,
      fallback: AI_MODELS.ANTHROPIC.SONNET_4,
      reasoning: 'GPT-5-mini balanceia custo e qualidade',
      estimatedCost: this.calculateCost(AI_MODELS.OPENAI.GPT5_MINI, tokens),
      performanceScore: 90
    };
  }

  private static selectCodeModel(priority: TaskPriority, tokens: number): ModelRecommendation {
    if (priority === TaskPriority.QUALITY_FIRST) {
      return {
        primary: AI_MODELS.OPENAI.GPT5,
        fallback: AI_MODELS.ANTHROPIC.SONNET_4,
        reasoning: 'GPT-5 lidera com 74.9% SWE-bench, Claude Sonnet 4 com 72.7%',
        estimatedCost: this.calculateCost(AI_MODELS.OPENAI.GPT5, tokens),
        performanceScore: 97
      };
    }

    return {
      primary: AI_MODELS.ANTHROPIC.SONNET_4,
      fallback: AI_MODELS.OPENAI.GPT5_MINI,
      reasoning: 'Claude Sonnet 4 excelente para código com menor custo',
      estimatedCost: this.calculateCost(AI_MODELS.ANTHROPIC.SONNET_4, tokens),
      performanceScore: 92
    };
  }

  private static selectLegalDraftingModel(priority: TaskPriority, tokens: number): ModelRecommendation {
    if (priority === TaskPriority.QUALITY_FIRST) {
      return {
        primary: AI_MODELS.ANTHROPIC.OPUS_4_1,
        fallback: AI_MODELS.OPENAI.GPT5,
        reasoning: 'Claude Opus 4.1 superior em escrita jurídica criativa',
        estimatedCost: this.calculateCost(AI_MODELS.ANTHROPIC.OPUS_4_1, tokens),
        performanceScore: 96
      };
    }

    return {
      primary: AI_MODELS.ANTHROPIC.SONNET_4,
      fallback: AI_MODELS.OPENAI.GPT5_MINI,
      reasoning: 'Claude Sonnet 4 oferece excelente redação jurídica',
      estimatedCost: this.calculateCost(AI_MODELS.ANTHROPIC.SONNET_4, tokens),
      performanceScore: 91
    };
  }

  private static selectLegalAnalysisModel(priority: TaskPriority, tokens: number): ModelRecommendation {
    if (priority === TaskPriority.QUALITY_FIRST) {
      return {
        primary: AI_MODELS.OPENAI.GPT5,
        fallback: AI_MODELS.ANTHROPIC.OPUS_4_1,
        reasoning: 'GPT-5 com raciocínio estendido para análise jurídica complexa',
        estimatedCost: this.calculateCost(AI_MODELS.OPENAI.GPT5, tokens),
        performanceScore: 98
      };
    }

    return {
      primary: AI_MODELS.ANTHROPIC.OPUS_4_1,
      fallback: AI_MODELS.OPENAI.GPT5_MINI,
      reasoning: 'Claude Opus 4.1 equilibra análise profunda com custo',
      estimatedCost: this.calculateCost(AI_MODELS.ANTHROPIC.OPUS_4_1, tokens),
      performanceScore: 93
    };
  }

  private static selectContractModel(priority: TaskPriority, tokens: number): ModelRecommendation {
    return {
      primary: AI_MODELS.OPENAI.GPT5,
      fallback: AI_MODELS.ANTHROPIC.OPUS_4_1,
      reasoning: 'GPT-5 para análise detalhada de contratos complexos',
      estimatedCost: this.calculateCost(AI_MODELS.OPENAI.GPT5, tokens),
      performanceScore: 95
    };
  }

  private static selectDocumentModel(priority: TaskPriority, tokens: number): ModelRecommendation {
    if (priority === TaskPriority.SPEED_CRITICAL) {
      return {
        primary: AI_MODELS.GEMINI.FLASH_2,
        fallback: AI_MODELS.OPENAI.GPT5_NANO,
        reasoning: 'Gemini 2.0 Flash para processamento rápido',
        estimatedCost: this.calculateCost(AI_MODELS.GEMINI.FLASH_2, tokens),
        performanceScore: 85
      };
    }

    return {
      primary: AI_MODELS.OPENAI.GPT5_MINI,
      fallback: AI_MODELS.ANTHROPIC.HAIKU_35,
      reasoning: 'GPT-5-mini para análise eficiente de documentos',
      estimatedCost: this.calculateCost(AI_MODELS.OPENAI.GPT5_MINI, tokens),
      performanceScore: 89
    };
  }

  private static selectChatModel(priority: TaskPriority, tokens: number): ModelRecommendation {
    if (priority === TaskPriority.COST_OPTIMIZED) {
      return {
        primary: AI_MODELS.OPENAI.GPT5_NANO,
        fallback: AI_MODELS.GEMINI.FLASH_2,
        reasoning: 'GPT-5-nano oferece chat de qualidade com menor custo',
        estimatedCost: this.calculateCost(AI_MODELS.OPENAI.GPT5_NANO, tokens),
        performanceScore: 82
      };
    }

    return {
      primary: AI_MODELS.OPENAI.GPT5_MINI,
      fallback: AI_MODELS.ANTHROPIC.SONNET_35,
      reasoning: 'GPT-5-mini para conversação natural e responsiva',
      estimatedCost: this.calculateCost(AI_MODELS.OPENAI.GPT5_MINI, tokens),
      performanceScore: 88
    };
  }

  private static selectSummarizationModel(priority: TaskPriority, tokens: number): ModelRecommendation {
    return {
      primary: AI_MODELS.ANTHROPIC.HAIKU_35,
      fallback: AI_MODELS.OPENAI.GPT5_NANO,
      reasoning: 'Claude Haiku 3.5 para sumarização rápida e precisa',
      estimatedCost: this.calculateCost(AI_MODELS.ANTHROPIC.HAIKU_35, tokens),
      performanceScore: 86
    };
  }

  private static selectExtractionModel(priority: TaskPriority, tokens: number): ModelRecommendation {
    return {
      primary: AI_MODELS.OPENAI.GPT5_NANO,
      fallback: AI_MODELS.GEMINI.FLASH_2,
      reasoning: 'GPT-5-nano eficiente para extração estruturada',
      estimatedCost: this.calculateCost(AI_MODELS.OPENAI.GPT5_NANO, tokens),
      performanceScore: 84
    };
  }

  private static selectDefaultModel(priority: TaskPriority, tokens: number): ModelRecommendation {
    return {
      primary: AI_MODELS.OPENAI.GPT5_MINI,
      fallback: AI_MODELS.ANTHROPIC.SONNET_4,
      reasoning: 'GPT-5-mini como modelo padrão versátil',
      estimatedCost: this.calculateCost(AI_MODELS.OPENAI.GPT5_MINI, tokens),
      performanceScore: 90
    };
  }

  private static calculateCost(model: string, tokens: number): number {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
    if (!pricing) return 0;
    
    // Assumindo 70% input, 30% output
    const inputTokens = tokens * 0.7;
    const outputTokens = tokens * 0.3;
    
    return (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;
  }

  /**
   * Recomenda estratégia de uso de modelos para o escritório
   */
  static recommendOfficeStrategy(monthlyBudget: number): {
    recommendations: string[];
    modelAllocation: Partial<Record<TaskType, string>>;
  } {
    const recommendations: string[] = [];
    const modelAllocation: Partial<Record<TaskType, string>> = {};

    if (monthlyBudget > 5000) {
      recommendations.push('Use GPT-5 para casos complexos e análises críticas');
      recommendations.push('Claude Opus 4.1 para elaboração de peças principais');
      modelAllocation[TaskType.REASONING] = AI_MODELS.OPENAI.GPT5;
      modelAllocation[TaskType.LEGAL_DRAFTING] = AI_MODELS.ANTHROPIC.OPUS_4_1;
    } else if (monthlyBudget > 1000) {
      recommendations.push('GPT-5-mini para tarefas gerais');
      recommendations.push('Claude Sonnet 4 para redação jurídica');
      recommendations.push('o1-mini para raciocínio complexo');
      modelAllocation[TaskType.REASONING] = AI_MODELS.OPENAI.O1_MINI;
      modelAllocation[TaskType.LEGAL_DRAFTING] = AI_MODELS.ANTHROPIC.SONNET_4;
    } else {
      recommendations.push('GPT-5-nano para maioria das tarefas');
      recommendations.push('Reserve modelos premium para casos críticos');
      modelAllocation[TaskType.CHAT] = AI_MODELS.OPENAI.GPT5_NANO;
      modelAllocation[TaskType.DOCUMENT_ANALYSIS] = AI_MODELS.GEMINI.FLASH_2;
    }

    return { recommendations, modelAllocation };
  }
}