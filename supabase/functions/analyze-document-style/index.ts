import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as mammoth from 'https://esm.sh/mammoth@1.6.0'
import * as pdfParse from 'https://esm.sh/pdf-parse@1.1.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StyleAnalysisRequest {
  documentUrl?: string
  documentBase64?: string
  documentType: 'pdf' | 'docx' | 'txt'
  officeId: string
  saveAsDefault?: boolean
}

interface DocumentStyleAnalysis {
  typography: {
    fontFamily: string[]
    fontSize: {
      h1: number[]
      h2: number[]
      h3: number[]
      body: number[]
      footer: number[]
    }
    fontWeight: string[]
    lineHeight: number[]
    letterSpacing: number[]
  }
  layout: {
    margins: {
      top: number[]
      bottom: number[]
      left: number[]
      right: number[]
    }
    spacing: {
      paragraph: number[]
      section: number[]
      lineHeight: number[]
    }
    alignment: {
      title: string[]
      subtitle: string[]
      body: string[]
      signature: string[]
    }
    pageFormat: string
  }
  legalStructure: {
    hasHeader: boolean
    hasFooter: boolean
    hasLetterhead: boolean
    sectionPatterns: string[]
    numbering: {
      style: 'numeric' | 'roman' | 'alpha' | 'mixed'
      pattern: string
      depth: number
    }
    citations: {
      style: 'inline' | 'footnote' | 'endnote'
      format: string[]
      frequency: number
    }
  }
  language: {
    formality: number
    complexity: number
    technicality: number
    commonPhrases: string[]
    preferredTerms: string[]
    avoidedTerms: string[]
  }
  letterheadElements: {
    court: string | null
    client: {
      name: string | null
      cpf: string | null
      address: string | null
    }
    office: {
      address: string | null
      lawyers: string[]
      oab: string[]
    }
    defendant: {
      name: string | null
      cnpj: string | null
      address: string | null
    }
  }
  metadata: {
    documentType: string
    confidence: number
    extractedPages: number
    processingTime: number
    errors: string[]
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    
    // Parse request
    const { documentUrl, documentBase64, documentType, officeId, saveAsDefault } = 
      await req.json() as StyleAnalysisRequest

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get document content
    let documentContent: ArrayBuffer
    
    if (documentUrl) {
      const response = await fetch(documentUrl)
      documentContent = await response.arrayBuffer()
    } else if (documentBase64) {
      const binaryString = atob(documentBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      documentContent = bytes.buffer
    } else {
      throw new Error('Document URL or base64 content required')
    }

    // Analyze document based on type
    let analysis: DocumentStyleAnalysis
    
    switch (documentType) {
      case 'docx':
        analysis = await analyzeDocxDocument(documentContent)
        break
      case 'pdf':
        analysis = await analyzePdfDocument(documentContent)
        break
      case 'txt':
        analysis = analyzeTxtDocument(new TextDecoder().decode(documentContent))
        break
      default:
        throw new Error(`Unsupported document type: ${documentType}`)
    }

    // Calculate processing time and confidence
    analysis.metadata.processingTime = Date.now() - startTime
    analysis.metadata.confidence = calculateConfidence(analysis)

    // Save analysis to database
    const { data: analysisRecord, error: analysisError } = await supabaseClient
      .from('style_analyses')
      .insert({
        office_id: officeId,
        document_type: documentType,
        analysis_result: analysis,
        extracted_style: extractStyleFromAnalysis(analysis),
        processing_time_ms: analysis.metadata.processingTime,
        confidence_score: analysis.metadata.confidence,
        status: 'completed'
      })
      .select()
      .single()

    if (analysisError) throw analysisError

    // If requested, save as default office style
    if (saveAsDefault && analysisRecord) {
      const styleData = {
        office_id: officeId,
        name: `Estilo Extraído - ${new Date().toLocaleDateString('pt-BR')}`,
        description: `Estilo extraído automaticamente de documento ${documentType.toUpperCase()}`,
        typography: analysis.typography,
        layout: analysis.layout,
        legal_structure: analysis.legalStructure,
        language_preferences: analysis.language,
        letterhead_elements: analysis.letterheadElements,
        html_template: generateHtmlTemplate(analysis),
        css_styles: generateCssFromAnalysis(analysis),
        confidence_score: analysis.metadata.confidence,
        is_default: true,
        is_active: true
      }

      const { error: styleError } = await supabaseClient
        .from('office_styles')
        .insert(styleData)

      if (styleError) throw styleError
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        analysisId: analysisRecord?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('Error analyzing document:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function analyzeDocxDocument(content: ArrayBuffer): Promise<DocumentStyleAnalysis> {
  const buffer = Buffer.from(content)
  const textResult = await mammoth.extractRawText({ buffer })
  const htmlResult = await mammoth.convertToHtml({ buffer })
  
  const text = textResult.value
  const html = htmlResult.value
  const lines = text.split('\n').filter(line => line.trim())
  
  // Find where main content starts (after letterhead)
  let contentStart = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.match(/(DOS FATOS|DO DIREITO|DA FUNDAMENTAÇÃO|DOS PEDIDOS)/i)) {
      contentStart = i
      break
    }
  }
  
  const headerLines = lines.slice(0, contentStart)
  const headerText = headerLines.join('\n')
  
  return {
    typography: extractTypography(text, html),
    layout: extractLayout(text),
    legalStructure: extractLegalStructure(text),
    language: analyzeLanguage(text),
    letterheadElements: extractLetterheadElements(headerText),
    metadata: {
      documentType: detectDocumentType(text),
      confidence: 0, // Will be calculated later
      extractedPages: 1,
      processingTime: 0, // Will be set later
      errors: []
    }
  }
}

async function analyzePdfDocument(content: ArrayBuffer): Promise<DocumentStyleAnalysis> {
  const buffer = Buffer.from(content)
  const pdfData = await pdfParse(buffer)
  const text = pdfData.text
  
  return {
    typography: extractTypography(text, ''),
    layout: extractLayout(text),
    legalStructure: extractLegalStructure(text),
    language: analyzeLanguage(text),
    letterheadElements: extractLetterheadElements(text),
    metadata: {
      documentType: detectDocumentType(text),
      confidence: 0,
      extractedPages: pdfData.numpages || 1,
      processingTime: 0,
      errors: []
    }
  }
}

function analyzeTxtDocument(text: string): DocumentStyleAnalysis {
  return {
    typography: extractTypography(text, ''),
    layout: extractLayout(text),
    legalStructure: extractLegalStructure(text),
    language: analyzeLanguage(text),
    letterheadElements: extractLetterheadElements(text),
    metadata: {
      documentType: detectDocumentType(text),
      confidence: 0,
      extractedPages: 1,
      processingTime: 0,
      errors: []
    }
  }
}

function extractTypography(text: string, html: string): DocumentStyleAnalysis['typography'] {
  const lines = text.split('\n')
  
  // Detect title patterns
  const titleLines = lines.filter(line => 
    line.trim() === line.trim().toUpperCase() && 
    line.trim().length > 0 && 
    line.trim().length < 100
  )
  
  // Extract font information from HTML if available
  const fontFamilies = html.match(/font-family:\s*([^;]+)/g)?.map(m => 
    m.replace('font-family:', '').trim()
  ) || ['Times New Roman', 'Arial']
  
  return {
    fontFamily: [...new Set(fontFamilies)],
    fontSize: {
      h1: [16, 18],
      h2: [14, 16],
      h3: [13, 14],
      body: [12],
      footer: [10]
    },
    fontWeight: ['normal', 'bold'],
    lineHeight: [1.15, 1.2, 1.5],
    letterSpacing: [0, 0.5]
  }
}

function extractLayout(text: string): DocumentStyleAnalysis['layout'] {
  const lines = text.split('\n')
  const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length
  
  // Infer margins based on line length
  const margins = avgLineLength < 60 
    ? { top: [3.5], bottom: [3.5], left: [4.0], right: [3.0] }
    : avgLineLength > 80
    ? { top: [2.0], bottom: [2.0], left: [2.5], right: [2.0] }
    : { top: [2.5], bottom: [2.5], left: [3.0], right: [2.5] }
  
  return {
    margins,
    spacing: {
      paragraph: [8, 10, 12],
      section: [16, 18, 20],
      lineHeight: [1.15, 1.2, 1.5]
    },
    alignment: {
      title: ['center'],
      subtitle: ['left'],
      body: ['justify'],
      signature: ['right']
    },
    pageFormat: 'A4'
  }
}

function extractLegalStructure(text: string): DocumentStyleAnalysis['legalStructure'] {
  const upperText = text.toUpperCase()
  
  // Detect legal sections
  const sectionPatterns = []
  const legalSections = [
    'DOS FATOS', 'DO DIREITO', 'DOS PEDIDOS', 'DAS PROVAS',
    'DA FUNDAMENTAÇÃO', 'DA CONCLUSÃO', 'DA LIQUIDAÇÃO'
  ]
  
  legalSections.forEach(section => {
    if (upperText.includes(section)) {
      sectionPatterns.push(section.toLowerCase().replace(/\s+/g, '_'))
    }
  })
  
  // Detect numbering style
  const hasRoman = /\b[IVX]{1,4}\s*[-.]/.test(text)
  const hasNumeric = /^\s*\d+\.\d*/.test(text)
  const hasAlpha = /^\s*[a-z]\)/.test(text)
  
  let numberingStyle: 'numeric' | 'roman' | 'alpha' | 'mixed' = 'numeric'
  if (hasRoman && hasNumeric) numberingStyle = 'mixed'
  else if (hasRoman) numberingStyle = 'roman'
  else if (hasAlpha) numberingStyle = 'alpha'
  
  // Detect citations
  const citations = []
  const citationPatterns = [
    /STF[,\s]+\w+/g,
    /STJ[,\s]+\w+/g,
    /Lei\s+(?:nº\s+)?\d+\.?\d*\/\d+/g,
    /[Aa]rt(?:igo)?\.?\s+\d+/g
  ]
  
  citationPatterns.forEach(pattern => {
    const matches = text.match(pattern) || []
    citations.push(...matches)
  })
  
  return {
    hasHeader: /EXCELENTÍSSIMO|TRIBUNAL|JUIZ/i.test(text.slice(0, 500)),
    hasFooter: /OAB|Advogad/i.test(text.slice(-500)),
    hasLetterhead: /ADVOCACIA|ESCRITÓRIO/i.test(text.slice(0, 1000)),
    sectionPatterns,
    numbering: {
      style: numberingStyle,
      pattern: '1.',
      depth: 3
    },
    citations: {
      style: 'inline',
      format: [...new Set(citations)].slice(0, 10),
      frequency: citations.length
    }
  }
}

function analyzeLanguage(text: string): DocumentStyleAnalysis['language'] {
  const words = text.toLowerCase().split(/\s+/)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim())
  
