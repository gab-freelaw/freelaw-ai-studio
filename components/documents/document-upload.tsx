'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2, Check, AlertCircle, Image, Music, Video, File } from 'lucide-react';
import { ServiceType, LegalArea } from '@/lib/document-processing/types';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  onUploadComplete?: (document: any) => void;
  className?: string;
}

export function DocumentUpload({ onUploadComplete, className }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.PETICAO_INICIAL);
  const [legalArea, setLegalArea] = useState<LegalArea>(LegalArea.CIVEL);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-16 h-16 text-freelaw-purple" />;
    } else if (mimeType.startsWith('audio/')) {
      return <Music className="w-16 h-16 text-tech-blue" />;
    } else if (mimeType.startsWith('video/')) {
      return <Video className="w-16 h-16 text-product-pink" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="w-16 h-16 text-olympic-gold" />;
    } else {
      return <File className="w-16 h-16 text-tech-blue-light" />;
    }
  };
  
  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Imagem';
    if (mimeType.startsWith('audio/')) return 'Áudio';
    if (mimeType.startsWith('video/')) return 'Vídeo';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Documento Word';
    if (mimeType.includes('text')) return 'Texto';
    return 'Arquivo';
  };
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);
  
  const handleFileSelect = (selectedFile: File) => {
    // Validate file type - now accepting multimedia
    const allowedTypes = [
      // Documents
      'application/pdf', 
      'text/plain', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Audio
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/mp4',
      // Video
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/webm',
      'video/x-msvideo',
      'video/x-ms-wmv'
    ];
    
    const isAllowed = allowedTypes.includes(selectedFile.type) || 
                      selectedFile.type.startsWith('image/') ||
                      selectedFile.type.startsWith('audio/') ||
                      selectedFile.type.startsWith('video/');
    
    if (!isAllowed) {
      setErrorMessage('Tipo de arquivo inválido. Permitidos: Documentos (PDF, DOC, DOCX, TXT), Imagens, Áudios e Vídeos');
      setUploadStatus('error');
      return;
    }
    
    // Validate file size (500MB for legal documents)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (selectedFile.size > maxSize) {
      setErrorMessage('Arquivo muito grande. Tamanho máximo: 500MB');
      setUploadStatus('error');
      return;
    }
    
    setFile(selectedFile);
    setErrorMessage('');
    setUploadStatus('idle');
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadStatus('uploading');
    setErrorMessage('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('serviceType', serviceType);
      formData.append('legalArea', legalArea);
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }
      
      setUploadStatus('success');
      setFile(null);
      
      if (onUploadComplete) {
        onUploadComplete(result.document);
      }
      
      // Reset after success
      setTimeout(() => {
        setUploadStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao fazer upload');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <div className="space-y-8">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-3 border-dashed rounded-2xl p-12 transition-all duration-300",
            isDragging 
              ? "border-freelaw-purple bg-gradient-to-br from-freelaw-purple/10 to-freelaw-purple/5 scale-[1.02] shadow-purple" 
              : "border-freelaw-purple/30 hover:border-freelaw-purple/50 bg-gradient-to-br from-white to-freelaw-purple/5",
            file && "bg-gradient-to-br from-olympic-gold/10 to-olympic-gold/5 border-olympic-gold"
          )}
        >
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx,image/*,audio/*,video/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            {file ? (
              <>
                <div className="p-4 bg-white rounded-2xl shadow-lg">
                  {getFileIcon(file.type)}
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-tech-blue">{file.name}</p>
                  <p className="text-sm text-tech-blue-light mt-1">
                    {getFileTypeLabel(file.type)} • {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setUploadStatus('idle');
                  }}
                  className="px-4 py-2 bg-product-pink/10 text-product-pink font-medium rounded-xl hover:bg-product-pink hover:text-white transition-all duration-200"
                >
                  Remover arquivo
                </button>
              </>
            ) : (
              <>
                <div className="p-4 bg-white rounded-2xl shadow-lg">
                  <Upload className="w-16 h-16 text-freelaw-purple" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-tech-blue">
                    Arraste um documento aqui
                  </p>
                  <p className="text-sm text-tech-blue-light mt-2">
                    ou clique para selecionar
                  </p>
                  <p className="text-xs text-tech-blue-light mt-1">
                    Documentos • Imagens • Áudios • Vídeos
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Document Type Selection */}
        {file && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <label className="block text-sm font-bold text-tech-blue mb-3">
                Tipo de Documento
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full px-5 py-3 bg-white border-2 border-freelaw-purple/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-freelaw-purple focus:border-freelaw-purple transition-all duration-200 text-tech-blue font-medium cursor-pointer"
              >
                <option value={ServiceType.PETICAO_INICIAL}>Petição Inicial</option>
                <option value={ServiceType.CONTESTACAO}>Contestação</option>
                <option value={ServiceType.APELACAO}>Apelação</option>
                <option value={ServiceType.AGRAVO_INSTRUMENTO}>Agravo de Instrumento</option>
                <option value={ServiceType.RECURSO_ESPECIAL}>Recurso Especial</option>
                <option value={ServiceType.RECURSO_EXTRAORDINARIO}>Recurso Extraordinário</option>
                <option value={ServiceType.CONTRATO}>Contrato</option>
                <option value={ServiceType.MANDADO_SEGURANCA}>Mandado de Segurança</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-tech-blue mb-3">
                Área do Direito
              </label>
              <select
                value={legalArea}
                onChange={(e) => setLegalArea(e.target.value as LegalArea)}
                className="w-full px-5 py-3 bg-white border-2 border-freelaw-purple/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-freelaw-purple focus:border-freelaw-purple transition-all duration-200 text-tech-blue font-medium cursor-pointer"
              >
                <option value={LegalArea.CIVEL}>Cível</option>
                <option value={LegalArea.CRIMINAL}>Criminal</option>
                <option value={LegalArea.TRABALHISTA}>Trabalhista</option>
                <option value={LegalArea.TRIBUTARIO}>Tributário</option>
                <option value={LegalArea.ADMINISTRATIVO}>Administrativo</option>
                <option value={LegalArea.CONSTITUCIONAL}>Constitucional</option>
                <option value={LegalArea.EMPRESARIAL}>Empresarial</option>
                <option value={LegalArea.FAMILIA}>Família</option>
                <option value={LegalArea.CONSUMIDOR}>Consumidor</option>
                <option value={LegalArea.AMBIENTAL}>Ambiental</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-center space-x-3 p-4 bg-product-pink/10 border border-product-pink/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-product-pink flex-shrink-0" />
            <span className="text-product-pink font-medium">{errorMessage}</span>
          </div>
        )}
        
        {/* Success Message */}
        {uploadStatus === 'success' && (
          <div className="flex items-center space-x-3 p-4 bg-olympic-gold/10 border border-olympic-gold/20 rounded-xl">
            <Check className="w-5 h-5 text-olympic-gold-dark flex-shrink-0" />
            <span className="text-olympic-gold-dark font-medium">Documento enviado com sucesso! Processamento iniciado.</span>
          </div>
        )}
        
        {/* Upload Button */}
        {file && uploadStatus !== 'success' && (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={cn(
              "w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300",
              "bg-gradient-purple text-white shadow-purple hover:shadow-glow hover:scale-[1.02]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              "flex items-center justify-center space-x-3"
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span>Enviar e Processar Documento</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}