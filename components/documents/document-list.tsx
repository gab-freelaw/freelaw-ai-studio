'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Trash2, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  title: string;
  type: string;
  category: string;
  file_size: number;
  created_at: string;
  file_url: string;
  document_extractions?: Array<{
    id: string;
    status: string;
    processing_time: number;
  }>;
}

interface DocumentListProps {
  className?: string;
}

export function DocumentList({ className }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  useEffect(() => {
    fetchDocuments();
  }, [page, searchTerm, selectedType, selectedCategory]);
  
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType) params.append('type', selectedType);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`/api/documents/list?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setDocuments(data.documents);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Processado';
      case 'processing':
        return 'Processando...';
      case 'failed':
        return 'Erro';
      default:
        return 'Aguardando';
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const typeTranslations: Record<string, string> = {
    'contract': 'Contrato',
    'petition': 'Petição',
    'ruling': 'Decisão',
    'law': 'Lei',
    'doctrine': 'Doutrina',
    'other': 'Outro'
  };
  
  const categoryTranslations: Record<string, string> = {
    'civel': 'Cível',
    'criminal': 'Criminal',
    'trabalhista': 'Trabalhista',
    'tributario': 'Tributário',
    'administrativo': 'Administrativo',
    'constitucional': 'Constitucional',
    'empresarial': 'Empresarial',
    'familia': 'Família',
    'consumidor': 'Consumidor',
    'ambiental': 'Ambiental'
  };
  
  return (
    <div className={cn("w-full", className)}>
      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-5 py-3 bg-white border-2 border-freelaw-purple/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-freelaw-purple focus:border-freelaw-purple transition-all duration-200 text-tech-blue placeholder-tech-blue-light/50"
          />
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-5 py-3 bg-white border-2 border-freelaw-purple/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-freelaw-purple focus:border-freelaw-purple transition-all duration-200 text-tech-blue cursor-pointer"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(typeTranslations).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-5 py-3 bg-white border-2 border-freelaw-purple/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-freelaw-purple focus:border-freelaw-purple transition-all duration-200 text-tech-blue cursor-pointer"
          >
            <option value="">Todas as áreas</option>
            {Object.entries(categoryTranslations).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Document List */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-freelaw-purple" />
            <div className="absolute inset-0 w-12 h-12 bg-freelaw-purple/20 rounded-full animate-ping" />
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-freelaw-purple/5 to-transparent rounded-2xl">
          <div className="p-4 bg-white rounded-full w-fit mx-auto mb-4 shadow-lg">
            <FileText className="w-12 h-12 text-freelaw-purple" />
          </div>
          <p className="text-tech-blue font-medium">Nenhum documento encontrado</p>
          <p className="text-tech-blue-light/70 text-sm mt-2">Faça upload do seu primeiro documento para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => {
            const extraction = doc.document_extractions?.[0];
            
            return (
              <div
                key={doc.id}
                className="group bg-white border-2 border-freelaw-purple/10 rounded-2xl p-6 hover:shadow-purple hover:border-freelaw-purple/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3 bg-gradient-purple rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-tech-blue text-lg line-clamp-1 group-hover:text-freelaw-purple transition-colors">
                        {doc.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                        <span className="px-3 py-1 bg-freelaw-purple/10 text-freelaw-purple rounded-full font-medium">
                          {typeTranslations[doc.type] || doc.type}
                        </span>
                        <span className="px-3 py-1 bg-olympic-gold/10 text-olympic-gold-dark rounded-full font-medium">
                          {categoryTranslations[doc.category] || doc.category}
                        </span>
                        <span className="text-tech-blue-light">{formatFileSize(doc.file_size)}</span>
                        <span className="text-tech-blue-light">{formatDate(doc.created_at)}</span>
                      </div>
                      
                      {/* Processing Status */}
                      <div className="flex items-center space-x-2 mt-3">
                        {getStatusIcon(extraction?.status)}
                        <span className="text-sm font-semibold">
                          {getStatusText(extraction?.status)}
                        </span>
                        {extraction?.processing_time && (
                          <span className="text-xs text-tech-blue-light/70">
                            ({(extraction.processing_time / 1000).toFixed(1)}s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {extraction?.status === 'completed' && (
                      <button
                        onClick={() => window.open(`/documents/${doc.id}/extraction`, '_blank')}
                        className="p-3 text-freelaw-purple bg-freelaw-purple/10 hover:bg-freelaw-purple hover:text-white rounded-xl transition-all duration-200"
                        title="Ver extração"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                    <a
                      href={doc.file_url}
                      download
                      className="p-3 text-olympic-gold bg-olympic-gold/10 hover:bg-olympic-gold hover:text-white rounded-xl transition-all duration-200"
                      title="Baixar documento"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    <button
                      className="p-3 text-product-pink bg-product-pink/10 hover:bg-product-pink hover:text-white rounded-xl transition-all duration-200"
                      title="Excluir documento"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-3 mt-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-5 py-2.5 bg-white border-2 border-freelaw-purple/20 text-tech-blue font-medium rounded-xl hover:bg-freelaw-purple hover:text-white hover:border-freelaw-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Anterior
          </button>
          <span className="px-4 py-2 bg-freelaw-purple/10 text-freelaw-purple font-semibold rounded-xl">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-5 py-2.5 bg-white border-2 border-freelaw-purple/20 text-tech-blue font-medium rounded-xl hover:bg-freelaw-purple hover:text-white hover:border-freelaw-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}