  // Legal formal terms
  const formalTerms = [
    'outrossim', 'destarte', 'mormente', 'porquanto', 'consoante',
    'preleciona', 'colenda', 'egrégio', 'ínclito', 'preclaro'
  ]
  
  const technicalTerms = [
    'jurisdição', 'competência', 'litispendência', 'coisa julgada',
    'prescrição', 'decadência', 'preclusão', 'sucumbência'
  ]
  
  const commonPhrases = []
  const legalPhrases = [
    'nestes termos', 'pede deferimento', 'com efeito', 'destarte',
    'imperioso reconhecer', 'resta evidenciado', 'outrossim'
  ]
  
  const lowerText = text.toLowerCase()
  legalPhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      commonPhrases.push(phrase)
    }
  })
  
  // Calculate scores
  const formalCount = words.filter(word => formalTerms.includes(word)).length
  const technicalCount = words.filter(word => technicalTerms.includes(word)).length
  
  const avgWordsPerSentence = sentences.reduce((sum, sentence) => 
    sum + sentence.trim().split(/\s+/).length, 0
  ) / sentences.length
  
  const formality = Math.min(100, (formalCount / words.length) * 1000)
  const technicality = Math.min(100, (technicalCount / words.length) * 500)
  const complexity = avgWordsPerSentence > 25 ? 90 : 
                     avgWordsPerSentence > 20 ? 75 : 
                     avgWordsPerSentence > 15 ? 60 : 45
  
  // Extract most common terms
  const wordCount: Record<string, number> = {}
  words.forEach(word => {
    if (word.length > 4) {
      wordCount[word] = (wordCount[word] || 0) + 1
    }
  })
  
  const preferredTerms = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word)
  
  return {
    formality,
    complexity,
    technicality,
    commonPhrases,
    preferredTerms,
    avoidedTerms: []
  }
}

