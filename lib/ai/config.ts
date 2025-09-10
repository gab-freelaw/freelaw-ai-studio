import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// AI Model configurations
export const AI_MODELS = {
  // Fast, cost-effective for simple tasks
  FAST: {
    provider: 'openai',
    model: openai('gpt-4o-mini'),
    name: 'GPT-4o Mini',
    maxTokens: 4096,
  },
  
  // Balanced performance for most tasks
  STANDARD: {
    provider: 'openai', 
    model: openai('gpt-4o'),
    name: 'GPT-4o',
    maxTokens: 8192,
  },
  
  // High quality for complex legal analysis
  ADVANCED: {
    provider: 'anthropic',
    model: anthropic('claude-3-5-sonnet-20241022'),
    name: 'Claude 3.5 Sonnet',
    maxTokens: 8192,
  },
  
  // For document processing and summarization
  LONG_CONTEXT: {
    provider: 'anthropic',
    model: anthropic('claude-3-5-haiku-20241022'),
    name: 'Claude 3.5 Haiku',
    maxTokens: 8192,
  },
} as const;

// Legal-specific system prompts
export const LEGAL_PROMPTS = {
  BASE: `You are an AI legal assistant for Brazilian law professionals. You have expertise in Brazilian legislation, jurisprudence, and legal procedures. Always cite relevant laws, articles, and precedents when applicable. Maintain professional legal language while being clear and accessible.`,
  
  CONTRACT_REVIEW: `You are a contract analysis specialist. Review contracts for potential issues, unclear clauses, and legal risks. Highlight important terms, obligations, and deadlines. Suggest improvements based on Brazilian contract law and best practices.`,
  
  LEGAL_RESEARCH: `You are a legal research assistant specializing in Brazilian law. Search for relevant legislation, jurisprudence, and doctrine. Provide citations in ABNT format. Analyze how different courts have interpreted similar cases.`,
  
  DOCUMENT_DRAFTING: `You are a legal document drafting assistant. Create well-structured legal documents following Brazilian legal standards and formatting. Use appropriate legal terminology and ensure compliance with current legislation.`,
  
  CASE_ANALYSIS: `You are a case analysis expert. Evaluate legal cases, identify strengths and weaknesses, suggest legal strategies, and predict possible outcomes based on Brazilian jurisprudence and legal precedents.`,
} as const;

// Document processing settings
export const DOCUMENT_SETTINGS = {
  // Chunk size for document splitting (for embeddings)
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  
  // Embedding model
  EMBEDDING_MODEL: 'text-embedding-3-small',
  EMBEDDING_DIMENSIONS: 1536,
  
  // File size limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
} as const;

// Rate limiting settings
export const RATE_LIMITS = {
  FREE: {
    requestsPerDay: 20,
    documentsPerMonth: 10,
    maxFileSize: 2 * 1024 * 1024, // 2MB
  },
  STARTER: {
    requestsPerDay: 100,
    documentsPerMonth: 50,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  PROFESSIONAL: {
    requestsPerDay: 500,
    documentsPerMonth: 200,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  ENTERPRISE: {
    requestsPerDay: -1, // Unlimited
    documentsPerMonth: -1, // Unlimited
    maxFileSize: 20 * 1024 * 1024, // 20MB
  },
} as const;