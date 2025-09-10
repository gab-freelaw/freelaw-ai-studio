'use client';

import { useState } from 'react';
import { DocumentUpload } from '@/components/documents/document-upload';
import { DocumentList } from '@/components/documents/document-list';
import { AppLayout } from '@/components/layouts/app-layout';
import { 
  FileText, 
  Upload, 
  List, 
  Search, 
  Filter,
  FolderOpen,
  Image as ImageIcon,
  Music,
  Video
} from 'lucide-react';

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'list'>('list');
  const [refreshList, setRefreshList] = useState(0);
  
  const handleUploadComplete = () => {
    // Switch to list view and refresh
    setActiveTab('list');
    setRefreshList(prev => prev + 1);
  };
  
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-purple/5">
        {/* Header */}
        <div className="bg-gradient-purple text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FolderOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">
                      Gerenciamento de Documentos
                    </h1>
                    <p className="mt-1 text-freelaw-purple-light/90">
                      Upload de documentos, imagens, áudios e vídeos com análise por IA
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-colors flex items-center space-x-2">
                    <Search className="w-4 h-4" />
                    <span className="text-sm font-medium">Buscar</span>
                  </button>
                  <button className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-colors flex items-center space-x-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filtrar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="bg-white rounded-t-2xl shadow-purple overflow-hidden">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('list')}
                className={`
                  flex-1 py-5 px-6 font-semibold text-sm flex items-center justify-center space-x-2 transition-all duration-200
                  ${activeTab === 'list'
                    ? 'bg-gradient-purple text-white shadow-lg'
                    : 'bg-white text-tech-blue hover:bg-freelaw-purple/10'
                  }
                `}
              >
                <List className="w-5 h-5" />
                <span>Meus Documentos</span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`
                  flex-1 py-5 px-6 font-semibold text-sm flex items-center justify-center space-x-2 transition-all duration-200
                  ${activeTab === 'upload'
                    ? 'bg-gradient-purple text-white shadow-lg'
                    : 'bg-white text-tech-blue hover:bg-freelaw-purple/10'
                  }
                `}
              >
                <Upload className="w-5 h-5" />
                <span>Novo Upload</span>
              </button>
            </nav>
          </div>
          
          {/* Content */}
          <div className="bg-white rounded-b-2xl shadow-xl p-8">
            {activeTab === 'upload' ? (
              <DocumentUpload onUploadComplete={handleUploadComplete} />
            ) : (
              <DocumentList key={refreshList} />
            )}
          </div>
        </div>
        
        {/* Info Cards - Updated for multimedia */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-purple transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-gradient-purple rounded-xl shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-tech-blue">Documentos</h3>
              </div>
              <p className="text-sm text-tech-blue-light leading-relaxed">
                PDF, DOC, DOCX e TXT com extração automática de texto e análise jurídica.
              </p>
            </div>
            
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-purple transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-gradient-gold rounded-xl shadow-md">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-tech-blue">Imagens</h3>
              </div>
              <p className="text-sm text-tech-blue-light leading-relaxed">
                Análise de imagens com OCR para extração de texto de documentos escaneados.
              </p>
            </div>
            
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-purple transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-tech-blue rounded-xl shadow-md">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-tech-blue">Áudios</h3>
              </div>
              <p className="text-sm text-tech-blue-light leading-relaxed">
                Transcrição automática de áudios para texto usando Whisper AI.
              </p>
            </div>
            
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-purple transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-product-pink to-product-pink-light rounded-xl shadow-md">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-tech-blue">Vídeos</h3>
              </div>
              <p className="text-sm text-tech-blue-light leading-relaxed">
                Extração e transcrição de áudio de vídeos para uso em peças jurídicas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}