function extractLetterheadElements(headerText: string): DocumentStyleAnalysis['letterheadElements'] {
  const elements = {
    court: null as string | null,
    client: {
      name: null as string | null,
      cpf: null as string | null,
      address: null as string | null
    },
    office: {
      address: null as string | null,
      lawyers: [] as string[],
      oab: [] as string[]
    },
    defendant: {
      name: null as string | null,
      cnpj: null as string | null,
      address: null as string | null
    }
  }
  
  // Extract court
  const courtMatch = headerText.match(/(EXMO\.?\s+SR\.?\s+DR\.?\s+JUIZ[^.]*)/i)
  if (courtMatch) {
    elements.court = courtMatch[1].trim()
  }
  
  // Extract client info
  const clientMatch = headerText.match(/([A-Z\s]+),\s+brasileiro[^,]*,.*?(?=vem,|propor)/is)
  if (clientMatch) {
    elements.client.name = clientMatch[1].split(',')[0].trim()
  }
  
  // Extract CPF
  const cpfMatch = headerText.match(/CPF[)\s]*(?:sob o número\s*)?(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/i)
  if (cpfMatch) {
    elements.client.cpf = cpfMatch[1]
  }
  
  // Extract office address
  const officeMatch = headerText.match(/escritório profissional.*?(?=onde|propor)/is)
  if (officeMatch) {
    elements.office.address = officeMatch[0].trim()
  }
  
  // Extract OAB numbers
  const oabMatches = headerText.match(/OAB\/\w{2}\s*\d+/g) || []
  elements.office.oab = oabMatches
  
  // Extract defendant
  const defendantMatch = headerText.match(/em desfavor de\s+([^,]+),/i)
  if (defendantMatch) {
    elements.defendant.name = defendantMatch[1].trim()
  }
  
  // Extract CNPJ
  const cnpjMatch = headerText.match(/CNPJ[)\s]*(?:sob o número\s*)?(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i)
  if (cnpjMatch) {
    elements.defendant.cnpj = cnpjMatch[1]
  }
  
  return elements
}

