import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import type {
  PetitionGenerationRequest,
  PetitionGenerationResult,
  PetitionChunk,
  PetitionSchema,
  ServiceType,
  LegalArea,
  ConsolidationStrategy
} from '@/lib/types/petition.types'
import { petitionSchemaService } from './petition-schema.service'
import { officeStyleService } from './office-style.service'
import { petitionCacheService } from './petition-cache.service'
import { ModelSelectionService } from './model-selection'
import { TaskType, TaskPriority, AI_MODELS } from '@/lib/config/ai-models'

class PetitionProcessorService {
  private readonly CHUNK_SIZE = 50000 // 50k characters per chunk
  private readonly MAX_PARALLEL_CHUNKS = 3

  /**
   * Generate a petition with schema validation and chunking
   */
  async generatePetition(
    request: PetitionGenerationRequest,
    useCache: boolean = true
  ): Promise<PetitionGenerationResult> {
    const startTime = Date.now()
    const validationErrors: string[] = []

    try {
      // 1. Get schema for the petition type
      const schema = await petitionSchemaService.getSchema(
        request.service_type,
        request.legal_area
      )

      if (!schema) {
        throw new Error(`Schema não encontrado para ${request.service_type}/${request.legal_area}`)
      }

      // 2. Validate input data
      const validation = petitionSchemaService.validateData(request.data, schema)
      if (!validation.isValid) {
        validationErrors.push(...validation.errors.map(e => e.message))
        if (validation.errors.some(e => e.severity === 'error')) {
          throw new Error(`Validação falhou: ${validationErrors.join(', ')}`)
        }
      }

      // 3. Check cache if enabled
      if (useCache) {
        const cacheKey = petitionCacheService.generateCacheKey(
          request.service_type,
          request.legal_area,
          request.data,
          request.office_id
        )

        const cached = await petitionCacheService.getCachedPetition(
          cacheKey,
          request.office_id
        )

        if (cached) {
          console.log('Cache hit for petition generation')
          return {
            id: crypto.randomUUID(),
            petition_text: cached.petition_text,
            processing_time: 0, // Instant from cache
            model_used: cached.metadata.model_used,
            office_style_applied: cached.metadata.office_style_applied,
            letterhead_applied: cached.metadata.letterhead_applied,
            confidence_score: 100, // High confidence for cached results
            validation_errors: validationErrors.length > 0 ? validationErrors : undefined
          }
        }
      }

      // 3. Get office style if requested
      let officeStyle = null
      if (request.use_office_style && request.office_id) {
        officeStyle = await officeStyleService.getDefaultStyle(request.office_id)
      }

      // 4. Get letterhead if requested
      let letterhead = null
      if (request.use_letterhead && request.office_id) {
        letterhead = await officeStyleService.getDefaultLetterhead(request.office_id)
      }

      // 5. Select AI model
      const modelRecommendation = ModelSelectionService.selectModel(
        TaskType.LEGAL_DRAFTING,
        TaskPriority.QUALITY_FIRST,
        5000
      )

      // 6. Prepare petition sections
      const sections = this.preparePetitionSections(request.data, schema)

      // 7. Process chunks if content is large
      let petitionText = ''
      const chunks: PetitionChunk[] = []

      if (this.shouldUseChunking(sections)) {
        // Process in chunks for large petitions
        const chunkResults = await this.processChunks(
          sections,
          schema,
          officeStyle,
          modelRecommendation.primary
        )
        
        petitionText = this.consolidateChunks(chunkResults, schema)
        chunks.push(...chunkResults)
      } else {
        // Process as single request for smaller petitions
        petitionText = await this.generateSinglePetition(
          request.data,
          schema,
          officeStyle,
          modelRecommendation.primary
        )
      }

      // 8. Apply letterhead if requested
      if (letterhead && petitionText) {
        const { html, css } = officeStyleService.applyLetterheadToDocument(
          petitionText,
          letterhead,
          {
            autor: request.data.autor || request.data.agravante || '',
            reu: request.data.reu || request.data.agravado || '',
            processo: request.data.processo || '',
            data: new Date().toLocaleDateString('pt-BR')
          }
        )
        petitionText = html // Use HTML with letterhead
      }

      // 9. Apply office style if requested (and no letterhead)
      else if (officeStyle && petitionText && !letterhead) {
        const { html, css } = officeStyleService.applyStyleToDocument(
          petitionText,
          officeStyle,
          {
            autor: request.data.autor || request.data.agravante || '',
            reu: request.data.reu || request.data.agravado || '',
            data: new Date().toLocaleDateString('pt-BR')
          }
        )
        petitionText = html // Use HTML with style
      }

      const processingTime = Date.now() - startTime

      const result: PetitionGenerationResult = {
        id: crypto.randomUUID(),
        petition_text: petitionText,
        chunks_processed: chunks.length > 0 ? chunks : undefined,
        processing_time: processingTime,
        model_used: modelRecommendation.primary,
        cost_estimate: modelRecommendation.estimatedCost,
        office_style_applied: !!officeStyle,
        letterhead_applied: !!letterhead,
        confidence_score: this.calculateConfidenceScore(validation, chunks),
        validation_errors: validationErrors.length > 0 ? validationErrors : undefined
      }

      // Save to cache if enabled
      if (useCache && petitionText) {
        const cacheKey = petitionCacheService.generateCacheKey(
          request.service_type,
          request.legal_area,
          request.data,
          request.office_id
        )

        await petitionCacheService.cachePetition(
          cacheKey,
          request.service_type,
          request.legal_area,
          petitionText,
          {
            model_used: modelRecommendation.primary,
            processing_time: processingTime,
            chunks_processed: chunks.length || undefined,
            office_style_applied: !!officeStyle,
            letterhead_applied: !!letterhead
          },
          request.office_id
        ).catch(console.error) // Don't fail if cache save fails
      }

      return result
    } catch (error) {
      console.error('Error generating petition:', error)
      throw error
    }
  }

