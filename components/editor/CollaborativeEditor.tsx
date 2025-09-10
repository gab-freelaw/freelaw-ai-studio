'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Save,
  Send,
  History,
  MessageSquare,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Palette,
  Type,
  FileText,
  Users,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download
} from 'lucide-react'
import { DocumentService, type DocumentVersion, type DocumentComment } from '@/lib/services/DocumentService'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CollaborativeEditorProps {
  delegationId: string
  delegationTitle: string
  currentUserId: string
  currentUserType: 'office' | 'provider'
  initialVersion?: DocumentVersion
  onVersionChange?: (version: DocumentVersion) => void
  readOnly?: boolean
}

export default function CollaborativeEditor({
  delegationId,
  delegationTitle,
  currentUserId,
  currentUserType,
  initialVersion,
  onVersionChange,
  readOnly = false
}: CollaborativeEditorProps) {
  const [title, setTitle] = useState(initialVersion?.title || `${delegationTitle} - Documento`)
  const [comment, setComment] = useState('')
  const [changeSummary, setChangeSummary] = useState('')
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [comments, setComments] = useState<DocumentComment[]>([])
  const [currentVersion, setCurrentVersion] = useState<DocumentVersion | null>(initialVersion || null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  const documentService = new DocumentService(true)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // history configurado separadamente
      }),
      Placeholder.configure({
        placeholder: 'Comece a escrever o documento aqui...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Color,
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
    ],
    content: initialVersion?.content || '<p>Comece a escrever o documento aqui...</p>',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (!readOnly) {
        const text = editor.getText()
        setWordCount(text.split(/\s+/).filter(word => word.length > 0).length)
        setCharCount(text.length)
        
        // Auto-save após 2 segundos de inatividade
        debouncedAutoSave()
      }
    },
  })

  // Auto-save debounced
  const debouncedAutoSave = useCallback(
    debounce(() => {
      if (editor && currentVersion && currentVersion.status === 'draft') {
        autoSave()
      }
    }, 2000),
    [editor, currentVersion]
  )

  useEffect(() => {
    loadVersions()
    setupRealtimeSubscription()
  }, [delegationId])

  useEffect(() => {
    if (selectedVersionId && selectedVersionId !== currentVersion?.id) {
      loadVersion(selectedVersionId)
    }
  }, [selectedVersionId])

  const loadVersions = async () => {
    try {
      setIsLoading(true)
      const fetchedVersions = await documentService.getVersions(delegationId, currentUserId)
      setVersions(fetchedVersions)
      
      if (!currentVersion && fetchedVersions.length > 0) {
        const current = fetchedVersions.find(v => v.isCurrent) || fetchedVersions[0]
        setCurrentVersion(current)
        setSelectedVersionId(current.id)
        
        if (editor) {
          editor.commands.setContent(current.content)
          setTitle(current.title)
          setWordCount(current.wordCount)
          setCharCount(current.charCount)
        }
      }
    } catch (error) {
      console.error('Error loading versions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadVersion = async (versionId: string) => {
    try {
      const version = await documentService.getVersion(versionId, currentUserId)
      if (version && editor) {
        editor.commands.setContent(version.content)
        setTitle(version.title)
        setWordCount(version.wordCount)
        setCharCount(version.charCount)
        setCurrentVersion(version)
        
        // Carregar comentários da versão
        if (showComments) {
          loadComments(versionId)
        }
      }
    } catch (error) {
      console.error('Error loading version:', error)
    }
  }

  const loadComments = async (versionId: string) => {
    try {
      const fetchedComments = await documentService.getComments(versionId, currentUserId)
      setComments(fetchedComments)
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    const unsubscribe = documentService.subscribeToVersions(
      delegationId,
      (version) => {
        setVersions(prev => {
          const exists = prev.find(v => v.id === version.id)
          if (exists) {
            return prev.map(v => v.id === version.id ? version : v)
          } else {
            return [version, ...prev]
          }
        })
        
        if (onVersionChange) {
          onVersionChange(version)
        }
      },
      (error) => {
        console.error('Realtime subscription error:', error)
      }
    )

    return unsubscribe
  }

  const autoSave = async () => {
    if (!editor || !currentVersion || currentVersion.status !== 'draft') return

    try {
      setIsSaving(true)
      const content = editor.getJSON()
      const contentText = editor.getText()

      await documentService.updateVersion(currentVersion.id, currentUserId, {
        title,
        content,
        contentText,
        comment,
        changeSummary
      })

      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const saveAsDraft = async () => {
    if (!editor) return

    try {
      setIsSaving(true)
      const content = editor.getJSON()
      const contentText = editor.getText()

      const result = await documentService.createVersion(currentUserId, currentUserType, {
        delegationId,
        title,
        content,
        contentText,
        comment,
        changeSummary,
        status: 'draft'
      })

      if (result.success && result.version) {
        setCurrentVersion(result.version)
        setVersions(prev => [result.version!, ...prev])
        setLastSaved(new Date())
        
        // Limpar campos de comentário
        setComment('')
        setChangeSummary('')
      }
    } catch (error) {
      console.error('Save draft error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const submitForReview = async () => {
    if (!editor) return

    try {
      setIsSubmitting(true)
      const content = editor.getJSON()
      const contentText = editor.getText()

      const result = await documentService.createVersion(currentUserId, currentUserType, {
        delegationId,
        title,
        content,
        contentText,
        comment,
        changeSummary,
        status: 'submitted'
      })

      if (result.success && result.version) {
        setCurrentVersion(result.version)
        setVersions(prev => [result.version!, ...prev])
        
        // Limpar campos
        setComment('')
        setChangeSummary('')
        
        alert('Documento submetido para revisão com sucesso!')
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Erro ao submeter documento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-800' },
      submitted: { label: 'Submetido', className: 'bg-blue-100 text-blue-800' },
      approved: { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejeitado', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.draft
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ptBR
    })
  }

  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-freelaw-purple mx-auto mb-2" />
          <p className="text-gray-600">Carregando editor...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Editor Principal */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold border-0 px-0 focus:ring-0"
                  placeholder="Título do documento"
                  disabled={readOnly}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                {currentVersion && getStatusBadge(currentVersion.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVersions(!showVersions)}
                >
                  <History className="w-4 h-4 mr-1" />
                  Versões ({versions.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Comentários
                </Button>
              </div>
            </div>

            {/* Toolbar */}
            {!readOnly && editor && (
              <div className="flex items-center space-x-1 flex-wrap">
                <Button
                  variant={editor.isActive('bold') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                
                <Button
                  variant={editor.isActive('italic') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <Italic className="w-4 h-4" />
                </Button>
                
                <Button
                  variant={editor.isActive('underline') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                  <UnderlineIcon className="w-4 h-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Button
                  variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                
                <Button
                  variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
                
                <Button
                  variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                >
                  <AlignRight className="w-4 h-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Button
                  variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                  <List className="w-4 h-4" />
                </Button>
                
                <Button
                  variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>

                <Button
                  variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                  <Quote className="w-4 h-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>{wordCount} palavras</span>
                <span>{charCount} caracteres</span>
                {lastSaved && (
                  <span className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                    Salvo {formatTime(lastSaved.toISOString())}
                  </span>
                )}
                {isSaving && (
                  <span className="flex items-center">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Salvando...
                  </span>
                )}
              </div>
              
              {currentVersion && (
                <div className="flex items-center space-x-2">
                  <span>Versão {currentVersion.versionNumber}</span>
                  <span>•</span>
                  <span>{currentVersion.authorName}</span>
                  <span>•</span>
                  <span>{formatTime(currentVersion.createdAt)}</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="min-h-[400px] p-6">
              <EditorContent 
                editor={editor}
                className="prose prose-lg max-w-none focus:outline-none"
              />
            </div>
          </CardContent>

          {/* Actions */}
          {!readOnly && (
            <div className="border-t p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Comentário da versão
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Descreva as mudanças ou observações..."
                    className="h-20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Resumo das alterações
                  </label>
                  <Textarea
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    placeholder="Ex: Correção de argumentação no item 3..."
                    className="h-20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={saveAsDraft}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Rascunho
                  </Button>
                </div>

                <Button
                  onClick={submitForReview}
                  disabled={isSubmitting || !title.trim()}
                  className="bg-gradient-to-r from-freelaw-purple to-tech-blue hover:from-freelaw-purple/90 hover:to-tech-blue/90"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submeter para Revisão
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Versões */}
        {showVersions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <History className="w-4 h-4 mr-2" />
                Histórico de Versões
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedVersionId === version.id
                      ? 'border-freelaw-purple bg-freelaw-purple/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedVersionId(version.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">v{version.versionNumber}</span>
                    {getStatusBadge(version.status)}
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-2">
                    {version.authorName} • {formatTime(version.createdAt)}
                  </div>
                  
                  {version.comment && (
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {version.comment}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{version.wordCount} palavras</span>
                    {version.isCurrent && (
                      <Badge variant="outline" className="text-xs">Atual</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Comentários */}
        {showComments && currentVersion && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Comentários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum comentário nesta versão
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="p-3 rounded-lg bg-gray-50 border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{comment.authorName}</span>
                      <span className="text-xs text-gray-500">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    
                    {comment.selectedText && (
                      <div className="text-xs bg-yellow-100 text-yellow-800 p-1 rounded mb-2">
                        "{comment.selectedText}"
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-700">{comment.content}</p>
                    
                    {comment.isResolved && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Resolvido por {comment.resolvedBy}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}