function detectDocumentType(text: string): string {
  const upperText = text.toUpperCase()
  
  if (upperText.includes('PETIÇÃO INICIAL')) return 'peticao_inicial'
  if (upperText.includes('CONTESTAÇÃO')) return 'contestacao'
  if (upperText.includes('RECURSO')) return 'recurso'
  if (upperText.includes('AGRAVO')) return 'agravo'
  if (upperText.includes('APELAÇÃO')) return 'apelacao'
  if (upperText.includes('MANDADO DE SEGURANÇA')) return 'mandado_seguranca'
  if (upperText.includes('HABEAS CORPUS')) return 'habeas_corpus'
  if (upperText.includes('RECLAMAÇÃO TRABALHISTA')) return 'reclamacao_trabalhista'
  
  return 'documento_juridico'
}

function calculateConfidence(analysis: DocumentStyleAnalysis): number {
  let confidence = 0
  
  // Typography confidence
  if (analysis.typography.fontFamily.length > 0) confidence += 15
  if (analysis.typography.fontSize.body.length > 0) confidence += 10
  
  // Layout confidence
  if (analysis.layout.margins.top.length > 0) confidence += 10
  if (analysis.layout.pageFormat) confidence += 5
  
  // Legal structure confidence
  if (analysis.legalStructure.sectionPatterns.length > 0) confidence += 20
  if (analysis.legalStructure.citations.frequency > 0) confidence += 15
  
  // Language confidence
  if (analysis.language.commonPhrases.length > 0) confidence += 15
  if (analysis.language.preferredTerms.length > 5) confidence += 10
  
  return Math.min(100, confidence)
}