  /**
   * Process petition in chunks for large documents
   */
  private async processChunks(
    sections: Record<string, string>,
    schema: PetitionSchema,
    officeStyle: any,
    modelId: string
  ): Promise<PetitionChunk[]> {
    const chunks: PetitionChunk[] = []
    const sectionKeys = Object.keys(sections)
    
    // Create chunks from sections
    sectionKeys.forEach((section, index) => {
      const content = sections[section]
      if (content.length > this.CHUNK_SIZE) {
        // Split large sections into smaller chunks
        const subChunks = this.splitIntoChunks(content)
        subChunks.forEach((subChunk, subIndex) => {
          chunks.push({
            index: chunks.length,
            total: 0, // Will be updated
            section: section as any,
            content: subChunk,
            tokens: Math.ceil(subChunk.length / 4) // Rough estimate
          })
        })
      } else {
        chunks.push({
          index: chunks.length,
          total: 0, // Will be updated
          section: section as any,
          content: content,
          tokens: Math.ceil(content.length / 4)
        })
      }
    })

    // Update total count
    chunks.forEach(chunk => {
      chunk.total = chunks.length
    })

    // Process chunks in parallel (with limit)
    const processedChunks: PetitionChunk[] = []
    for (let i = 0; i < chunks.length; i += this.MAX_PARALLEL_CHUNKS) {
      const batch = chunks.slice(i, i + this.MAX_PARALLEL_CHUNKS)
      const batchResults = await Promise.all(
        batch.map(chunk => this.processChunk(chunk, schema, officeStyle, modelId))
      )
      processedChunks.push(...batchResults)
    }

    return processedChunks
  }

