import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

export interface DocumentUpload {
  file: File
  providerId: string
  documentType: 'oab_certificate' | 'cpf' | 'rg' | 'diploma' | 'cv' | 'profile_photo' | 'portfolio'
  fileName?: string
}

export interface DocumentMetadata {
  id: string
  providerId: string
  documentType: string
  fileName: string
  fileSize: number
  mimeType: string
  fileUrl: string
  isVerified: boolean
  verifiedAt?: string
  verifiedBy?: string
  uploadedAt: string
  metadata?: Record<string, any>
}

export class DocumentStorageService {
  private supabase: any
  private bucketName = 'provider-documents'

  constructor(isClient = false) {
    this.supabase = isClient ? createBrowserClient() : null
  }

  async initializeServerClient() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
  }

  /**
   * Upload documento para Supabase Storage
   */
  async uploadDocument(upload: DocumentUpload): Promise<{
    success: boolean
    documentId?: string
    fileUrl?: string
    error?: string
  }> {
    try {
      if (!this.supabase) {
        await this.initializeServerClient()
      }

      // Gerar nome único do arquivo
      const timestamp = Date.now()
      const fileExtension = upload.file.name.split('.').pop()
      const fileName = upload.fileName || 
        `${upload.providerId}/${upload.documentType}_${timestamp}.${fileExtension}`

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, upload.file, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            providerId: upload.providerId,
            documentType: upload.documentType,
            originalName: upload.file.name,
            uploadedAt: new Date().toISOString()
          }
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return { 
          success: false, 
          error: 'Erro no upload do arquivo' 
        }
      }

      // Obter URL pública
      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName)

      if (!publicUrlData?.publicUrl) {
        return { 
          success: false, 
          error: 'Erro ao gerar URL do arquivo' 
        }
      }

      // Salvar metadados no banco
      const { data: documentData, error: dbError } = await this.supabase
        .from('provider_documents')
        .insert({
          provider_id: upload.providerId,
          document_type: upload.documentType,
          file_name: upload.file.name,
          file_url: publicUrlData.publicUrl,
          file_size: upload.file.size,
          mime_type: upload.file.type,
          is_verified: false,
          metadata: {
            originalName: upload.file.name,
            storagePath: fileName,
            uploadedAt: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database insert error:', dbError)
        
        // Tentar remover arquivo do storage se falhou no banco
        await this.supabase.storage
          .from(this.bucketName)
          .remove([fileName])

        return { 
          success: false, 
          error: 'Erro ao salvar informações do documento' 
        }
      }

      return {
        success: true,
        documentId: documentData.id,
        fileUrl: publicUrlData.publicUrl
      }

    } catch (error: any) {
      console.error('Upload service error:', error)
      return { 
        success: false, 
        error: 'Erro interno no upload' 
      }
    }
  }

  /**
   * Listar documentos de um prestador
   */
  async getProviderDocuments(providerId: string): Promise<DocumentMetadata[]> {
    try {
      if (!this.supabase) {
        await this.initializeServerClient()
      }

      const { data, error } = await this.supabase
        .from('provider_documents')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get documents error:', error)
        return []
      }

      return data.map((doc: any) => ({
        id: doc.id,
        providerId: doc.provider_id,
        documentType: doc.document_type,
        fileName: doc.file_name,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        fileUrl: doc.file_url,
        isVerified: doc.is_verified,
        verifiedAt: doc.verified_at,
        verifiedBy: doc.verified_by,
        uploadedAt: doc.created_at,
        metadata: doc.metadata
      }))

    } catch (error: any) {
      console.error('Get documents service error:', error)
      return []
    }
  }

  /**
   * Deletar documento
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      if (!this.supabase) {
        await this.initializeServerClient()
      }

      // Buscar documento para obter path do storage
      const { data: document, error: fetchError } = await this.supabase
        .from('provider_documents')
        .select('metadata, file_url')
        .eq('id', documentId)
        .single()

      if (fetchError || !document) {
        console.error('Document not found:', fetchError)
        return false
      }

      // Extrair storage path do metadata
      const storagePath = document.metadata?.storagePath
      
      if (storagePath) {
        // Remover do storage
        const { error: storageError } = await this.supabase.storage
          .from(this.bucketName)
          .remove([storagePath])

        if (storageError) {
          console.error('Storage deletion error:', storageError)
        }
      }

      // Remover do banco
      const { error: dbError } = await this.supabase
        .from('provider_documents')
        .delete()
        .eq('id', documentId)

      if (dbError) {
        console.error('Database deletion error:', dbError)
        return false
      }

      return true

    } catch (error: any) {
      console.error('Delete document service error:', error)
      return false
    }
  }

  /**
   * Verificar documento (admin only)
   */
  async verifyDocument(
    documentId: string, 
    verifiedBy: string, 
    isApproved: boolean,
    notes?: string
  ): Promise<boolean> {
    try {
      if (!this.supabase) {
        await this.initializeServerClient()
      }

      const { error } = await this.supabase
        .from('provider_documents')
        .update({
          is_verified: isApproved,
          verified_at: new Date().toISOString(),
          verified_by: verifiedBy,
          metadata: {
            verificationNotes: notes,
            verifiedAt: new Date().toISOString()
          }
        })
        .eq('id', documentId)

      if (error) {
        console.error('Document verification error:', error)
        return false
      }

      return true

    } catch (error: any) {
      console.error('Verify document service error:', error)
      return false
    }
  }

  /**
   * Obter URL de download seguro (com expiração)
   */
  async getSecureDownloadUrl(documentId: string, expiresIn = 3600): Promise<string | null> {
    try {
      if (!this.supabase) {
        await this.initializeServerClient()
      }

      // Buscar documento
      const { data: document, error: fetchError } = await this.supabase
        .from('provider_documents')
        .select('metadata')
        .eq('id', documentId)
        .single()

      if (fetchError || !document) {
        return null
      }

      const storagePath = document.metadata?.storagePath
      if (!storagePath) {
        return null
      }

      // Gerar URL assinada
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, expiresIn)

      if (error) {
        console.error('Signed URL error:', error)
        return null
      }

      return data.signedUrl

    } catch (error: any) {
      console.error('Get secure URL service error:', error)
      return null
    }
  }

  /**
   * Validar tipo e tamanho de arquivo
   */
  validateFile(file: File, documentType: string): { isValid: boolean; error?: string } {
    const validations = {
      oab_certificate: { 
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
      },
      cpf: { 
        maxSize: 3 * 1024 * 1024, // 3MB
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
      },
      rg: { 
        maxSize: 3 * 1024 * 1024, // 3MB
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
      },
      diploma: { 
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
      },
      cv: { 
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['application/pdf']
      },
      profile_photo: { 
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['image/jpeg', 'image/png']
      },
      portfolio: { 
        maxSize: 20 * 1024 * 1024, // 20MB
        allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      }
    }

    const config = validations[documentType as keyof typeof validations]
    if (!config) {
      return { isValid: false, error: 'Tipo de documento não reconhecido' }
    }

    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024)
      return { isValid: false, error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB` }
    }

    if (!config.allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Tipo de arquivo não suportado' }
    }

    return { isValid: true }
  }

  /**
   * Configurar bucket (executar uma vez)
   */
  async setupBucket(): Promise<boolean> {
    try {
      if (!this.supabase) {
        await this.initializeServerClient()
      }

      // Criar bucket se não existir
      const { error: bucketError } = await this.supabase.storage.createBucket(
        this.bucketName,
        {
          public: false, // Documentos são privados
          allowedMimeTypes: [
            'application/pdf',
            'image/jpeg', 
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ],
          fileSizeLimit: 20 * 1024 * 1024 // 20MB max
        }
      )

      if (bucketError && !bucketError.message.includes('already exists')) {
        console.error('Bucket creation error:', bucketError)
        return false
      }

      return true

    } catch (error: any) {
      console.error('Setup bucket service error:', error)
      return false
    }
  }
}