function extractStyleFromAnalysis(analysis: DocumentStyleAnalysis): any {
  return {
    typography: analysis.typography,
    layout: analysis.layout,
    legalStructure: analysis.legalStructure,
    language: analysis.language,
    letterheadElements: analysis.letterheadElements
  }
}

function generateHtmlTemplate(analysis: DocumentStyleAnalysis): string {
  const { letterheadElements } = analysis
  
  return `
<div class="freelaw-document">
  ${letterheadElements.court ? `
  <div class="freelaw-court-header">
    {{COURT}}
  </div>
  ` : ''}
  
  <div class="freelaw-parties">
    <span class="freelaw-client-name">{{CLIENT_NAME}}</span>, 
    {{CLIENT_QUALIFICATION}}, 
    vem, respeitosamente, perante V. Exa., 
    ${letterheadElements.office.address ? 'por intermédio de seus procuradores infra-assinados,' : ''}
    propor a presente <strong>{{DOCUMENT_TYPE}}</strong> 
    em desfavor de <strong>{{DEFENDANT_NAME}}</strong>, 
    o que faz pelos fatos e fundamentos que se seguem:
  </div>
  
  <div class="freelaw-content">
    {{CONTENT}}
  </div>
  
  <div class="freelaw-footer">
    <p>Nestes termos,</p>
    <p>Pede deferimento.</p>
    <br>
    <p>{{LOCATION}}, {{DATE}}</p>
    <br>
    <p>_________________________</p>
    <p>{{LAWYER_NAME}}</p>
    <p>{{LAWYER_OAB}}</p>
  </div>
</div>`
}

function generateCssFromAnalysis(analysis: DocumentStyleAnalysis): string {
  const { typography, layout } = analysis
  
  const bodyFontSize = typography.fontSize.body[0] || 12
  const titleFontSize = typography.fontSize.h1[0] || 16
  const topMargin = layout.margins.top[0] || 2.5
  const leftMargin = layout.margins.left[0] || 3.0
  
  return `
.freelaw-document {
  font-family: ${typography.fontFamily[0] || 'Times New Roman'}, serif;
  font-size: ${bodyFontSize}pt;
  line-height: ${typography.lineHeight[0] || 1.5};
  margin: ${topMargin}cm ${layout.margins.right[0] || 2.5}cm ${layout.margins.bottom[0] || 2.5}cm ${leftMargin}cm;
  text-align: ${layout.alignment.body[0] || 'justify'};
}

.freelaw-court-header {
  text-align: ${layout.alignment.title[0] || 'center'};
  font-weight: bold;
  font-size: ${titleFontSize}pt;
  margin-bottom: 3cm;
  line-height: 1.2;
}

.freelaw-parties {
  text-align: justify;
  margin-bottom: 2cm;
  text-indent: 2cm;
}

.freelaw-client-name {
  font-weight: bold;
  text-transform: uppercase;
}

.freelaw-content {
  margin: 1cm 0;
}

.freelaw-content h2 {
  font-size: ${typography.fontSize.h2[0] || 14}pt;
  font-weight: bold;
  text-align: center;
  margin: 1cm 0 0.5cm 0;
}

.freelaw-content h3 {
  font-size: ${typography.fontSize.h3[0] || 13}pt;
  font-weight: bold;
  margin: 0.5cm 0;
}

.freelaw-content p {
  margin-bottom: ${layout.spacing.paragraph[0] || 10}pt;
  text-indent: 1.25cm;
}

.freelaw-footer {
  text-align: ${layout.alignment.signature[0] || 'right'};
  margin-top: 3cm;
  font-size: ${typography.fontSize.footer[0] || 10}pt;
}

.freelaw-footer p {
  margin: 0.25cm 0;
  text-indent: 0;
}

@media print {
  .freelaw-document {
    page-break-inside: avoid;
  }
  
  .freelaw-content h2 {
    page-break-after: avoid;
  }
}`
}