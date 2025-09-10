/**
 * Configuração de Modelos de IA - Atualizado com modelos mais recentes
 * Baseado na documentação oficial OpenAI e Anthropic
 */

export const AI_MODELS = {
  OPENAI: {
    // GPT-5 models (Latest generation)
    GPT5: 'gpt-5',                           // $1.25/$10 per 1M tokens
    GPT5_MINI: 'gpt-5-mini',                // $0.25/$2 per 1M tokens
    GPT5_NANO: 'gpt-5-nano',                // $0.05/$0.40 per 1M tokens
    GPT5_CHAT: 'gpt-5-chat-latest',         // Latest chat optimized
    
    // GPT-4.1 models (New release)
    GPT41: 'gpt-4.1',                       // $2.00/$8.00 per 1M tokens
    GPT41_MINI: 'gpt-4.1-mini',             // $0.40/$1.60 per 1M tokens
    GPT41_NANO: 'gpt-4.1-nano',             // $0.10/$0.40 per 1M tokens
    
    // O-series reasoning models
    O1: 'o1',                               // $15/$60 per 1M tokens
    O1_PRO: 'o1-pro',                       // $150/$600 per 1M tokens
    O1_MINI: 'o1-mini',                     // $1.10/$4.40 per 1M tokens
    O3: 'o3',                               // $2.00/$8.00 per 1M tokens
    O3_PRO: 'o3-pro',                       // $20/$80 per 1M tokens
    O3_MINI: 'o3-mini',                     // $1.10/$4.40 per 1M tokens
    O3_DEEP: 'o3-deep-research',            // $10/$40 per 1M tokens
    O4_MINI: 'o4-mini',                     // $1.10/$4.40 per 1M tokens
    O4_MINI_DEEP: 'o4-mini-deep-research',  // $2.00/$8.00 per 1M tokens
    
    // GPT-4o models
    GPT4O: 'gpt-4o',                        // $2.50/$10 per 1M tokens
    GPT4O_MINI: 'gpt-4o-mini',              // $0.15/$0.60 per 1M tokens
    
    // Realtime models
    GPT_REALTIME: 'gpt-realtime',           // $4/$16 per 1M tokens
    GPT4O_REALTIME: 'gpt-4o-realtime-preview',
    GPT4O_MINI_REALTIME: 'gpt-4o-mini-realtime-preview',
    
    // Audio models
    GPT_AUDIO: 'gpt-audio',                 // $2.50/$10 per 1M tokens
    GPT4O_AUDIO: 'gpt-4o-audio-preview',
    GPT4O_MINI_AUDIO: 'gpt-4o-mini-audio-preview',
    
    // Search models
    GPT4O_SEARCH: 'gpt-4o-search-preview',  // $2.50/$10 per 1M tokens
    GPT4O_MINI_SEARCH: 'gpt-4o-mini-search-preview',
    
    // Image model
    GPT_IMAGE_1: 'gpt-image-1',             // $5.00 input per 1M tokens
    
    // Specialized models
    COMPUTER_USE: 'computer-use-preview',    // $3.00/$12 per 1M tokens
    CODEX_MINI: 'codex-mini-latest',        // $1.50/$6.00 per 1M tokens
    
    // Default model for production use
    DEFAULT: 'gpt-4o-mini'                  // Most cost-effective for general use
  },
  
  ANTHROPIC: {
    // Claude Opus 4 series (Most powerful - March 2025 data)
    OPUS_4_1: 'claude-opus-4-1-20250805',   // Latest Opus - Highest intelligence
    
    // Claude Sonnet 4 series (Balanced - March 2025 data)
    SONNET_4: 'claude-sonnet-4-20250514',   // Latest Sonnet 4 - 1M token context (beta)
    
    // Claude 3.5 series (Stable previous generation)
    SONNET_35: 'claude-3-5-sonnet-20241022', // Stable 3.5 Sonnet
    SONNET_35_OLD: 'claude-3-5-sonnet-20240620',
    HAIKU_35: 'claude-3-5-haiku-20241022',   // Fast 3.5 Haiku
    
    // Claude 3 series (Legacy)
    HAIKU_3: 'claude-3-haiku-20240307',      // Legacy Haiku
    
    // Default model for production use
    DEFAULT: 'claude-sonnet-4-20250514'      // Latest Sonnet 4 with best balance
  },
  
  GEMINI: {
    PRO: 'gemini-1.5-pro',
    FLASH: 'gemini-1.5-flash',
    FLASH_2: 'gemini-2.0-flash',
    DEFAULT: 'gemini-2.0-flash'
  }
} as const;

