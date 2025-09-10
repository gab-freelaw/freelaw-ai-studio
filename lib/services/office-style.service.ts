import { createClient } from '@/lib/supabase/client'

export interface Letterhead {
  id: string
  office_id: string
  style_id?: string
  name: string
  description?: string
  html_template: string
  css_styles: string
  logo_url?: string
  header_html?: string
  footer_html?: string
  extracted_from_document?: string
  extracted_fonts?: string[]
  extracted_colors?: string[]
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface DocumentStyleAnalysis {
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
  extractedLetterhead?: {
    header: string
    footer: string
    logoBase64?: string
  }
  metadata: {
    documentType: string
    confidence: number
    extractedPages: number
    processingTime: number
    errors: string[]
  }
}

export interface OfficeStyle {
  id: string
  office_id: string
  name: string
  description?: string
  is_active: boolean
  is_default: boolean
  typography: DocumentStyleAnalysis['typography']
  layout: DocumentStyleAnalysis['layout']
  legal_structure: DocumentStyleAnalysis['legalStructure']
  language_preferences: DocumentStyleAnalysis['language']
  letterhead_elements: DocumentStyleAnalysis['letterheadElements']
  html_template?: string
  css_styles?: string
  confidence_score: number
  created_at: string
  updated_at: string
}

export interface StyleAnalysis {
  id: string
  office_id: string
  document_name?: string
  document_type: string
  analysis_result: DocumentStyleAnalysis
  extracted_style?: any
  processing_time_ms: number
  confidence_score: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'applied'
  error_message?: string
  applied_as_style_id?: string
  created_at: string
}

class OfficeStyleService {
  private getSupabase() {
    return createClient()
  }
  /**
   * Analyze a document to extract its style
   */
  async analyzeDocument(
    file: File,
    officeId: string,
    saveAsDefault = false,
    extractLetterhead = true
  ): Promise<{ analysis: DocumentStyleAnalysis; analysisId: string; letterheadId?: string }> {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file)
      const documentType = this.getDocumentType(file)

      // Call local API instead of Edge Function
      const response = await fetch('/api/office-style/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentBase64: base64,
          documentType,
          officeId,
          saveAsDefault,
          extractLetterhead
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze document')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed')
      }

