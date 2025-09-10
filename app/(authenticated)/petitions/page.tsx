'use client';

import { useState } from 'react';
import { 
  FileText, 
  Send, 
  Copy, 
  Download,
  ChevronRight,
  Scale,
  Briefcase,
  Gavel,
  Shield,
  FileSignature,
  AlertCircle,
  Loader2,
  Sparkles,
  Cpu
} from 'lucide-react';
import { AppLayout } from '@/components/layouts/app-layout';

const PETITION_TEMPLATES = [
  {
    id: 'peticao-inicial',
    title: 'Petição Inicial',
    icon: FileText,
    description: 'Modelo para ações novas no primeiro grau',
    category: 'Cível',
    color: 'freelaw-purple'
  },
  {
    id: 'contestacao',
    title: 'Contestação',
    icon: Shield,
    description: 'Resposta do réu à petição inicial',
    category: 'Cível',
    color: 'tech-blue'
  },
  {
    id: 'recurso-apelacao',
    title: 'Recurso de Apelação',
    icon: Gavel,
    description: 'Recurso contra sentença de primeiro grau',
    category: 'Recursos',
    color: 'olympic-gold'
  },
  {
    id: 'agravo-instrumento',
    title: 'Agravo de Instrumento',
    icon: FileSignature,
    description: 'Recurso contra decisões interlocutórias',
    category: 'Recursos',
    color: 'product-pink'
  },
  {
    id: 'mandado-seguranca',
    title: 'Mandado de Segurança',
    icon: Scale,
    description: 'Proteção contra ato de autoridade',
    category: 'Constitucional',
    color: 'freelaw-purple'
  },
  {
    id: 'embargos-declaracao',
    title: 'Embargos de Declaração',
    icon: Briefcase,
    description: 'Esclarecimento de decisão judicial',
    category: 'Recursos',
    color: 'tech-blue'
  }
];

interface FormData {
  autor: string;
  reu: string;
  fatos: string;
  pedidos: string;
  valor: string;
  tribunal: string;
}

