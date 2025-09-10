'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, FileX, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { officeStyleService, type DocumentStyleAnalysis, type Letterhead } from '@/lib/services/office-style.service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StyleAnalyzerProps {
  officeId: string
  onAnalysisComplete?: (analysis: DocumentStyleAnalysis, analysisId: string) => void
  onStyleSaved?: () => void
}

export function StyleAnalyzer({ officeId, onAnalysisComplete, onStyleSaved }: StyleAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<DocumentStyleAnalysis | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [letterheadId, setLetterheadId] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [savedLetterheads, setSavedLetterheads] = useState<Letterhead[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadedFile(file)
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90))
      }, 300)

      const result = await officeStyleService.analyzeDocument(file, officeId, false, true)
      
      clearInterval(progressInterval)
      setAnalysisProgress(100)
      
      setAnalysis(result.analysis)
      setAnalysisId(result.analysisId)
      setLetterheadId(result.letterheadId || null)
      
      // Se salvou um timbre, buscar a lista atualizada
      if (result.letterheadId) {
        const letterheads = await officeStyleService.getLetterheads(officeId)
        setSavedLetterheads(letterheads)
      }
      
      toast.success('Documento analisado com sucesso!')
      onAnalysisComplete?.(result.analysis, result.analysisId)
    } catch (error) {
      console.error('Error analyzing document:', error)
      toast.error('Erro ao analisar documento')
    } finally {
      setIsAnalyzing(false)
    }
  }, [officeId, onAnalysisComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isAnalyzing
  })

  const saveAsDefaultStyle = async () => {
    if (!analysis || !uploadedFile) return

    try {
      const result = await officeStyleService.analyzeDocument(uploadedFile, officeId, true, true)
      toast.success('Estilo e timbre salvos como padrão do escritório!')
      
      // Atualizar lista de timbres
      if (result.letterheadId) {
        const letterheads = await officeStyleService.getLetterheads(officeId)
        setSavedLetterheads(letterheads)
      }
      
      onStyleSaved?.()
    } catch (error) {
      console.error('Error saving style:', error)
      toast.error('Erro ao salvar estilo')
    }
  }

  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 80) return 'default'
    if (confidence >= 60) return 'secondary'
    return 'outline'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'Alta confiança'
    if (confidence >= 60) return 'Confiança média'
    return 'Baixa confiança'
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Analisar Documento Modelo</CardTitle>
          <CardDescription>
            Faça upload de um documento para extrair automaticamente o estilo e formatação do seu escritório
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analysis ? (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                isAnalyzing && "opacity-50 cursor-not-allowed"
              )}
            >
              <input {...getInputProps()} />
              
              {isAnalyzing ? (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Analisando documento...</p>
                    <Progress value={analysisProgress} className="w-full max-w-xs mx-auto" />
                  </div>
                </div>
              ) : isDragActive ? (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-medium">Solte o arquivo aqui</p>
                </>
              ) : (
                <>
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Arraste um documento ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: PDF, DOCX, DOC, TXT
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Análise concluída!</AlertTitle>
                <AlertDescription>
                  O documento foi analisado com sucesso. Veja os resultados abaixo.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{uploadedFile?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile?.size || 0 / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Badge variant={getConfidenceBadgeVariant(analysis.metadata.confidence)}>
                  {getConfidenceLabel(analysis.metadata.confidence)} ({analysis.metadata.confidence}%)
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveAsDefaultStyle} className="flex-1">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Salvar como Estilo Padrão
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAnalysis(null)
                    setUploadedFile(null)
                    setAnalysisId(null)
                  }}
                >
                  Analisar Outro Documento
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Análise</CardTitle>
            <CardDescription>
              Detalhes do estilo e formatação extraídos do documento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="typography" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="typography">Tipografia</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="structure">Estrutura</TabsTrigger>
                <TabsTrigger value="language">Linguagem</TabsTrigger>
                <TabsTrigger value="preview">Prévia</TabsTrigger>
              </TabsList>

              <TabsContent value="typography" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Fontes</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.typography.fontFamily.map((font, i) => (
                        <Badge key={i} variant="secondary">{font}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tamanhos de Fonte</h4>
                    <div className="space-y-1 text-sm">
                      <div>Títulos: {analysis.typography.fontSize.h1.join(', ')}pt</div>
                      <div>Subtítulos: {analysis.typography.fontSize.h2.join(', ')}pt</div>
                      <div>Corpo: {analysis.typography.fontSize.body.join(', ')}pt</div>
                      <div>Rodapé: {analysis.typography.fontSize.footer.join(', ')}pt</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Espaçamento</h4>
                    <div className="space-y-1 text-sm">
                      <div>Altura da linha: {analysis.typography.lineHeight.join(', ')}</div>
                      <div>Espaçamento entre letras: {analysis.typography.letterSpacing.join(', ')}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Margens (cm)</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Superior: {analysis.layout.margins.top.join(', ')}</div>
                      <div>Inferior: {analysis.layout.margins.bottom.join(', ')}</div>
                      <div>Esquerda: {analysis.layout.margins.left.join(', ')}</div>
                      <div>Direita: {analysis.layout.margins.right.join(', ')}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Alinhamento</h4>
                    <div className="space-y-1 text-sm">
                      <div>Títulos: {analysis.layout.alignment.title.join(', ')}</div>
                      <div>Corpo: {analysis.layout.alignment.body.join(', ')}</div>
                      <div>Assinatura: {analysis.layout.alignment.signature.join(', ')}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Formato da Página</h4>
                    <Badge>{analysis.layout.pageFormat}</Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="structure" className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex flex-wrap gap-4">
                    {analysis.legalStructure.hasHeader && (
                      <Badge variant="outline">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Cabeçalho
                      </Badge>
                    )}
                    {analysis.legalStructure.hasFooter && (
                      <Badge variant="outline">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Rodapé
                      </Badge>
                    )}
                    {analysis.legalStructure.hasLetterhead && (
                      <Badge variant="outline">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Timbre
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Numeração</h4>
                    <div className="space-y-1 text-sm">
                      <div>Estilo: {analysis.legalStructure.numbering.style}</div>
                      <div>Padrão: {analysis.legalStructure.numbering.pattern}</div>
                      <div>Profundidade: {analysis.legalStructure.numbering.depth} níveis</div>
                    </div>
                  </div>

                  {analysis.legalStructure.sectionPatterns.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Seções Identificadas</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.legalStructure.sectionPatterns.map((pattern, i) => (
                          <Badge key={i} variant="secondary">
                            {pattern.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.legalStructure.citations.frequency > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Citações</h4>
                      <div className="space-y-1 text-sm">
                        <div>Estilo: {analysis.legalStructure.citations.style}</div>
                        <div>Frequência: {analysis.legalStructure.citations.frequency} citações</div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="language" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Métricas de Linguagem</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Formalidade</span>
                          <span>{analysis.language.formality}%</span>
                        </div>
                        <Progress value={analysis.language.formality} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Complexidade</span>
                          <span>{analysis.language.complexity}%</span>
                        </div>
                        <Progress value={analysis.language.complexity} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Tecnicidade</span>
                          <span>{analysis.language.technicality}%</span>
                        </div>
                        <Progress value={analysis.language.technicality} />
                      </div>
                    </div>
                  </div>

                  {analysis.language.commonPhrases.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Frases Comuns</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.language.commonPhrases.map((phrase, i) => (
                          <Badge key={i} variant="outline">{phrase}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.language.preferredTerms.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Termos Preferidos</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.language.preferredTerms.slice(0, 10).map((term, i) => (
                          <Badge key={i} variant="secondary">{term}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg p-6 bg-white">
                  <h4 className="text-sm font-medium mb-4">Prévia do Timbre</h4>
                  
                  {/* Prévia do timbre extraído */}
                  {analysis.extractedLetterhead ? (
                    <div className="space-y-4">
                      <Alert className="mb-4">
                        <Sparkles className="h-4 w-4" />
                        <AlertTitle>Timbre Detectado</AlertTitle>
                        <AlertDescription>
                          Foi detectado e extraído o timbre do documento. {letterheadId ? 'O timbre foi salvo e pode ser reutilizado.' : ''}
                        </AlertDescription>
                      </Alert>
                      
                      <div className="border-2 border-blue-200 rounded-lg overflow-hidden bg-white">
                        {/* Cabeçalho extraído */}
                        {analysis.extractedLetterhead.header && (
                          <div className="bg-blue-50 p-6 border-b-2 border-blue-200">
                            <pre className="whitespace-pre-wrap font-serif text-sm text-center">
                              {analysis.extractedLetterhead.header}
                            </pre>
                          </div>
                        )}
                        
                        {/* Área de conteúdo */}
                        <div className="p-8 min-h-[200px]">
                          <p className="text-center text-gray-400 italic">
                            [O conteúdo do documento será inserido aqui]
                          </p>
                        </div>
                        
                        {/* Rodapé extraído */}
                        {analysis.extractedLetterhead.footer && (
                          <div className="bg-gray-50 p-4 border-t border-gray-200">
                            <pre className="whitespace-pre-wrap font-serif text-xs text-center text-gray-600">
                              {analysis.extractedLetterhead.footer}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Timbre padrão se não foi extraído */
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 bg-gray-50">
                      <div className="text-center mb-6">
                        {/* Logo placeholder */}
                        <div className="inline-block w-20 h-20 bg-gray-300 rounded-lg mb-3"></div>
                        
                        {/* Nome do escritório */}
                        <h2 className="text-gray-900 mb-2 font-bold text-lg">
                          ESCRITÓRIO DE ADVOCACIA
                        </h2>
                        
                        {/* OAB */}
                        <div className="text-sm text-gray-600">
                          {analysis.letterheadElements.office?.oab?.join(' | ') || 'OAB/SP 123.456'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prévia do corpo do documento */}
                  <div className="space-y-4 mb-6">
                    <h5 className="text-sm font-medium mb-2">Exemplo de Formatação do Documento</h5>
                    
                    <div 
                      style={{ 
                        fontFamily: analysis.typography.fontFamily.join(', '),
                        textAlign: analysis.layout.alignment.title[0] as any
                      }}
                      className="mb-4"
                    >
                      <strong style={{ fontSize: `${analysis.typography.fontSize.h1[0]}pt` }}>
                        EXCELENTÍSSIMO SENHOR DOUTOR JUIZ
                      </strong>
                    </div>
                    
                    <div 
                      style={{ 
                        fontFamily: analysis.typography.fontFamily.join(', '),
                        fontSize: `${analysis.typography.fontSize.body[0]}pt`,
                        textAlign: analysis.layout.alignment.body[0] as any,
                        lineHeight: analysis.typography.lineHeight[0]
                      }}
                      className="text-gray-700"
                    >
                      <p className="mb-3">
                        {analysis.language.preferredTerms[0] || 'FULANO DE TAL'}, brasileiro, 
                        casado, portador do RG nº XX.XXX.XXX-X, inscrito no CPF sob o nº XXX.XXX.XXX-XX, 
                        residente e domiciliado na Rua Exemplo, nº 123, Cidade/UF, vem, respeitosamente, 
                        à presença de Vossa Excelência, por intermédio de seu advogado que esta subscreve...
                      </p>
                      
                      {analysis.language.commonPhrases.length > 0 && (
                        <p className="mb-3 font-semibold">
                          {analysis.language.commonPhrases[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Informações detectadas */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-blue-900 mb-2">Informações Detectadas</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>✓ Fonte principal: <strong>{analysis.typography.fontFamily[0]}</strong></li>
                      <li>✓ Tamanho do corpo: <strong>{analysis.typography.fontSize.body[0]}pt</strong></li>
                      <li>✓ Alinhamento: <strong>{analysis.layout.alignment.body[0]}</strong></li>
                      <li>✓ Formalidade: <strong>{analysis.language.formality}%</strong></li>
                      {analysis.legalStructure.sectionPatterns.length > 0 && (
                        <li>✓ Seções detectadas: <strong>{analysis.legalStructure.sectionPatterns.length}</strong></li>
                      )}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}