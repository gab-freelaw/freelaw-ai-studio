import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { DocumentStorageService } from '@/lib/services/DocumentStorageService'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_DOCUMENT_TYPES = [
  'oab_certificate',
  'cpf', 
  'rg',
  'diploma',
  'cv',
  'profile_photo',
  'portfolio'
]

export async function POST(request: Request) {
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

    // Verificar se é um prestador
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id, status')
      .eq('email', user.email)
      .single()
    
    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'Prestador não encontrado' },
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      )
    }

    if (!documentType || !ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        { error: 'Tipo de documento inválido' },
        { status: 400 }
      )
    }

    // Validar arquivo
    const storageService = new DocumentStorageService()
    const validation = storageService.validateFile(file, documentType)
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Verificar se já existe documento deste tipo
    const existingDocuments = await storageService.getProviderDocuments(provider.id)
    const existingDocument = existingDocuments.find(doc => doc.documentType === documentType)
    
    if (existingDocument) {
      // Deletar documento anterior
      await storageService.deleteDocument(existingDocument.id)
    }

    // Upload documento
    const uploadResult = await storageService.uploadDocument({
      file,
      providerId: provider.id,
      documentType: documentType as any
    })

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Erro no upload' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Documento enviado com sucesso',
      document: {
        id: uploadResult.documentId,
        type: documentType,
        fileName: file.name,
        fileSize: file.size,
        fileUrl: uploadResult.fileUrl,
        status: 'uploaded'
      }
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Listar documentos do prestador
export async function GET(request: Request) {
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

    // Verificar se é um prestador
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'Prestador não encontrado' },
        { status: 404 }
      )
    }

    // Buscar documentos
    const storageService = new DocumentStorageService()
    const documents = await storageService.getProviderDocuments(provider.id)

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        type: doc.documentType,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        isVerified: doc.isVerified,
        uploadedAt: doc.uploadedAt,
        verifiedAt: doc.verifiedAt
      }))
    })
    
  } catch (error: any) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar documento
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'ID do documento é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o documento pertence ao prestador
    const { data: document, error: docError } = await supabase
      .from('provider_documents')
      .select('provider_id')
      .eq('id', documentId)
      .single()
    
    if (docError || !document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se é o prestador correto
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (providerError || !provider || provider.id !== document.provider_id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Deletar documento
    const storageService = new DocumentStorageService()
    const success = await storageService.deleteDocument(documentId)

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao deletar documento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Documento deletado com sucesso'
    })
    
  } catch (error: any) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


