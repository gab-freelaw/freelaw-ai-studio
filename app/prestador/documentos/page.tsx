'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Download,
  Loader2,
  ArrowLeft,
  Camera,
  Image as ImageIcon
} from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'

interface Document {
  id: string
  type: 'oab_certificate' | 'cpf' | 'rg' | 'diploma' | 'cv' | 'profile_photo' | 'portfolio'
  name: string
  file?: File
  url?: string
  status: 'pending' | 'uploading' | 'uploaded' | 'verified' | 'rejected'
  size?: number
  uploadProgress?: number
  errorMessage?: string
  isRequired: boolean
}

const DOCUMENT_TYPES = {
  oab_certificate: {
    label: 'Certificado OAB',
    description: 'Carteira da OAB ou certidão de inscrição',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  cpf: {
    label: 'CPF',
    description: 'Documento de CPF (frente e verso se necessário)',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    maxSize: 3 * 1024 * 1024 // 3MB
  },
  rg: {
    label: 'RG',
    description: 'Documento de identidade (frente e verso)',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    maxSize: 3 * 1024 * 1024 // 3MB
  },
  diploma: {
    label: 'Diploma de Direito',
    description: 'Diploma de graduação em Direito',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  cv: {
    label: 'Currículo',
    description: 'CV atualizado em PDF',
    required: false,
    accept: '.pdf',
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  profile_photo: {
    label: 'Foto Profissional',
    description: 'Foto para o perfil (opcional)',
    required: false,
    accept: '.jpg,.jpeg,.png',
    maxSize: 2 * 1024 * 1024 // 2MB
  },
  portfolio: {
    label: 'Portfólio',
    description: 'Exemplos de trabalhos anteriores (opcional)',
    required: false,
    accept: '.pdf,.doc,.docx',
    maxSize: 20 * 1024 * 1024 // 20MB
  }
}

export default function ProviderDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(() => 
    Object.entries(DOCUMENT_TYPES).map(([type, config]) => ({
      id: type,
      type: type as keyof typeof DOCUMENT_TYPES,
      name: config.label,
      status: 'pending',
      isRequired: config.required
    }))
  )
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const handleFileSelect = (documentType: string, file: File) => {
    const config = DOCUMENT_TYPES[documentType as keyof typeof DOCUMENT_TYPES]
    
    // Validar tamanho
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024)
      setDocuments(prev => prev.map(doc => 
        doc.id === documentType 
          ? { ...doc, status: 'pending', errorMessage: `Arquivo muito grande. Máximo: ${maxSizeMB}MB` }
          : doc
      ))
      return
    }

    // Validar tipo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!config.accept.includes(fileExtension)) {
      setDocuments(prev => prev.map(doc => 
        doc.id === documentType 
          ? { ...doc, status: 'pending', errorMessage: `Tipo de arquivo não suportado. Aceitos: ${config.accept}` }
          : doc
      ))
      return
    }

    // Simular upload
    setDocuments(prev => prev.map(doc => 
      doc.id === documentType 
        ? { ...doc, file, status: 'uploading', uploadProgress: 0, errorMessage: undefined }
        : doc
    ))

    // Simular progresso de upload
    const interval = setInterval(() => {
      setDocuments(prev => prev.map(doc => {
        if (doc.id === documentType && doc.status === 'uploading') {
          const newProgress = (doc.uploadProgress || 0) + Math.random() * 15
          if (newProgress >= 100) {
            clearInterval(interval)
            return { ...doc, status: 'uploaded', uploadProgress: 100 }
          }
          return { ...doc, uploadProgress: newProgress }
        }
        return doc
      }))
    }, 200)
  }

  const handleRemoveFile = (documentType: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentType 
        ? { ...doc, file: undefined, status: 'pending', uploadProgress: 0, errorMessage: undefined }
        : doc
    ))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'uploaded':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'verified':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary">Enviando...</Badge>
      case 'uploaded':
        return <Badge variant="outline" className="border-green-200 text-green-700">Enviado</Badge>
      case 'verified':
        return <Badge variant="outline" className="border-green-300 text-green-800">Verificado</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="outline">Pendente</Badge>
    }
  }

  const requiredDocuments = documents.filter(doc => doc.isRequired)
  const optionalDocuments = documents.filter(doc => !doc.isRequired)
  const uploadedRequired = requiredDocuments.filter(doc => doc.status === 'uploaded' || doc.status === 'verified').length
  const totalRequired = requiredDocuments.length
  const progressPercent = (uploadedRequired / totalRequired) * 100

  const canSubmit = requiredDocuments.every(doc => doc.status === 'uploaded' || doc.status === 'verified')

  const handleSubmit = async () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      // TODO: Implementar upload real para Supabase Storage
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simular API call
      
      setSubmitSuccess(true)
      
      // Marcar documentos como verificados
      setDocuments(prev => prev.map(doc => 
        doc.status === 'uploaded' ? { ...doc, status: 'verified' } : doc
      ))
      
    } catch (error: any) {
      setSubmitError('Erro ao enviar documentos. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-gray-50 to-tech-blue/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/portal-prestador/dashboard"
              className="inline-flex items-center text-sm text-gray-600 hover:text-freelaw-purple transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao Dashboard
            </Link>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-freelaw-black">
            Documentos
          </h1>
          <p className="text-gray-600">
            Envie seus documentos para verificação e aprovação
          </p>
        </div>

        {/* Progress */}
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-freelaw-black">
                  Progresso dos documentos obrigatórios
                </span>
                <span className="text-sm text-gray-600">
                  {uploadedRequired} de {totalRequired} enviados
                </span>
              </div>
              <Progress value={progressPercent} className="w-full" />
              {canSubmit && (
                <div className="flex items-center space-x-2 text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Todos os documentos obrigatórios foram enviados!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {submitSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Documentos enviados com sucesso! Nossa equipe analisará em até 24 horas.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {submitError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {submitError}
            </AlertDescription>
          </Alert>
        )}

        {/* Required Documents */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-freelaw-black">
            Documentos Obrigatórios
          </h2>
          
          <div className="grid gap-4">
            {requiredDocuments.map((document) => {
              const config = DOCUMENT_TYPES[document.type]
              
              return (
                <Card key={document.id} className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(document.status)}
                          <h3 className="font-medium text-freelaw-black">
                            {document.name}
                          </h3>
                          {getStatusBadge(document.status)}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {config.description}
                        </p>

                        {document.errorMessage && (
                          <div className="text-sm text-red-600 mb-3">
                            {document.errorMessage}
                          </div>
                        )}

                        {document.file && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{document.file.name}</span>
                              <span className="text-gray-500">{formatFileSize(document.file.size)}</span>
                            </div>
                            
                            {document.status === 'uploading' && (
                              <Progress value={document.uploadProgress || 0} className="w-full h-2" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {document.file && document.status !== 'uploading' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveFile(document.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {!document.file && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRefs.current[document.id]?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Enviar
                          </Button>
                        )}
                      </div>
                    </div>

                    <input
                      ref={(el) => { fileInputRefs.current[document.id] = el; }}
                      type="file"
                      accept={config.accept}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileSelect(document.id, file)
                        }
                      }}
                      className="hidden"
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Optional Documents */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-freelaw-black">
            Documentos Opcionais
          </h2>
          
          <div className="grid gap-4">
            {optionalDocuments.map((document) => {
              const config = DOCUMENT_TYPES[document.type]
              
              return (
                <Card key={document.id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(document.status)}
                          <h3 className="font-medium text-freelaw-black">
                            {document.name}
                          </h3>
                          {getStatusBadge(document.status)}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {config.description}
                        </p>

                        {document.file && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{document.file.name}</span>
                              <span className="text-gray-500">{formatFileSize(document.file.size)}</span>
                            </div>
                            
                            {document.status === 'uploading' && (
                              <Progress value={document.uploadProgress || 0} className="w-full h-2" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {document.file && document.status !== 'uploading' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveFile(document.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <div 
                          data-testid={`upload-area-${document.id}`}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors cursor-pointer"
                          onClick={() => fileInputRefs.current[document.id]?.click()}
                          onDrop={(e) => {
                            e.preventDefault()
                            const file = e.dataTransfer.files[0]
                            if (file) handleFileSelect(document.id, file)
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnter={(e) => e.preventDefault()}
                        >
                          <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600 mb-1">
                            {document.file ? 'Clique para substituir' : 'Clique ou arraste arquivo'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {DOCUMENT_TYPES[document.id as keyof typeof DOCUMENT_TYPES]?.accept || 'PDF, JPG, PNG'} • 
                            Máx {Math.round((DOCUMENT_TYPES[document.id as keyof typeof DOCUMENT_TYPES]?.maxSize || 5242880) / (1024 * 1024))}MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <input
                      ref={(el) => { fileInputRefs.current[document.id] = el; }}
                      type="file"
                      accept={config.accept}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileSelect(document.id, file)
                        }
                      }}
                      className="hidden"
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Submit Button */}
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Certifique-se de que todos os documentos obrigatórios foram enviados antes de finalizar.
              </p>
              
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-freelaw-purple to-tech-blue hover:from-freelaw-purple/90 hover:to-tech-blue/90 text-white font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando documentos...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Finalizar envio de documentos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