export const MODEL_PRICING = {
  // GPT-5 series (per 1K tokens)
  'gpt-5': { input: 0.00125, output: 0.010 },
  'gpt-5-mini': { input: 0.00025, output: 0.002 },
  'gpt-5-nano': { input: 0.00005, output: 0.0004 },
  'gpt-5-chat-latest': { input: 0.00125, output: 0.010 },
  
  // GPT-4.1 series
  'gpt-4.1': { input: 0.002, output: 0.008 },
  'gpt-4.1-mini': { input: 0.0004, output: 0.0016 },
  'gpt-4.1-nano': { input: 0.0001, output: 0.0004 },
  
  // O-series reasoning models
  'o1': { input: 0.015, output: 0.060 },
  'o1-pro': { input: 0.150, output: 0.600 },
  'o1-mini': { input: 0.0011, output: 0.0044 },
  'o3': { input: 0.002, output: 0.008 },
  'o3-pro': { input: 0.020, output: 0.080 },
  'o3-mini': { input: 0.0011, output: 0.0044 },
  'o3-deep-research': { input: 0.010, output: 0.040 },
  'o4-mini': { input: 0.0011, output: 0.0044 },
  'o4-mini-deep-research': { input: 0.002, output: 0.008 },
  
  // GPT-4o series
  'gpt-4o': { input: 0.0025, output: 0.010 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  
  // Realtime models
  'gpt-realtime': { input: 0.004, output: 0.016 },
  'gpt-4o-realtime-preview': { input: 0.005, output: 0.020 },
  'gpt-4o-mini-realtime-preview': { input: 0.0006, output: 0.0024 },
  
  // Audio models
  'gpt-audio': { input: 0.0025, output: 0.010 },
  'gpt-4o-audio-preview': { input: 0.0025, output: 0.010 },
  'gpt-4o-mini-audio-preview': { input: 0.00015, output: 0.0006 },
  
  // Search models
  'gpt-4o-search-preview': { input: 0.0025, output: 0.010 },
  'gpt-4o-mini-search-preview': { input: 0.00015, output: 0.0006 },
  
  // Image model
  'gpt-image-1': { input: 0.005, output: 0 },
  
  // Specialized models
  'computer-use-preview': { input: 0.003, output: 0.012 },
  'codex-mini-latest': { input: 0.0015, output: 0.006 },
  
  // Claude models (official pricing per 1K tokens)
  'claude-opus-4-1-20250805': { input: 0.015, output: 0.075 },    // $15/$75 per 1M
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },    // $3/$15 per 1M
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },  // $3/$15 per 1M
  'claude-3-5-sonnet-20240620': { input: 0.003, output: 0.015 },  // $3/$15 per 1M
  'claude-3-5-haiku-20241022': { input: 0.00025, output: 0.00125 }, // $0.25/$1.25 per 1M
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },   // $0.25/$1.25 per 1M
  
  // Gemini models
  'gemini-1.5-pro': { input: 0.0035, output: 0.0105 },
  'gemini-1.5-flash': { input: 0.00035, output: 0.00105 },
  'gemini-2.0-flash': { input: 0.00025, output: 0.00075 }
} as const;

export enum TaskType {
  REASONING = 'reasoning',
  DEEP_RESEARCH = 'deep_research',
  CODE_GENERATION = 'code',
  LEGAL_DRAFTING = 'legal_draft',
  LEGAL_ANALYSIS = 'legal_analysis',
  CONTRACT_ANALYSIS = 'contract',
  DOCUMENT_ANALYSIS = 'document',
  CHAT = 'chat',
  REALTIME_CHAT = 'realtime_chat',
  AUDIO_PROCESSING = 'audio',
  IMAGE_ANALYSIS = 'image',
  WEB_SEARCH = 'web_search',
  SUMMARIZATION = 'summary',
  TRANSLATION = 'translation',
  DATA_EXTRACTION = 'extraction'
}

export enum TaskPriority {
  COST_OPTIMIZED = 'cost',
  QUALITY_FIRST = 'quality',
  SPEED_CRITICAL = 'speed',
  BALANCED = 'balanced'
}

export interface ModelRecommendation {
  primary: string;
  fallback: string;
  reasoning: string;
  estimatedCost: number;
  performanceScore: number;
}

export type OpenAIModel = typeof AI_MODELS.OPENAI[keyof typeof AI_MODELS.OPENAI];
export type AnthropicModel = typeof AI_MODELS.ANTHROPIC[keyof typeof AI_MODELS.ANTHROPIC];
export type GeminiModel = typeof AI_MODELS.GEMINI[keyof typeof AI_MODELS.GEMINI];
export type AIModel = OpenAIModel | AnthropicModel | GeminiModel;

// Model capabilities matrix (Updated for 2025)
export const MODEL_CAPABILITIES = {
  // Best for reasoning and complex analysis
  reasoning: ['o3-pro', 'o1-pro', 'o1', 'o3', 'claude-opus-4-1-20250805', 'gpt-5'],
  
  // Best for deep research
  deepResearch: ['o3-deep-research', 'o4-mini-deep-research', 'gpt-5', 'claude-opus-4-1-20250805'],
  
  // Best for legal work
  legal: ['claude-opus-4-1-20250805', 'claude-sonnet-4-20250514', 'gpt-5', 'gpt-4.1'],
  
  // Best for code generation
  code: ['codex-mini-latest', 'gpt-5', 'claude-sonnet-4-20250514', 'o3', 'gpt-4.1'],
  
  // Best for real-time interactions
  realtime: ['gpt-realtime', 'gpt-4o-realtime-preview', 'gpt-4o-mini-realtime-preview'],
  
  // Best for audio processing
  audio: ['gpt-audio', 'gpt-4o-audio-preview', 'gpt-4o-mini-audio-preview'],
  
  // Best for web search
  search: ['gpt-4o-search-preview', 'gpt-4o-mini-search-preview', 'gpt-5'],
  
  // Best for vision/image analysis
  vision: ['claude-opus-4-1-20250805', 'claude-sonnet-4-20250514', 'gpt-5', 'gpt-image-1'],
  
  // Most cost-effective
  budget: ['gpt-5-nano', 'gpt-4.1-nano', 'gpt-4o-mini', 'claude-3-5-haiku-20241022'],
  
  // Best balance of quality and cost
  balanced: ['claude-sonnet-4-20250514', 'gpt-5-mini', 'gpt-4.1-mini', 'claude-3-5-sonnet-20241022'],
  
  // Fastest response times
  fast: ['claude-3-5-haiku-20241022', 'gpt-4o-mini', 'gpt-5-nano', 'gemini-2.0-flash'],
  
  // Best for extended context (1M tokens)
  longContext: ['claude-sonnet-4-20250514'], // 1M token context window (beta)
} as const;