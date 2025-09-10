'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  Download,
  Settings,
  Zap
} from 'lucide-react'
import { officeStyleService, type DocumentStyleAnalysis } from '@/lib/services/office-style.service'
import { toast } from 'sonner'

interface StyleAnalysisStepProps {
  processo?: {
    numero_cnj: string
    titulo: string
    ultima_peca?: string
    documento_url?: string
  }
  officeId: string
  onAnalysisComplete?: (analysis: DocumentStyleAnalysis) => void
  onSkip?: () => void
}

export function StyleAnalysisStep({ 
  processo, 
  officeId, 
  onAnalysisComplete,
  onSkip 
}: StyleAnalysisStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<DocumentStyleAnalysis | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [demoOption, setDemoOption] = useState<'resumo' | 'ia' | 'especialista' | null>(null)
  const [demoContent, setDemoContent] = useState<string>('')
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false)

  const analyzeLastDocument = async () => {
    if (!processo?.documento_url) {
      toast.error('Nenhum documento encontrado para análise')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 15, 90))
      }, 500)

      // Buscar documento e analisar
      const response = await fetch(processo.documento_url)
      const blob = await response.blob()
      const file = new File([blob], `${processo.numero_cnj}.pdf`, { type: 'application/pdf' })

      const result = await officeStyleService.analyzeDocument(file, officeId, true, true)
      
      clearInterval(progressInterval)
      setAnalysisProgress(100)
      
      setAnalysis(result.analysis)
      toast.success('Estilo do escritório identificado com sucesso!')
      
      onAnalysisComplete?.(result.analysis)
    } catch (error) {
      console.error('Erro ao analisar documento:', error)
      toast.error('Erro ao analisar o documento')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateDemo = async (tipo: 'resumo' | 'ia' | 'especialista') => {
    setDemoOption(tipo)
    setIsGeneratingDemo(true)

    try {
      // Aqui integraria com a API de geração
      const response = await fetch('/api/office-style/generate-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          processo,
          analysis,
          officeId
        })
      })

      const data = await response.json()
      setDemoContent(data.content)
      
      toast.success(`${tipo === 'resumo' ? 'Resumo' : tipo === 'ia' ? 'Peça por IA' : 'Peça por especialista'} gerada!`)
    } catch (error) {
      console.error('Erro ao gerar demonstração:', error)
      toast.error('Erro ao gerar demonstração')
    } finally {
      setIsGeneratingDemo(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Análise de Estilo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-freelaw-purple" />
            Personalização por IA
          </CardTitle>
          <CardDescription>
            Vamos analisar o estilo de escrita do seu escritório para personalizar futuras gerações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!analysis && !isAnalyzing && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Análise Inteligente</AlertTitle>
                <AlertDescription>
                  Nossa IA pode analisar o último processo do escritório para identificar:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Padrão de timbre utilizado</li>
                    <li>Estilo de escrita característico</li>
                    <li>Preferências de formatação</li>
                    <li>Vocabulário e termos preferidos</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {processo && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Último processo encontrado:</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><strong>Processo:</strong> {processo.numero_cnj}</p>
                    <p><strong>Título:</strong> {processo.titulo}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={analyzeLastDocument} 
                  className="flex-1"
                  disabled={!processo?.documento_url}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analisar Estilo Automático
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onSkip}
                  className="flex-1"
                >
                  Configurar Depois
                </Button>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-freelaw-purple" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-center font-medium">Analisando estilo do documento...</p>
                <Progress value={analysisProgress} className="w-full" />
              </div>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Análise Concluída!</AlertTitle>
                <AlertDescription>
                  Identificamos o padrão de escrita do seu escritório
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Formalidade</p>
                  <div className="flex items-center gap-2">
                    <Progress value={analysis.language.formality} className="flex-1" />
                    <span className="text-sm font-medium">{analysis.language.formality}%</span>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Tecnicidade</p>
                  <div className="flex items-center gap-2">
                    <Progress value={analysis.language.technicality} className="flex-1" />
                    <span className="text-sm font-medium">{analysis.language.technicality}%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-2">Características Identificadas</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.language.commonPhrases.slice(0, 5).map((phrase, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {phrase}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demonstração Prática */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-olympic-gold" />
              Demonstração Prática
            </CardTitle>
            <CardDescription>
              Experimente nossa tecnologia com o estilo do seu escritório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant={demoOption === 'resumo' ? 'default' : 'outline'}
                onClick={() => generateDemo('resumo')}
                disabled={isGeneratingDemo}
                className="h-auto py-4 px-4 flex flex-col items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                <div className="text-center">
                  <p className="font-medium">Resumo + Recomendações</p>
                  <p className="text-xs text-muted-foreground">Do último processo</p>
                </div>
              </Button>

              <Button
                variant={demoOption === 'ia' ? 'default' : 'outline'}
                onClick={() => generateDemo('ia')}
                disabled={isGeneratingDemo}
                className="h-auto py-4 px-4 flex flex-col items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <div className="text-center">
                  <p className="font-medium">Peça por IA</p>
                  <p className="text-xs text-muted-foreground">Com seu estilo</p>
                </div>
              </Button>

              <Button
                variant={demoOption === 'especialista' ? 'default' : 'outline'}
                onClick={() => generateDemo('especialista')}
                disabled={isGeneratingDemo}
                className="h-auto py-4 px-4 flex flex-col items-center gap-2 relative"
              >
                <Settings className="w-5 h-5" />
                <div className="text-center">
                  <p className="font-medium">Por Especialista</p>
                  <p className="text-xs text-muted-foreground">Plano Premium</p>
                </div>
                <Badge className="absolute -top-2 -right-2 text-xs" variant="secondary">
                  Premium
                </Badge>
              </Button>
            </div>

            {isGeneratingDemo && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-freelaw-purple mr-2" />
                <span className="text-sm">Gerando demonstração...</span>
              </div>
            )}

            {demoContent && !isGeneratingDemo && (
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{demoContent}</pre>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar Completo
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botão de Conclusão */}
      {analysis && (
        <div className="flex justify-end">
          <Button 
            size="lg"
            onClick={() => onAnalysisComplete?.(analysis)}
            className="min-w-[200px]"
          >
            Continuar
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}