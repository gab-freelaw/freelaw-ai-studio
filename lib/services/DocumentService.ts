import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
// import { ChatService } from './ChatService' // Commented out to fix circular dependency

export interface DocumentVersion {
  id: string
  delegationId: string
  versionNumber: number
  title: string
  content: any // TipTap JSON content
  contentText: string
  authorId: string
  authorName: string
  authorType: 'office' | 'provider'
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  comment?: string
  changeSummary?: string
  fileUrl?: string
  wordCount: number
  charCount: number
  isCurrent: boolean
  createdAt: string
  updatedAt: string
}

export interface DocumentComment {
  id: string
  documentVersionId: string
  authorId: string
  authorName: string
  authorType: 'office' | 'provider'
  content: string
  selectionStart?: number
  selectionEnd?: number
  selectedText?: string
  isResolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateVersionData {
  delegationId: string
  title: string
  content: any
  contentText: string
  comment?: string
  changeSummary?: string
  status?: 'draft' | 'submitted'
}

export interface CreateCommentData {
  documentVersionId: string
  content: string
  selectionStart?: number
  selectionEnd?: number
  selectedText?: string
}

export class DocumentService {
  private supabase: any
  private isClient: boolean
  private chatService: any

  constructor(isClient = false) {
    this.isClient = isClient
    // this.chatService = new ChatService(isClient) // Temporariamente desabilitado
    if (isClient) {
      this.supabase = createBrowserClient()
    }
  }

  async initializeSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
  }

