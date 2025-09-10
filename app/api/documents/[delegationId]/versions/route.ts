import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { DocumentService } from '@/lib/services/DocumentService'
import { z } from 'zod'

const createVersionSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  content: z.any(), // TipTap JSON content
  contentText: z.string().min(1, 'Conteúdo não pode estar vazio'),
  comment: z.string().optional(),
  changeSummary: z.string().optional(),
  status: z.enum(['draft', 'submitted']).optional()
})

const updateVersionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.any().optional(),
  contentText: z.string().min(1).optional(),
  comment: z.string().optional(),
  changeSummary: z.string().optional()
})

// GET - Buscar versões de uma delegação
export async function GET(
  request: Request,
  { params }: { params: Promise<{ delegationId: string }> }
) {
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

    const { delegationId } = await params

    // Verificar acesso à delegação
    const { data: delegation, error: delegationError } = await supabase
      .from('delegations')
      .select('id, office_id, provider_id')
      .eq('id', delegationId)
      .single()

    if (delegationError || !delegation) {
      return NextResponse.json(
        { error: 'Delegação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem acesso
    const { data: userData } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single()

    const userOfficeId = userData?.metadata?.organization_id
    const hasAccess = userOfficeId === delegation.office_id || user.id === delegation.provider_id

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Buscar versões
    const documentService = new DocumentService()
    const versions = await documentService.getVersions(delegationId, user.id)

    return NextResponse.json({
      versions,
      total: versions.length
    })
    
  } catch (error: any) {
    console.error('Get document versions error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova versão
export async function POST(
  request: Request,
  { params }: { params: Promise<{ delegationId: string }> }
) {
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

    const { delegationId } = await params

    // Parse e validar dados
    const body = await request.json()
    const { title, content, contentText, comment, changeSummary, status } = createVersionSchema.parse(body)

    // Verificar acesso à delegação
    const { data: delegation, error: delegationError } = await supabase
      .from('delegations')
      .select('id, office_id, provider_id')
      .eq('id', delegationId)
      .single()

    if (delegationError || !delegation) {
      return NextResponse.json(
        { error: 'Delegação não encontrada' },
        { status: 404 }
      )
    }

    // Determinar tipo de usuário e verificar acesso
    let userType: 'office' | 'provider'
    let hasAccess = false

    // Verificar se é prestador
    if (user.id === delegation.provider_id) {
      userType = 'provider'
      hasAccess = true
    } else {
      // Verificar se é membro do escritório
      const { data: userData } = await supabase
        .from('users')
        .select('metadata')
        .eq('id', user.id)
        .single()

      const userOfficeId = userData?.metadata?.organization_id
      if (userOfficeId === delegation.office_id) {
        userType = 'office'
        hasAccess = true
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Criar versão
    const documentService = new DocumentService()
    const result = await documentService.createVersion(user.id, userType!, {
      delegationId,
      title,
      content,
      contentText,
      comment,
      changeSummary,
      status
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Versão criada com sucesso',
      version: result.version
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Create document version error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar versão existente (apenas drafts)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ delegationId: string }> }
) {
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

    const { delegationId } = await params
    const { searchParams } = new URL(request.url)
    const versionId = searchParams.get('versionId')

    if (!versionId) {
      return NextResponse.json(
        { error: 'versionId é obrigatório' },
        { status: 400 }
      )
    }

    // Parse e validar dados
    const body = await request.json()
    const updates = updateVersionSchema.parse(body)

    // Verificar acesso à versão
    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .select(`
        id,
        delegation_id,
        author_id,
        status,
        delegation:delegations(office_id, provider_id)
      `)
      .eq('id', versionId)
      .eq('delegation_id', delegationId)
      .single()

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Versão não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o usuário é o autor
    if (version.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Apenas o autor pode editar a versão' },
        { status: 403 }
      )
    }

    // Verificar se é draft
    if (version.status !== 'draft') {
      return NextResponse.json(
        { error: 'Apenas rascunhos podem ser editados' },
        { status: 400 }
      )
    }

    // Atualizar versão
    const documentService = new DocumentService()
    const result = await documentService.updateVersion(versionId, user.id, updates)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Versão atualizada com sucesso'
    })
    
  } catch (error: any) {
    console.error('Update document version error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