export default function PetitionsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    autor: '',
    reu: '',
    fatos: '',
    pedidos: '',
    valor: '',
    tribunal: ''
  });
  const [generatedPetition, setGeneratedPetition] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    setGeneratedPetition(''); // Clear previous content
    
    try {
      const templateTitle = PETITION_TEMPLATES.find(t => t.id === selectedTemplate)?.title || 'Petição';
      
      // Simplified prompt for faster generation
      const prompt = `Crie uma ${templateTitle} simples e objetiva com:
      Autor: ${formData.autor || 'João da Silva'}
      Réu: ${formData.reu || 'Empresa XYZ'}
      Fatos: ${formData.fatos || 'Fatos a serem descritos'}
      Pedidos: ${formData.pedidos || 'Pedidos principais'}
      Valor: ${formData.valor || 'R$ 10.000,00'}
      
      Use formato jurídico brasileiro padrão. Seja conciso mas completo.`;

      // Usar a nova API v2 com schemas dinâmicos e cache
      const response = await fetch('/api/petitions/generate-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          service_type: selectedTemplate,
          legal_area: PETITION_TEMPLATES.find(t => t.id === selectedTemplate)?.category?.toLowerCase() || 'civel',
          formData: {
            ...formData,
            area: PETITION_TEMPLATES.find(t => t.id === selectedTemplate)?.category
          },
          useStream: true,
          use_office_style: true,
          use_letterhead: false,
          style_preferences: {
            formality: 'formal',
            structure: 'tradicional',
            citations: 'completa'
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar petição');
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let fullText = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            
            // Update petition as it streams
            setGeneratedPetition(fullText);
          }
        } catch (streamError) {
          console.error('Stream error:', streamError);
        }
      }
      
    } catch (error) {
      console.error('Error generating petition:', error);
      setGeneratedPetition('Erro ao gerar petição. Verifique sua conexão e tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPetition);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedPetition], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate || 'peticao'}.txt`;
    a.click();
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-purple/5">
        {/* Header */}
        <header className="bg-gradient-purple text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FileSignature className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Gerador de Petições</h1>
                  <p className="mt-1 text-freelaw-purple-light/90">Crie peças processuais profissionais com IA</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedTemplate ? (
          <>
            {/* Template Selection */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-tech-blue mb-4">
                Escolha o Tipo de Petição
              </h2>
              <p className="text-lg text-tech-blue-light">
                Selecione o modelo adequado para sua necessidade
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PETITION_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-purple transition-all duration-300 text-left border-2 border-transparent hover:border-freelaw-purple/30"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-${template.color}/10 rounded-xl group-hover:scale-110 transition-transform`}>
                      <template.icon className={`w-6 h-6 text-${template.color}`} />
                    </div>
                    <span className="text-xs font-semibold text-tech-blue-light bg-freelaw-purple/10 px-2 py-1 rounded-full">
                      {template.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-tech-blue mb-2 group-hover:text-freelaw-purple transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-sm text-tech-blue-light mb-4">
                    {template.description}
                  </p>
                  <div className="flex items-center text-freelaw-purple font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Usar este modelo</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-tech-blue">
                  {PETITION_TEMPLATES.find(t => t.id === selectedTemplate)?.title}
                </h2>
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setGeneratedPetition('');
                    setFormData({
                      autor: '',
                      reu: '',
                      fatos: '',
                      pedidos: '',
                      valor: '',
                      tribunal: ''
                    });
                  }}
                  className="text-sm text-tech-blue-light hover:text-freelaw-purple transition-colors"
                >
                  Trocar modelo
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-tech-blue mb-2">
                    Autor/Requerente
                  </label>
                  <input
                    type="text"
                    value={formData.autor}
                    onChange={(e) => setFormData({...formData, autor: e.target.value})}
                    placeholder="Nome completo e qualificação"
                    className="w-full px-4 py-3 bg-freelaw-purple/5 border-2 border-freelaw-purple/20 rounded-xl focus:outline-none focus:border-freelaw-purple text-tech-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-tech-blue mb-2">
                    Réu/Requerido
                  </label>
                  <input
                    type="text"
                    value={formData.reu}
                    onChange={(e) => setFormData({...formData, reu: e.target.value})}
                    placeholder="Nome completo e qualificação"
                    className="w-full px-4 py-3 bg-freelaw-purple/5 border-2 border-freelaw-purple/20 rounded-xl focus:outline-none focus:border-freelaw-purple text-tech-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-tech-blue mb-2">
                    Resumo dos Fatos
                  </label>
                  <textarea
                    value={formData.fatos}
                    onChange={(e) => setFormData({...formData, fatos: e.target.value})}
                    placeholder="Descreva os fatos que motivam a ação"
                    rows={4}
                    className="w-full px-4 py-3 bg-freelaw-purple/5 border-2 border-freelaw-purple/20 rounded-xl focus:outline-none focus:border-freelaw-purple text-tech-blue resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-tech-blue mb-2">
                    Pedidos
                  </label>
                  <textarea
                    value={formData.pedidos}
                    onChange={(e) => setFormData({...formData, pedidos: e.target.value})}
                    placeholder="Liste os pedidos da ação"
                    rows={3}
                    className="w-full px-4 py-3 bg-freelaw-purple/5 border-2 border-freelaw-purple/20 rounded-xl focus:outline-none focus:border-freelaw-purple text-tech-blue resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-tech-blue mb-2">
                      Valor da Causa
                    </label>
                    <input
                      type="text"
                      value={formData.valor}
                      onChange={(e) => setFormData({...formData, valor: e.target.value})}
                      placeholder="R$ 0,00"
                      className="w-full px-4 py-3 bg-freelaw-purple/5 border-2 border-freelaw-purple/20 rounded-xl focus:outline-none focus:border-freelaw-purple text-tech-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-tech-blue mb-2">
                      Tribunal/Comarca
                    </label>
                    <input
                      type="text"
                      value={formData.tribunal}
                      onChange={(e) => setFormData({...formData, tribunal: e.target.value})}
                      placeholder="Ex: TJSP"
                      className="w-full px-4 py-3 bg-freelaw-purple/5 border-2 border-freelaw-purple/20 rounded-xl focus:outline-none focus:border-freelaw-purple text-tech-blue"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-4 bg-gradient-purple text-white font-bold rounded-xl hover:shadow-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Gerando petição...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Gerar Petição com IA</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 space-y-3">
                <div className="p-4 bg-freelaw-purple/10 border border-freelaw-purple/20 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-freelaw-purple flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-tech-blue mb-1">
                        Modelo de IA Avançado
                      </p>
                      <p className="text-xs text-tech-blue-light">
                        Usando Claude Opus 4.1 ou GPT-5 para máxima qualidade jurídica
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-olympic-gold/10 border border-olympic-gold/20 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-olympic-gold-dark flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-tech-blue-light">
                      A IA gerará uma petição base que deve ser revisada e adaptada por um advogado antes do protocolo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Petition Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-tech-blue">Petição Gerada</h3>
                {generatedPetition && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 hover:bg-freelaw-purple/10 rounded-lg transition-colors"
                      title="Copiar"
                    >
                      <Copy className="w-5 h-5 text-tech-blue" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 hover:bg-freelaw-purple/10 rounded-lg transition-colors"
                      title="Baixar"
                    >
                      <Download className="w-5 h-5 text-tech-blue" />
                    </button>
                  </div>
                )}
              </div>

              {generatedPetition ? (
                <div className="prose prose-sm max-w-none">
                  <div className="bg-gray-50 rounded-xl p-6 max-h-[600px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-tech-blue font-mono">
                      {generatedPetition}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[500px] text-center">
                  <div className="p-4 bg-freelaw-purple/10 rounded-2xl mb-4">
                    <FileText className="w-12 h-12 text-freelaw-purple" />
                  </div>
                  <p className="text-tech-blue-light">
                    Preencha os campos e clique em "Gerar Petição" para criar sua peça processual
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}