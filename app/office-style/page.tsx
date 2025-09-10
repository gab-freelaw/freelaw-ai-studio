'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layouts/app-layout';
import { StyleAnalyzer } from '@/components/office-style/style-analyzer';
import { Sparkles, FileText, Upload, Settings } from 'lucide-react';

export default function OfficeStylePage() {
  const [officeId] = useState('default-office'); // In real app, get from auth/context

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-purple/5">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-freelaw-purple/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-purple rounded-2xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-tech-blue">
                  Analisador de Estilo do Escritório
                </h1>
                <p className="text-lg text-tech-blue-light mt-1">
                  Analise documentos e estabeleça o padrão de redação do seu escritório
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Instructions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-freelaw-purple/10 p-6 sticky top-8">
                <h2 className="text-xl font-bold text-tech-blue mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-freelaw-purple" />
                  Como funciona
                </h2>
                
                <div className="space-y-4 text-sm text-tech-blue-light">
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-freelaw-purple/10 rounded-full flex-shrink-0">
                      <Upload className="w-4 h-4 text-freelaw-purple" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-tech-blue">1. Faça upload</h3>
                      <p>Envie documentos representativos do seu escritório (petições, contratos, pareceres)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-olympic-gold/10 rounded-full flex-shrink-0">
                      <FileText className="w-4 h-4 text-olympic-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-tech-blue">2. Análise IA</h3>
                      <p>Nossa IA analisa estrutura, linguagem, formatação e estilo técnico</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-product-pink/10 rounded-full flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-product-pink" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-tech-blue">3. Padrão estabelecido</h3>
                      <p>O sistema aprende e replica o estilo nas próximas gerações de documentos</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-freelaw-purple/5 rounded-xl">
                  <h4 className="font-semibold text-tech-blue text-sm mb-2">💡 Dica</h4>
                  <p className="text-xs text-tech-blue-light">
                    Para melhores resultados, envie pelo menos 3-5 documentos diferentes 
                    que representem bem o padrão do seu escritório.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Analyzer */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-freelaw-purple/10">
                <div className="p-6 border-b border-freelaw-purple/10">
                  <h2 className="text-xl font-bold text-tech-blue">
                    Análise de Documentos
                  </h2>
                  <p className="text-tech-blue-light mt-1">
                    Faça upload de um documento para começar a análise
                  </p>
                </div>
                
                <div className="p-6">
                  <StyleAnalyzer 
                    officeId={officeId}
                    onAnalysisComplete={(analysis, analysisId) => {
                      console.log('Analysis complete:', analysis, analysisId);
                      // Handle analysis completion
                    }}
                    onStyleSaved={() => {
                      console.log('Style saved successfully');
                      // Handle style save
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}