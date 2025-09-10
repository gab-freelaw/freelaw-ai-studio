import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import {
  ServiceType,
  LegalArea,
  PROCESSING_CONFIG,
  ExtractionSchema,
  FieldConfig
} from './types';

// Re-export types for backward compatibility
export { ServiceType, LegalArea, PROCESSING_CONFIG, type ExtractionSchema, type FieldConfig } from './types';

export class DocumentProcessor {
  private supabase;
  private genAI: GoogleGenerativeAI;
  
  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    geminiApiKey: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
  }
  
  /**
   * Split text into chunks for processing
   */
  private splitIntoChunks(text: string, chunkSize: number = PROCESSING_CONFIG.CHUNK_SIZE): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Process a single chunk with the extraction schema
   */
  private async processChunk(
    chunk: string,
    schema: ExtractionSchema,
    chunkInfo: { index: number; total: number }
  ): Promise<any> {
    // Build dynamic Zod schema from extraction schema
    const zodSchema = this.buildZodSchema(schema.fields);
    
    // Create extraction prompt
    const prompt = this.buildExtractionPrompt(chunk, schema, chunkInfo);
    
    try {
      // Use Vercel AI SDK with structured output
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        prompt,
        schema: zodSchema,
      });
      
      return result.object;
    } catch (error) {
      console.error(`Error processing chunk ${chunkInfo.index}:`, error);
      
      // Fallback to Gemini
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
          topK: 20,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        }
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    }
  }
  
  /**
   * Build Zod schema from field configuration
   */
  private buildZodSchema(fields: Record<string, FieldConfig>): z.ZodObject<any> {
    const schemaObj: Record<string, any> = {};
    
    for (const [fieldName, config] of Object.entries(fields)) {
      let fieldSchema;
      
      switch (config.type) {
        case 'string':
          fieldSchema = z.string();
          break;
        case 'number':
          fieldSchema = z.number();
          break;
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        case 'date':
          fieldSchema = z.string().datetime();
          break;
        case 'array':
          fieldSchema = z.array(z.string());
          break;
        case 'object':
          fieldSchema = z.object({});
          break;
        default:
          fieldSchema = z.string();
      }
      
      if (!config.required) {
        fieldSchema = fieldSchema.optional();
      }
      
      schemaObj[fieldName] = fieldSchema;
    }
    
    return z.object(schemaObj);
  }
  
  /**
   * Build extraction prompt
   */
  private buildExtractionPrompt(
    text: string,
    schema: ExtractionSchema,
    chunkInfo: { index: number; total: number }
  ): string {
    const fieldsDescription = Object.entries(schema.fields)
      .map(([name, config]) => {
        const hints = config.extraction_hints?.join(', ') || '';
        return `- ${name}: ${config.description}${hints ? ` (Dicas: ${hints})` : ''}`;
      })
      .join('\n');
    
    const basePrompt = schema.prompt_template || `
Você é um especialista em extração de informações de documentos jurídicos brasileiros.
Analise o seguinte trecho de documento e extraia as informações solicitadas.

Tipo de documento: ${schema.service_type}
Área do direito: ${schema.legal_area}
Chunk ${chunkInfo.index + 1} de ${chunkInfo.total}

Campos para extrair:
${fieldsDescription}

Documento:
${text}

Extraia APENAS as informações que estão claramente presentes no texto.
Para campos não encontrados, retorne null.
Retorne um JSON válido com os campos solicitados.
`;
    
    return basePrompt;
  }
  
  /**
   * Consolidate results from multiple chunks
   */
  private consolidateResults(
    chunkResults: any[],
    schema: ExtractionSchema
  ): Record<string, any> {
    const consolidated: Record<string, any> = {};
    
    for (const [fieldName, config] of Object.entries(schema.fields)) {
      const strategy = config.consolidation || 'first_non_null';
      
      switch (strategy) {
        case 'first_non_null':
          // Get first non-null value
          for (const result of chunkResults) {
            if (result[fieldName] !== null && result[fieldName] !== undefined) {
              consolidated[fieldName] = result[fieldName];
              break;
            }
          }
          break;
          
        case 'merge_list':
          // Merge arrays from all chunks
          const merged: any[] = [];
          for (const result of chunkResults) {
            if (Array.isArray(result[fieldName])) {
              merged.push(...result[fieldName]);
            }
          }
          // Remove duplicates
          consolidated[fieldName] = [...new Set(merged)];
          break;
          
        case 'concatenate':
          // Concatenate strings
          const parts: string[] = [];
          for (const result of chunkResults) {
            if (result[fieldName]) {
              parts.push(String(result[fieldName]));
            }
          }
          if (parts.length > 0) {
            consolidated[fieldName] = parts.join(' ');
          }
          break;
          
        case 'most_complete':
          // Choose the most complete result
          let bestResult = null;
          let bestScore = 0;
          
          for (const result of chunkResults) {
            if (result[fieldName]) {
              const score = typeof result[fieldName] === 'object'
                ? Object.values(result[fieldName]).filter(v => v !== null).length
                : 1;
              
              if (score > bestScore) {
                bestScore = score;
                bestResult = result[fieldName];
              }
            }
          }
          
          if (bestResult !== null) {
            consolidated[fieldName] = bestResult;
          }
          break;
      }
    }
    
    return consolidated;
  }
  
  /**
   * Process a complete document
   */
  async processDocument(
    documentId: string,
    serviceType: ServiceType,
    legalArea: LegalArea,
    documentContent: string | Buffer
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    processingTime: number;
    chunksProcessed: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Get extraction schema from Supabase
      const { data: schema, error: schemaError } = await this.supabase
        .from('extraction_schemas')
        .select('*')
        .eq('service_type', serviceType)
        .eq('legal_area', legalArea)
        .single();
      
      if (schemaError || !schema) {
        throw new Error(`Schema not found for ${serviceType}/${legalArea}`);
      }
      
      // Text should already be extracted at this point
      const text = typeof documentContent === 'string' 
        ? documentContent 
        : new TextDecoder().decode(documentContent);
      
      // Split into chunks
      const chunks = this.splitIntoChunks(text);
      const totalChunks = chunks.length;
      
      // Process chunks in parallel (with limit)
      const chunkResults: any[] = [];
      const batchSize = PROCESSING_CONFIG.MAX_PARALLEL_CHUNKS;
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const batchPromises = batch.map((chunk, idx) => 
          this.processChunk(chunk, schema, {
            index: i + idx,
            total: totalChunks
          })
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            chunkResults.push(result.value);
          }
        }
      }
      
      // Consolidate results
      const consolidatedData = this.consolidateResults(chunkResults, schema);
      
      // Save to database
      const { error: saveError } = await this.supabase
        .from('document_extractions')
        .insert({
          document_id: documentId,
          service_type: serviceType,
          legal_area: legalArea,
          extracted_data: consolidatedData,
          processing_time: Date.now() - startTime,
          chunks_processed: totalChunks,
          status: 'completed'
        });
      
      if (saveError) {
        console.error('Error saving extraction:', saveError);
      }
      
      return {
        success: true,
        data: consolidatedData,
        processingTime: Date.now() - startTime,
        chunksProcessed: totalChunks
      };
      
    } catch (error) {
      console.error('Document processing error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
        chunksProcessed: 0
      };
    }
  }
}

// Export default instance
export const createDocumentProcessor = (
  supabaseUrl: string,
  supabaseKey: string,
  geminiApiKey: string
) => {
  return new DocumentProcessor(supabaseUrl, supabaseKey, geminiApiKey);
};