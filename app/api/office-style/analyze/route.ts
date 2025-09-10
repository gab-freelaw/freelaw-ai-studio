import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { fileName, fileType, content } = await request.json()

    // Análise simplificada para demonstração
    // Em produção, implementaríamos análise completa de PDF/DOCX
    const analysis = {
      documentInfo: {
        fileName,
        fileType,
        pageCount: 1,
        createdAt: new Date().toISOString()
      },
      styleInfo: {
        fonts: ['Times New Roman', 'Arial', 'Calibri'],
        averageFontSize: 12,
        margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
        lineSpacing: 1.5,
        alignment: 'justify'
      },
      contentAnalysis: {
        wordCount: 1000,
        paragraphCount: 15,
        hasHeaders: true,
        hasFooters: true,
        hasNumberedLists: true,
        hasBulletPoints: true
      },
      patterns: {
        timbrePattern: 'EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO',
        closingPattern: 'Nestes termos, pede deferimento.',
        signaturePattern: 'Advogado(a)\nOAB/UF'
      },
      confidence: 0.85
    }

    // Salvar análise no banco de dados
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('document_analyses')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_type: fileType,
        analysis_data: analysis,
        confidence_score: analysis.confidence,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar análise:', saveError)
      // Continuar mesmo se não conseguir salvar
    }

    return NextResponse.json({
      success: true,
      analysis,
      analysisId: savedAnalysis?.id
    })

  } catch (error: any) {
    console.error('Erro na análise de documento:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message 
      },
      { status: 500 }
    )
  }
}




