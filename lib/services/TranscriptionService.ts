import OpenAI from 'openai'

export interface TranscriptionResult {
  text: string
  language: string
  confidence: number
  segments?: {
    start: number
    end: number
    text: string
  }[]
}

export interface TranscriptionOptions {
  language?: string // 'pt', 'en', 'auto'
  model?: 'whisper-1'
  prompt?: string // contexto para melhorar precisão
  temperature?: number // 0-1, criatividade vs precisão
  response_format?: 'json' | 'text' | 'verbose_json'
}

export class TranscriptionService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  /**
   * Transcrever áudio usando OpenAI Whisper
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    fileName: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    try {
      const {
        language = 'pt',
        model = 'whisper-1',
        prompt = 'Transcrição de conversa jurídica em português brasileiro. Inclui termos técnicos do direito.',
        temperature = 0.1, // Baixa temperatura para maior precisão
        response_format = 'verbose_json'
      } = options

      // Criar arquivo temporário para o Whisper
      const file = new File([audioBuffer as any], fileName, {
        type: 'audio/webm'
      })

      const transcription = await this.openai.audio.transcriptions.create({
        file: file,
        model: model,
        language: language === 'auto' ? undefined : language,
        prompt: prompt,
        temperature: temperature,
        response_format: response_format as any
      })

      // Processar resposta baseado no formato
      if (response_format === 'verbose_json') {
        const verboseResult = transcription as any
        
        return {
          text: verboseResult.text || '',
          language: verboseResult.language || language,
          confidence: this.calculateConfidence(verboseResult),
          segments: verboseResult.segments?.map((segment: any) => ({
            start: segment.start,
            end: segment.end,
            text: segment.text
          }))
        }
      } else {
        // Formato text ou json simples
        const text = typeof transcription === 'string' 
          ? transcription 
          : (transcription as any).text || ''

        return {
          text,
          language: language === 'auto' ? 'pt' : language,
          confidence: 0.8, // Estimativa padrão
          segments: []
        }
      }

    } catch (error: any) {
      console.error('Transcription error:', error)
      
      // Retornar erro amigável
      if (error.code === 'audio_too_long') {
        throw new Error('Áudio muito longo para transcrição (máx. 25MB)')
      } else if (error.code === 'invalid_audio') {
        throw new Error('Formato de áudio inválido')
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error('Limite de transcrições excedido, tente novamente em alguns minutos')
      } else {
        throw new Error('Erro na transcrição do áudio')
      }
    }
  }

  /**
   * Calcular confiança da transcrição baseado em métricas
   */
  private calculateConfidence(verboseResult: any): number {
    if (!verboseResult.segments || verboseResult.segments.length === 0) {
      return 0.5
    }

    // Calcular média de confiança dos segmentos (se disponível)
    const segments = verboseResult.segments
    let totalConfidence = 0
    let confidenceCount = 0

    for (const segment of segments) {
      if (segment.avg_logprob !== undefined) {
        // Converter log probability para 0-1
        const confidence = Math.exp(segment.avg_logprob)
        totalConfidence += confidence
        confidenceCount++
      }
    }

    if (confidenceCount > 0) {
      return Math.min(Math.max(totalConfidence / confidenceCount, 0), 1)
    }

    // Heurísticas baseadas no texto
    const text = verboseResult.text || ''
    let confidence = 0.5

    // Texto mais longo geralmente = maior confiança
    if (text.length > 50) confidence += 0.1
    if (text.length > 100) confidence += 0.1

    // Presença de pontuação = maior confiança
    if (/[.!?]/.test(text)) confidence += 0.1

    // Palavras jurídicas comuns = contexto relevante
    const legalTerms = [
      'processo', 'petição', 'recurso', 'sentença', 'decisão',
      'tribunal', 'juiz', 'advogado', 'cliente', 'prazo',
      'artigo', 'lei', 'código', 'jurisprudência', 'precedente'
    ]
    
    const hasLegalTerms = legalTerms.some(term => 
      text.toLowerCase().includes(term)
    )
    if (hasLegalTerms) confidence += 0.15

    return Math.min(Math.max(confidence, 0.1), 0.95)
  }

  /**
   * Detectar idioma do áudio
   */
  async detectLanguage(
    audioBuffer: Buffer,
    fileName: string
  ): Promise<string> {
    try {
      // Usar transcrição com detecção automática
      const result = await this.transcribeAudio(audioBuffer, fileName, {
        language: 'auto',
        response_format: 'verbose_json'
      })

      return result.language
    } catch (error) {
      console.error('Language detection error:', error)
      return 'pt' // Fallback para português
    }
  }

  /**
   * Melhorar transcrição com contexto jurídico
   */
  async transcribeWithLegalContext(
    audioBuffer: Buffer,
    fileName: string,
    contextualPrompt?: string
  ): Promise<TranscriptionResult> {
    const legalPrompt = `
Transcrição de conversa jurídica em português brasileiro. 
Contexto: Comunicação entre escritório de advocacia e prestador de serviços jurídicos.
Termos esperados: petições, recursos, tribunais, processos, clientes, prazos, artigos de lei.
${contextualPrompt ? `Contexto adicional: ${contextualPrompt}` : ''}
`.trim()

    return this.transcribeAudio(audioBuffer, fileName, {
      language: 'pt',
      prompt: legalPrompt,
      temperature: 0.05, // Máxima precisão para contexto jurídico
      response_format: 'verbose_json'
    })
  }

  /**
   * Validar qualidade da transcrição
   */
  validateTranscription(result: TranscriptionResult): {
    isValid: boolean
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []

    // Verificar se o texto está vazio ou muito curto
    if (!result.text || result.text.trim().length < 3) {
      issues.push('Texto muito curto ou vazio')
      suggestions.push('Verifique se o áudio tem conteúdo audível')
    }

    // Verificar confiança baixa
    if (result.confidence < 0.5) {
      issues.push('Baixa confiança na transcrição')
      suggestions.push('Áudio pode ter ruído ou baixa qualidade')
    }

    // Verificar texto repetitivo (possível erro)
    const words = result.text.split(' ')
    const uniqueWords = new Set(words)
    if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
      issues.push('Texto muito repetitivo')
      suggestions.push('Possível erro na transcrição, revisar áudio')
    }

    // Verificar se contém apenas caracteres especiais
    if (/^[^a-zA-ZÀ-ÿ0-9\s]*$/.test(result.text)) {
      issues.push('Texto contém apenas caracteres especiais')
      suggestions.push('Áudio pode não conter fala reconhecível')
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    }
  }

  /**
   * Formatar transcrição para exibição
   */
  formatTranscription(result: TranscriptionResult): string {
    let formatted = result.text.trim()

    // Capitalizar primeira letra de frases
    formatted = formatted.replace(/(^|\. )[a-z]/g, (match) => match.toUpperCase())

    // Adicionar pontuação final se não houver
    if (!/[.!?]$/.test(formatted)) {
      formatted += '.'
    }

    return formatted
  }

  /**
   * Gerar resumo da transcrição
   */
  generateSummary(result: TranscriptionResult): {
    wordCount: number
    duration: number
    keyTopics: string[]
    sentiment: 'positive' | 'neutral' | 'negative'
  } {
    const text = result.text
    const words = text.split(/\s+/).filter(word => word.length > 0)
    
    // Calcular duração estimada (baseado em segmentos se disponível)
    let duration = 0
    if (result.segments && result.segments.length > 0) {
      const lastSegment = result.segments[result.segments.length - 1]
      duration = lastSegment.end
    } else {
      // Estimativa: ~150 palavras por minuto
      duration = (words.length / 150) * 60
    }

    // Identificar tópicos jurídicos
    const legalKeywords = {
      'processo': ['processo', 'processual', 'autos'],
      'petição': ['petição', 'inicial', 'contestação'],
      'recurso': ['recurso', 'apelação', 'agravo'],
      'tribunal': ['tribunal', 'juiz', 'vara', 'instância'],
      'prazo': ['prazo', 'urgente', 'deadline'],
      'cliente': ['cliente', 'requerente', 'parte']
    }

    const keyTopics: string[] = []
    for (const [topic, keywords] of Object.entries(legalKeywords)) {
      if (keywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      )) {
        keyTopics.push(topic)
      }
    }

    // Análise simples de sentiment
    const positiveWords = ['aprovado', 'sucesso', 'correto', 'bom', 'excelente']
    const negativeWords = ['rejeitado', 'erro', 'problema', 'urgente', 'dificuldade']
    
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (text.toLowerCase().split(word).length - 1), 0
    )
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (text.toLowerCase().split(word).length - 1), 0
    )

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
    if (positiveCount > negativeCount) sentiment = 'positive'
    else if (negativeCount > positiveCount) sentiment = 'negative'

    return {
      wordCount: words.length,
      duration: Math.round(duration),
      keyTopics,
      sentiment
    }
  }
}