  /**
   * Process a single chunk
   */
  private async processChunk(
    chunk: PetitionChunk,
    schema: PetitionSchema,
    officeStyle: any,
    modelId: string
  ): Promise<PetitionChunk> {
    try {
      const prompt = this.buildChunkPrompt(chunk, schema, officeStyle)
      
      const isOpenAI = modelId.startsWith('gpt') || modelId.startsWith('o1')
      const provider = isOpenAI ? openai : anthropic

      const result = await generateText({
        model: provider(modelId),
        messages: [
          {
            role: 'system',
            content: 'Você é um advogado brasileiro especializado em redação de peças processuais.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      })

      return {
        ...chunk,
        content: result.text
      }
    } catch (error) {
      console.error(`Error processing chunk ${chunk.index}:`, error)
      return chunk // Return original on error
    }
  }

  /**
   * Generate petition without chunking
   */
  private async generateSinglePetition(
    data: Record<string, any>,
    schema: PetitionSchema,
    officeStyle: any,
    modelId: string
  ): Promise<string> {
    const prompt = this.buildFullPrompt(data, schema, officeStyle)
    
    const isOpenAI = modelId.startsWith('gpt') || modelId.startsWith('o1')
    const provider = isOpenAI ? openai : anthropic

    const result = await generateText({
      model: provider(modelId),
      messages: [
        {
          role: 'system',
          content: this.buildSystemPrompt(schema, officeStyle)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2
    })

    return result.text
  }

  /**
   * Consolidate chunks into final petition
   */
  private consolidateChunks(
    chunks: PetitionChunk[],
    schema: PetitionSchema
  ): string {
    const consolidated: Record<string, string[]> = {}

    // Group chunks by section
    chunks.forEach(chunk => {
      if (!consolidated[chunk.section]) {
        consolidated[chunk.section] = []
      }
      consolidated[chunk.section].push(chunk.content)
    })

    // Build final petition
    const sections = []

    // Header/Qualificação
    if (consolidated.header) {
      sections.push(consolidated.header.join('\n\n'))
    }

    // Facts
    if (consolidated.facts) {
      sections.push('DOS FATOS\n\n' + consolidated.facts.join('\n\n'))
    }

    // Legal Basis
    if (consolidated.legal_basis) {
      sections.push('DO DIREITO\n\n' + consolidated.legal_basis.join('\n\n'))
    }

    // Requests
    if (consolidated.requests) {
      sections.push('DOS PEDIDOS\n\n' + consolidated.requests.join('\n\n'))
    }

    // Conclusion
    if (consolidated.conclusion) {
      sections.push(consolidated.conclusion.join('\n\n'))
    }

    return sections.join('\n\n')
  }

  /**
   * Helper methods
   */

  private preparePetitionSections(
    data: Record<string, any>,
    schema: PetitionSchema
  ): Record<string, string> {
    const sections: Record<string, string> = {}

    // Header with parties
    sections.header = this.prepareHeader(data)

    // Facts section
    if (data.fatos || data.facts) {
      sections.facts = Array.isArray(data.fatos) 
        ? data.fatos.join('\n\n')
        : (data.fatos || data.facts || '')
    }

    // Legal basis
    if (data.fundamentacao || data.legal_basis) {
      sections.legal_basis = Array.isArray(data.fundamentacao)
        ? data.fundamentacao.join('\n\n')
        : (data.fundamentacao || data.legal_basis || '')
    }

    // Requests
    if (data.pedidos || data.requests) {
      sections.requests = Array.isArray(data.pedidos)
        ? data.pedidos.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')
        : (data.pedidos || data.requests || '')
    }

    // Conclusion with value and signature
    sections.conclusion = this.prepareConclusion(data)

    return sections
  }

  private prepareHeader(data: Record<string, any>): string {
    const parts = []

    if (data.tribunal || data.court) {
      parts.push(`EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO ${data.tribunal || data.court || ''}`)
    }

    if (data.processo) {
      parts.push(`Processo nº ${data.processo}`)
    }

    const autor = data.autor || data.agravante || data.requerente
    const reu = data.reu || data.agravado || data.requerido

    if (autor) {
      parts.push(`${autor.toUpperCase()}, qualificação completa...`)
    }

    if (reu) {
      parts.push(`em face de ${reu.toUpperCase()}, qualificação completa...`)
    }

    return parts.join('\n\n')
  }

  private prepareConclusion(data: Record<string, any>): string {
    const parts = []

    if (data.valor_causa || data.valor) {
      parts.push(`Dá-se à causa o valor de ${data.valor_causa || data.valor}.`)
    }

    parts.push('Nestes termos,\nPede deferimento.')
    parts.push('[Local], [Data]')
    parts.push('[Advogado]\nOAB/[UF] nº [número]')

    return parts.join('\n\n')
  }

  private shouldUseChunking(sections: Record<string, string>): boolean {
    const totalLength = Object.values(sections).reduce((sum, section) => sum + section.length, 0)
    return totalLength > this.CHUNK_SIZE * 1.5 // Use chunking if > 75k characters
  }

  private splitIntoChunks(text: string): string[] {
    const chunks: string[] = []
    for (let i = 0; i < text.length; i += this.CHUNK_SIZE) {
      chunks.push(text.slice(i, i + this.CHUNK_SIZE))
    }
    return chunks
  }

  private buildSystemPrompt(schema: PetitionSchema, officeStyle: any): string {
    let prompt = `Você é um advogado brasileiro experiente, especializado em redação de peças processuais.

INSTRUÇÕES:
- Siga rigorosamente as normas do CPC/NCPC
- Use linguagem técnica e formal apropriada
- Cite artigos de lei, súmulas e jurisprudência quando aplicável
- Estruture a peça de forma clara e lógica
- Seja persuasivo mas sempre respeitoso`

    if (schema.style_preferences) {
      const { formality, structure, citations } = schema.style_preferences
      prompt += `\n\nESTILO:
- Formalidade: ${formality === 'formal' ? 'Formal e tradicional' : formality === 'moderado' ? 'Formal mas acessível' : 'Objetivo e direto'}
- Estrutura: ${structure === 'tradicional' ? 'Tradicional com todas as seções' : structure === 'moderna' ? 'Moderna e fluida' : 'Concisa e direta'}
- Citações: ${citations === 'completa' ? 'Citações completas com transcrições' : citations === 'essencial' ? 'Apenas citações essenciais' : 'Mínimas, apenas quando necessário'}`
    }

    if (officeStyle?.language_preferences) {
      const { formality, technicality, preferredTerms } = officeStyle.language_preferences
      prompt += `\n\nPREFERÊNCIAS DO ESCRITÓRIO:
- Nível de formalidade: ${formality}/10
- Nível técnico: ${technicality}/10`
      
      if (preferredTerms?.length > 0) {
        prompt += `\n- Termos preferidos: ${preferredTerms.slice(0, 5).join(', ')}`
      }
    }

    return prompt
  }

  private buildFullPrompt(
    data: Record<string, any>,
    schema: PetitionSchema,
    officeStyle: any
  ): string {
    let prompt = `Gere uma ${schema.name} completa com os seguintes dados:\n\n`

    // Add structured data
    Object.entries(schema.fields).forEach(([fieldName, field]) => {
      if (data[fieldName]) {
        prompt += `${field.description || fieldName}: ${JSON.stringify(data[fieldName])}\n`
      }
    })

    prompt += `\n${schema.instructions}`

    return prompt
  }

  private buildChunkPrompt(
    chunk: PetitionChunk,
    schema: PetitionSchema,
    officeStyle: any
  ): string {
    return `Este é o chunk ${chunk.index + 1} de ${chunk.total} da seção "${chunk.section}".

Processe o seguinte conteúdo mantendo a coerência com o estilo jurídico formal:

${chunk.content}

Instruções: ${schema.instructions}

Retorne o texto processado e melhorado para a petição.`
  }

  private calculateConfidenceScore(validation: any, chunks: PetitionChunk[]): number {
    let score = 100

    // Reduce score for validation errors
    score -= validation.errors.length * 5
    score -= validation.warnings.length * 2

    // Reduce score if many chunks (complexity)
    if (chunks.length > 5) {
      score -= (chunks.length - 5) * 2
    }

    return Math.max(0, Math.min(100, score))
  }
}

export const petitionProcessorService = new PetitionProcessorService()