  /**
   * Criar nova versão do documento
   */
  async createVersion(
    authorId: string,
    authorType: 'office' | 'provider',
    data: CreateVersionData
  ): Promise<{
    success: boolean
    versionId?: string
    version?: DocumentVersion
    error?: string
  }> {
    try {
      if (!this.isClient) {
        await this.initializeSupabase()
      }

      // Verificar acesso à delegação
      const { data: delegation, error: delegationError } = await this.supabase
        .from('delegations')
        .select('id, office_id, provider_id, title')
        .eq('id', data.delegationId)
        .single()

      if (delegationError || !delegation) {
        return {
          success: false,
          error: 'Delegação não encontrada'
        }
      }

      // Verificar permissões
      if (authorType === 'provider' && delegation.provider_id !== authorId) {
        return {
          success: false,
          error: 'Acesso negado'
        }
      }

      if (authorType === 'office') {
        const { data: user } = await this.supabase
          .from('users')
          .select('metadata')
          .eq('id', authorId)
          .single()

        if (!user || user.metadata?.organization_id !== delegation.office_id) {
          return {
            success: false,
            error: 'Acesso negado'
          }
        }
      }

      // Obter próximo número de versão
      const { data: lastVersion } = await this.supabase
        .from('document_versions')
        .select('version_number')
        .eq('delegation_id', data.delegationId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      const nextVersionNumber = lastVersion ? lastVersion.version_number + 1 : 1

      // Marcar versões anteriores como não-current se esta for submitted
      if (data.status === 'submitted') {
        await this.supabase
          .from('document_versions')
          .update({ is_current: false })
          .eq('delegation_id', data.delegationId)
      }

      // Calcular estatísticas do texto
      const wordCount = data.contentText.split(/\s+/).filter(word => word.length > 0).length
      const charCount = data.contentText.length

      // Criar nova versão
      const { data: version, error: versionError } = await this.supabase
        .from('document_versions')
        .insert({
          delegation_id: data.delegationId,
          version_number: nextVersionNumber,
          title: data.title,
          content: data.content,
          content_text: data.contentText,
          author_id: authorId,
          author_type: authorType,
          status: data.status || 'draft',
          comment: data.comment,
          change_summary: data.changeSummary,
          word_count: wordCount,
          char_count: charCount,
          is_current: data.status === 'submitted' || nextVersionNumber === 1,
          metadata: {
            created_via: this.isClient ? 'web_editor' : 'api',
            editor_version: 'tiptap',
            auto_save: data.status === 'draft'
          }
        })
        .select(`
          *,
          author:users(full_name, email)
        `)
        .single()

      if (versionError) {
        console.error('Create version error:', versionError)
        return {
          success: false,
          error: 'Erro ao criar versão do documento'
        }
      }

      // Enviar notificação no chat se for submissão
      if (data.status === 'submitted') {
        const message = `📄 Nova versão do documento submetida (v${nextVersionNumber})\n\n**${data.title}**\n\n${data.comment || 'Documento pronto para revisão.'}\n\n📊 ${wordCount} palavras • ${charCount} caracteres`
        
        await this.chatService.sendSystemMessage(
          data.delegationId,
          message,
          'status_update'
        )
      }

      const documentVersion: DocumentVersion = {
        id: version.id,
        delegationId: version.delegation_id,
        versionNumber: version.version_number,
        title: version.title,
        content: version.content,
        contentText: version.content_text,
        authorId: version.author_id,
        authorName: version.author?.full_name || 'Usuário',
        authorType: version.author_type,
        status: version.status,
        comment: version.comment,
        changeSummary: version.change_summary,
        fileUrl: version.file_url,
        wordCount: version.word_count,
        charCount: version.char_count,
        isCurrent: version.is_current,
        createdAt: version.created_at,
        updatedAt: version.updated_at
      }

      return {
        success: true,
        versionId: version.id,
        version: documentVersion
      }

    } catch (error: any) {
      console.error('Document service create version error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Buscar versões de um documento
   */
  async getVersions(
    delegationId: string,
    userId: string
  ): Promise<DocumentVersion[]> {
    try {
      if (!this.isClient) {
        await this.initializeSupabase()
      }

      const { data: versions, error } = await this.supabase
        .from('document_versions')
        .select(`
          *,
          author:users(full_name, email)
        `)
        .eq('delegation_id', delegationId)
        .order('version_number', { ascending: false })

      if (error) {
        console.error('Get versions error:', error)
        return []
      }

      return versions.map((version: any) => ({
        id: version.id,
        delegationId: version.delegation_id,
        versionNumber: version.version_number,
        title: version.title,
        content: version.content,
        contentText: version.content_text,
        authorId: version.author_id,
        authorName: version.author?.full_name || 'Usuário',
        authorType: version.author_type,
        status: version.status,
        comment: version.comment,
        changeSummary: version.change_summary,
        fileUrl: version.file_url,
        wordCount: version.word_count,
        charCount: version.char_count,
        isCurrent: version.is_current,
        createdAt: version.created_at,
        updatedAt: version.updated_at
      }))

    } catch (error: any) {
      console.error('Get versions service error:', error)
      return []
    }
  }

  /**
   * Buscar versão específica
   */
  async getVersion(
    versionId: string,
    userId: string
  ): Promise<DocumentVersion | null> {
    try {
      if (!this.isClient) {
        await this.initializeSupabase()
      }

      const { data: version, error } = await this.supabase
        .from('document_versions')
        .select(`
          *,
          author:users(full_name, email)
        `)
        .eq('id', versionId)
        .single()

      if (error) {
        console.error('Get version error:', error)
        return null
      }

      return {
        id: version.id,
        delegationId: version.delegation_id,
        versionNumber: version.version_number,
        title: version.title,
        content: version.content,
        contentText: version.content_text,
        authorId: version.author_id,
        authorName: version.author?.full_name || 'Usuário',
        authorType: version.author_type,
        status: version.status,
        comment: version.comment,
        changeSummary: version.change_summary,
        fileUrl: version.file_url,
        wordCount: version.word_count,
        charCount: version.char_count,
        isCurrent: version.is_current,
        createdAt: version.created_at,
        updatedAt: version.updated_at
      }

    } catch (error: any) {
      console.error('Get version service error:', error)
      return null
    }
  }

  /**
   * Buscar versão atual de uma delegação
   */
  async getCurrentVersion(
    delegationId: string,
    userId: string
  ): Promise<DocumentVersion | null> {
    try {
      if (!this.isClient) {
        await this.initializeSupabase()
      }

      const { data: version, error } = await this.supabase
        .from('document_versions')
        .select(`
          *,
          author:users(full_name, email)
        `)
        .eq('delegation_id', delegationId)
        .eq('is_current', true)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        return null
      }

      return {
        id: version.id,
        delegationId: version.delegation_id,
        versionNumber: version.version_number,
        title: version.title,
        content: version.content,
        contentText: version.content_text,
        authorId: version.author_id,
        authorName: version.author?.full_name || 'Usuário',
        authorType: version.author_type,
        status: version.status,
        comment: version.comment,
        changeSummary: version.change_summary,
        fileUrl: version.file_url,
        wordCount: version.word_count,
        charCount: version.char_count,
        isCurrent: version.is_current,
        createdAt: version.created_at,
        updatedAt: version.updated_at
      }

    } catch (error: any) {
      console.error('Get current version service error:', error)
      return null
    }
  }

  /**
   * Atualizar versão existente (apenas drafts)
   */
  async updateVersion(
    versionId: string,
    userId: string,
    updates: {
      title?: string
      content?: any
      contentText?: string
      comment?: string
      changeSummary?: string
    }
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      if (!this.isClient) {
        await this.initializeSupabase()
      }

      // Verificar se é draft e pertence ao usuário
      const { data: version, error: versionError } = await this.supabase
        .from('document_versions')
        .select('status, author_id')
        .eq('id', versionId)
        .eq('author_id', userId)
        .single()

      if (versionError || !version) {
        return {
          success: false,
          error: 'Versão não encontrada'
        }
      }

      if (version.status !== 'draft') {
        return {
          success: false,
          error: 'Apenas rascunhos podem ser editados'
        }
      }

      // Preparar dados de atualização
      const updateData: any = {}
      
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.content !== undefined) updateData.content = updates.content
      if (updates.comment !== undefined) updateData.comment = updates.comment
      if (updates.changeSummary !== undefined) updateData.change_summary = updates.changeSummary
      
      if (updates.contentText !== undefined) {
        updateData.content_text = updates.contentText
        updateData.word_count = updates.contentText.split(/\s+/).filter(word => word.length > 0).length
        updateData.char_count = updates.contentText.length
      }

      updateData.metadata = {
        last_auto_save: new Date().toISOString(),
        editor_version: 'tiptap'
      }

      const { error: updateError } = await this.supabase
        .from('document_versions')
        .update(updateData)
        .eq('id', versionId)

      if (updateError) {
        console.error('Update version error:', updateError)
        return {
          success: false,
          error: 'Erro ao atualizar versão'
        }
      }

      return { success: true }

    } catch (error: any) {
      console.error('Update version service error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Criar comentário em uma versão
   */
  async createComment(
    authorId: string,
    authorType: 'office' | 'provider',
    data: CreateCommentData
  ): Promise<{
    success: boolean
    commentId?: string
    error?: string
  }> {
    try {
      if (!this.isClient) {
        await this.initializeSupabase()
      }

      // Verificar acesso à versão do documento
      const { data: versionCheck, error: checkError } = await this.supabase
        .from('document_versions')
        .select(`
          delegation_id,
          delegation:delegations(office_id, provider_id)
        `)
        .eq('id', data.documentVersionId)
        .single()

      if (checkError || !versionCheck) {
        return {
          success: false,
          error: 'Versão do documento não encontrada'
        }
      }

      const delegation = versionCheck.delegation
      
      // Verificar permissões
      if (authorType === 'provider' && delegation.provider_id !== authorId) {
        return {
          success: false,
          error: 'Acesso negado'
        }
      }

      if (authorType === 'office') {
        const { data: user } = await this.supabase
          .from('users')
          .select('metadata')
          .eq('id', authorId)
          .single()

        if (!user || user.metadata?.organization_id !== delegation.office_id) {
          return {
            success: false,
            error: 'Acesso negado'
          }
        }
      }

      // Criar comentário
      const { data: comment, error: commentError } = await this.supabase
        .from('document_comments')
        .insert({
          document_version_id: data.documentVersionId,
          author_id: authorId,
          author_type: authorType,
          content: data.content,
          selection_start: data.selectionStart,
          selection_end: data.selectionEnd,
          selected_text: data.selectedText,
          metadata: {
            created_via: this.isClient ? 'web_editor' : 'api'
          }
        })
        .select()
        .single()

      if (commentError) {
        console.error('Create comment error:', commentError)
        return {
          success: false,
          error: 'Erro ao criar comentário'
        }
      }

      return {
        success: true,
        commentId: comment.id
      }

    } catch (error: any) {
      console.error('Create comment service error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Buscar comentários de uma versão
   */
  async getComments(
    versionId: string,
    userId: string
  ): Promise<DocumentComment[]> {
    try {
      if (!this.isClient) {
        await this.initializeSupabase()
      }

      const { data: comments, error } = await this.supabase
        .from('document_comments')
        .select(`
          *,
          author:users(full_name, email),
          resolver:users(full_name, email)
        `)
        .eq('document_version_id', versionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Get comments error:', error)
        return []
      }

      return comments.map((comment: any) => ({
        id: comment.id,
        documentVersionId: comment.document_version_id,
        authorId: comment.author_id,
        authorName: comment.author?.full_name || 'Usuário',
        authorType: comment.author_type,
        content: comment.content,
        selectionStart: comment.selection_start,
        selectionEnd: comment.selection_end,
        selectedText: comment.selected_text,
        isResolved: comment.is_resolved,
        resolvedBy: comment.resolver?.full_name,
        resolvedAt: comment.resolved_at,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at
      }))

    } catch (error: any) {
      console.error('Get comments service error:', error)
      return []
    }
  }

  /**
   * Resolver comentário
   */
  async resolveComment(
    commentId: string,
    userId: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      if (!this.isClient) {
        await this.initializeSupabase()
      }

      const { error } = await this.supabase
        .from('document_comments')
        .update({
          is_resolved: true,
          resolved_by: userId,
          resolved_at: new Date().toISOString()
        })
        .eq('id', commentId)

      if (error) {
        console.error('Resolve comment error:', error)
        return {
          success: false,
          error: 'Erro ao resolver comentário'
        }
      }

      return { success: true }

    } catch (error: any) {
      console.error('Resolve comment service error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Subscription para mudanças em tempo real (client-side)
   */
  subscribeToVersions(
    delegationId: string,
    onVersionChange: (version: DocumentVersion) => void,
    onError?: (error: any) => void
  ) {
    if (!this.isClient) {
      throw new Error('Subscriptions only work on client-side')
    }

    const channel = this.supabase
      .channel(`document_versions_${delegationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_versions',
          filter: `delegation_id=eq.${delegationId}`
        },
        async (payload: any) => {
          try {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              // Buscar dados completos da versão
              const { data: fullVersion } = await this.supabase
                .from('document_versions')
                .select(`
                  *,
                  author:users(full_name, email)
                `)
                .eq('id', payload.new.id)
                .single()

              if (fullVersion) {
                const documentVersion: DocumentVersion = {
                  id: fullVersion.id,
                  delegationId: fullVersion.delegation_id,
                  versionNumber: fullVersion.version_number,
                  title: fullVersion.title,
                  content: fullVersion.content,
                  contentText: fullVersion.content_text,
                  authorId: fullVersion.author_id,
                  authorName: fullVersion.author?.full_name || 'Usuário',
                  authorType: fullVersion.author_type,
                  status: fullVersion.status,
                  comment: fullVersion.comment,
                  changeSummary: fullVersion.change_summary,
                  fileUrl: fullVersion.file_url,
                  wordCount: fullVersion.word_count,
                  charCount: fullVersion.char_count,
                  isCurrent: fullVersion.is_current,
                  createdAt: fullVersion.created_at,
                  updatedAt: fullVersion.updated_at
                }

                onVersionChange(documentVersion)
              }
            }
          } catch (error) {
            console.error('Error processing real-time version change:', error)
            if (onError) onError(error)
          }
        }
      )
      .subscribe()

    return () => {
      this.supabase.removeChannel(channel)
    }
  }
}
