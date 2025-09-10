'use client'

import { useState, useEffect } from 'react'
import { petitionEnhancementsService } from '@/lib/services/petition-enhancements.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  Sparkles, 
  History, 
  Users, 
  TrendingUp,
  Brain,
  Zap,
  FileSearch,
  GitBranch,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface PetitionFormEnhancedProps {
  templateId: string
  onGenerate: (data: any) => void
  initialData?: Record<string, any>
  processId?: string
}

export function PetitionFormEnhanced({ 
  templateId, 
  onGenerate, 
  initialData,
  processId 
}: PetitionFormEnhancedProps) {
  const [formData, setFormData] = useState(initialData || {})
  const [isExtracting, setIsExtracting] = useState(false)
  const [suggestions, setSuggestions] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [versions, setVersions] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    loadRecommendations()
  }, [templateId])

  const loadRecommendations = async () => {
    try {
      const recs = await petitionEnhancementsService.getRecommendedTemplates(
        'office-id', // Replace with actual office ID
        formData
      )
      setRecommendations(recs)
    } catch (error) {
      console.error('Error loading recommendations:', error)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsExtracting(true)
    try {
      // Extract data from uploaded document
      const extractedData = await petitionEnhancementsService.extractDocumentData(file)
      
      // Merge with existing form data
      setFormData(prev => ({
        ...prev,
        ...extractedData.parties,
        ...extractedData.case,
        fatos: extractedData.facts?.summary || prev.fatos,
        pedidos: extractedData.requests?.main || prev.pedidos,
        urgencia: extractedData.requests?.urgency || prev.urgencia
      }))

      // Show success message
      alert('Dados extraídos com sucesso!')
    } catch (error) {
      console.error('Error extracting document:', error)
      alert('Erro ao extrair dados do documento')
    } finally {
      setIsExtracting(false)
    }
  }

  const analyzeFacts = async () => {
    if (!formData.fatos) return

    setIsAnalyzing(true)
    try {
      const analysis = await petitionEnhancementsService.generatePetitionSuggestions(
        templateId,
        formData.fatos
      )
      setSuggestions(analysis)
    } catch (error) {
      console.error('Error analyzing facts:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateFromProcess = async () => {
    if (!processId) return

    try {
      const result = await petitionEnhancementsService.createPetitionFromProcess(
        processId,
        templateId
      )
      
      if (result.petition_text) {
        onGenerate(result)
      }
    } catch (error) {
      console.error('Error generating from process:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acelere a criação da petição com ferramentas inteligentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isExtracting}
            >
              {isExtracting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Extrair de Documento
            </Button>
            
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />

            {processId && (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={generateFromProcess}
              >
                <FileSearch className="w-4 h-4" />
                Gerar do Processo
              </Button>
            )}

            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={analyzeFacts}
              disabled={!formData.fatos || isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              Analisar Fatos
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Ver Versões
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Petições em Lote
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {suggestions && (
        <Alert className="border-blue-200 bg-blue-50">
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <strong>Estratégia Sugerida:</strong>
                <p className="text-sm mt-1">{suggestions.strategy}</p>
              </div>
              
              {suggestions.relevantLaws?.length > 0 && (
                <div>
                  <strong>Leis Relevantes:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {suggestions.relevantLaws.map((law: string, i: number) => (
                      <Badge key={i} variant="secondary">{law}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.keyArguments?.length > 0 && (
                <div>
                  <strong>Argumentos-Chave:</strong>
                  <ul className="text-sm mt-1 list-disc list-inside">
                    {suggestions.keyArguments.map((arg: string, i: number) => (
                      <li key={i}>{arg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {suggestions.precedents?.length > 0 && (
                <div>
                  <strong>Precedentes:</strong>
                  <div className="text-sm mt-1 space-y-1">
                    {suggestions.precedents.map((prec: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {prec}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Template Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Templates Recomendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec) => (
                <div
                  key={rec.templateId}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  onClick={() => console.log('Load template:', rec.templateId)}
                >
                  <div>
                    <p className="font-medium">{rec.name}</p>
                    <p className="text-sm text-gray-500">{rec.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">{rec.relevance}%</p>
                      <p className="text-xs text-gray-500">relevância</p>
                    </div>
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Form Fields with Auto-complete */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Petição</CardTitle>
          <CardDescription>
            Campos marcados com IA são preenchidos automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="parties" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="parties">Partes</TabsTrigger>
              <TabsTrigger value="facts">Fatos</TabsTrigger>
              <TabsTrigger value="requests">Pedidos</TabsTrigger>
              <TabsTrigger value="evidence">Provas</TabsTrigger>
            </TabsList>

            <TabsContent value="parties" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    Autor/Requerente
                    {formData.autor && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Auto
                      </Badge>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.autor || ''}
                    onChange={(e) => setFormData({...formData, autor: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    Réu/Requerido
                    {formData.reu && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Auto
                      </Badge>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.reu || ''}
                    onChange={(e) => setFormData({...formData, reu: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    placeholder="Nome completo"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="facts" className="space-y-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  Resumo dos Fatos
                  {formData.fatos && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      Extraído
                    </Badge>
                  )}
                </label>
                <textarea
                  value={formData.fatos || ''}
                  onChange={(e) => setFormData({...formData, fatos: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  rows={6}
                  placeholder="Descreva os fatos relevantes..."
                />
                {formData.fatos && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={analyzeFacts}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Analisar e Sugerir Argumentos
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Pedidos</label>
                <div className="space-y-2 mt-2">
                  {(formData.pedidos || []).map((pedido: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <input
                        type="text"
                        value={pedido}
                        onChange={(e) => {
                          const newPedidos = [...(formData.pedidos || [])]
                          newPedidos[index] = e.target.value
                          setFormData({...formData, pedidos: newPedidos})
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      pedidos: [...(formData.pedidos || []), '']
                    })}
                  >
                    Adicionar Pedido
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Provas a Produzir</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Prova Documental</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Prova Testemunhal</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Prova Pericial</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Depoimento Pessoal</span>
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">
          <GitBranch className="w-4 h-4 mr-2" />
          Salvar Rascunho
        </Button>
        <Button 
          onClick={() => onGenerate(formData)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Gerar Petição com IA
        </Button>
      </div>
    </div>
  )
}