      return {
        analysis: data.analysis,
        analysisId: data.analysisId,
        letterheadId: data.letterheadId
      }
    } catch (error) {
      console.error('Error analyzing document:', error)
      throw error
    }
  }

  /**
   * Get all styles for an office
   */
  async getOfficeStyles(officeId: string): Promise<OfficeStyle[]> {
    const { data, error } = await this.getSupabase()
      .from('office_styles')
      .select('*')
      .eq('office_id', officeId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get the default style for an office
   */
  async getDefaultStyle(officeId: string): Promise<OfficeStyle | null> {
    const { data, error } = await this.getSupabase()
      .from('office_styles')
      .select('*')
      .eq('office_id', officeId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  /**
   * Create a new office style
   */
  async createStyle(style: Partial<OfficeStyle>): Promise<OfficeStyle> {
    const { data, error } = await this.getSupabase()
      .from('office_styles')
      .insert(style)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update an existing style
   */
  async updateStyle(
    styleId: string,
    updates: Partial<OfficeStyle>
  ): Promise<OfficeStyle> {
    const { data, error } = await this.getSupabase()
      .from('office_styles')
      .update(updates)
      .eq('id', styleId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Set a style as default for an office
   */
  async setDefaultStyle(styleId: string, officeId: string): Promise<void> {
    // First, unset all other defaults
    await this.getSupabase()
      .from('office_styles')
      .update({ is_default: false })
      .eq('office_id', officeId)

    // Then set the new default
    const { error } = await this.getSupabase()
      .from('office_styles')
      .update({ is_default: true })
      .eq('id', styleId)

    if (error) throw error
  }

  /**
   * Delete a style
   */
  async deleteStyle(styleId: string): Promise<void> {
    const { error } = await this.getSupabase()
      .from('office_styles')
      .update({ is_active: false })
      .eq('id', styleId)

    if (error) throw error
  }

  /**
   * Get style analysis history
   */
  async getAnalysisHistory(officeId: string): Promise<StyleAnalysis[]> {
    const { data, error } = await this.getSupabase()
      .from('style_analyses')
      .select('*')
      .eq('office_id', officeId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data || []
  }

  /**
   * Apply a style to a document
   */
  applyStyleToDocument(
    content: string,
    style: OfficeStyle,
    variables: Record<string, string> = {}
  ): { html: string; css: string } {
    // Replace variables in HTML template
    let html = style.html_template || this.generateDefaultTemplate(content)
    
    // Replace content placeholder
    html = html.replace('{{CONTENT}}', content)
    
    // Replace other variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      html = html.replace(regex, value)
    })

    return {
      html,
      css: style.css_styles || this.generateDefaultCSS(style)
    }
  }

  /**
   * Generate CSS from style analysis
   */
  generateCSSFromStyle(style: OfficeStyle): string {
    const { typography, layout } = style
    
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

.freelaw-document h1 {
  font-size: ${titleFontSize}pt;
  font-weight: bold;
  text-align: ${layout.alignment.title[0] || 'center'};
  margin-bottom: 1cm;
}

.freelaw-document h2 {
  font-size: ${typography.fontSize.h2[0] || 14}pt;
  font-weight: bold;
  text-align: ${layout.alignment.subtitle[0] || 'left'};
  margin: 1cm 0 0.5cm 0;
}

.freelaw-document p {
  margin-bottom: ${layout.spacing.paragraph[0] || 10}pt;
  text-indent: 1.25cm;
}

.freelaw-signature {
  text-align: ${layout.alignment.signature[0] || 'right'};
  margin-top: 3cm;
}
`
  }

  // Private helper methods
  
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result as string
        // Remove data URL prefix
        const base64Content = base64.split(',')[1]
        resolve(base64Content)
      }
      reader.onerror = reject
    })
  }

  private getDocumentType(file: File): 'pdf' | 'docx' | 'txt' {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return 'pdf'
      case 'docx':
      case 'doc':
        return 'docx'
      case 'txt':
        return 'txt'
      default:
        throw new Error(`Unsupported file type: ${extension}`)
    }
  }

  private generateDefaultTemplate(content: string): string {
    return `
<div class="freelaw-document">
  <div class="freelaw-content">
    ${content}
  </div>
</div>`
  }

  private generateDefaultCSS(style: OfficeStyle): string {
    return this.generateCSSFromStyle(style)
  }

  /**
   * Save extracted letterhead
   */
  async saveLetterhead(letterhead: Partial<Letterhead>): Promise<Letterhead> {
    const { data, error } = await this.getSupabase()
      .from('letterheads')
      .insert(letterhead)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get letterheads for an office
   */
  async getLetterheads(officeId: string): Promise<Letterhead[]> {
    const { data, error } = await this.getSupabase()
      .from('letterheads')
      .select('*')
      .eq('office_id', officeId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get default letterhead for an office
   */
  async getDefaultLetterhead(officeId: string): Promise<Letterhead | null> {
    const { data, error } = await this.getSupabase()
      .from('letterheads')
      .select('*')
      .eq('office_id', officeId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  /**
   * Apply letterhead to a document
   */
  applyLetterheadToDocument(
    content: string,
    letterhead: Letterhead,
    variables: Record<string, string> = {}
  ): { html: string; css: string } {
    let html = letterhead.html_template
    
    // Replace content placeholder
    html = html.replace('{{CONTENT}}', content)
    
    // Replace other variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      html = html.replace(regex, value)
    })

    return {
      html,
      css: letterhead.css_styles
    }
  }
}

export const officeStyleService = new OfficeStyleService()