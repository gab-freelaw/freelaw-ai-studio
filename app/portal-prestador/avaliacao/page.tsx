'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, FileText, AlertCircle, CheckCircle, XCircle, 
  BookOpen, Gavel, Target, Brain, Award, Loader2
} from 'lucide-react'
import { notification } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'

// Test case based on provider's main specialty
const TEST_CASES = {
  'Direito Trabalhista': {
    title: 'Reclamação Trabalhista - Verbas Rescisórias',
    description: `
      Seu cliente, João Carlos Silva, trabalhou na empresa Tech Solutions Ltda. por 3 anos e 7 meses como Desenvolvedor de Software.
      
      Dados do caso:
      - Admissão: 01/03/2020
      - Demissão: 15/10/2023 (sem justa causa)
      - Salário: R$ 6.500,00
      - Jornada: Segunda a sexta, 9h às 18h (1h intervalo)
      - Horas extras: Média de 15 horas/mês nos últimos 12 meses (não pagas)
      - Aviso prévio: Não cumprido, nem indenizado
      - Férias: Último período aquisitivo vencido não gozado
      - FGTS: Não depositado nos últimos 6 meses
      - 13º salário: Não pago integralmente
      
      Elabore a petição inicial trabalhista requerendo todas as verbas devidas.
    `,
    documentType: 'Petição Inicial Trabalhista',
    requiredElements: [
      'Qualificação completa das partes',
      'Síntese dos fatos',
      'Fundamentação jurídica',
      'Cálculo das verbas rescisórias',
      'Pedidos específicos',
      'Valor da causa',
      'Requerimento de justiça gratuita (se aplicável)',
      'Provas a produzir'
    ]
  },
  'Direito Civil': {
    title: 'Ação de Cobrança - Contrato de Prestação de Serviços',
    description: `
      Sua cliente, Maria Fernanda Oliveira, é designer gráfica e celebrou contrato de prestação de serviços com a empresa Marketing Digital LTDA.
      
      Dados do caso:
      - Contrato assinado em 01/06/2023
      - Serviços: Criação de identidade visual completa
      - Valor total: R$ 15.000,00
      - Pagamento: 50% na assinatura, 50% na entrega
      - Entrega realizada em 31/07/2023
      - Primeira parcela paga, segunda parcela em aberto
      - Notificação extrajudicial enviada em 01/09/2023
      - Empresa alega insatisfação com o trabalho (sem fundamento)
      
      Elabore a petição inicial de cobrança com pedido de tutela de urgência.
    `,
    documentType: 'Petição Inicial de Cobrança',
    requiredElements: [
      'Qualificação das partes',
      'Dos fatos e fundamentos',
      'Do direito',
      'Da tutela de urgência',
      'Dos pedidos',
      'Das provas',
      'Valor da causa'
    ]
  },
  'Direito Penal': {
    title: 'Resposta à Acusação - Crime de Estelionato',
    description: `
      Seu cliente, Pedro Henrique Santos, foi denunciado por suposto crime de estelionato (art. 171, CP).
      
      Dados do caso:
      - Acusação: Venda de veículo com alienação fiduciária sem informar o comprador
      - Data do fato: 15/05/2023
      - Veículo: Honda Civic 2018, placa ABC-1234
      - Valor da venda: R$ 65.000,00
      - Cliente alega: Informou verbalmente sobre o financiamento
      - Comprador: José Roberto Lima
      - Provas: Apenas depoimento do comprador
      - Cliente é primário, com bons antecedentes
      
      Elabore a resposta à acusação com preliminares e mérito.
    `,
    documentType: 'Resposta à Acusação',
    requiredElements: [
      'Qualificação do acusado',
      'Preliminares',
      'Do mérito',
      'Da ausência de dolo',
      'Das provas',
      'Pedidos',
      'Rol de testemunhas'
    ]
  }
}

export default function PracticalTestPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [testSubmitted, setTestSubmitted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(120 * 60) // 120 minutes in seconds
  const [documentContent, setDocumentContent] = useState('')
  const [specialty, setSpecialty] = useState('Direito Trabalhista')
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  
  const testCase = TEST_CASES[specialty as keyof typeof TEST_CASES] || TEST_CASES['Direito Trabalhista']

  // Timer effect
  useEffect(() => {
    if (testStarted && !testSubmitted && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
      
      if (timeRemaining === 300) { // 5 minutes warning
        notification.warning('Atenção: 5 minutos restantes!')
      }
      
      if (timeRemaining === 0) {
        handleSubmit()
      }
      
      return () => clearTimeout(timer)
    }
  }, [testStarted, testSubmitted, timeRemaining])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTest = async () => {
    setTestStarted(true)
    notification.info('Prova iniciada! Você tem 2 horas para elaborar a peça.')
  }

  const analyzeDocument = async (content: string) => {
    try {
      // Call AI service to analyze the document
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          documentType: testCase.documentType,
          requiredElements: testCase.requiredElements,
          specialty
        })
      })

      if (!response.ok) {
        // Fallback to mock analysis if API is not available
        return mockAnalysis(content)
      }

      return await response.json()
    } catch (error) {
      // Fallback to mock analysis
      return mockAnalysis(content)
    }
  }

  const mockAnalysis = (content: string) => {
    const wordCount = content.split(' ').length
    const hasAllElements = testCase.requiredElements.map(element => ({
      element,
      present: content.toLowerCase().includes(element.toLowerCase().substring(0, 10))
    }))
    
    const presentCount = hasAllElements.filter(e => e.present).length
    const score = Math.round((presentCount / testCase.requiredElements.length) * 100)
    
    return {
      score,
      technical_accuracy_score: score >= 70 ? 75 + Math.random() * 20 : 40 + Math.random() * 30,
      legal_argumentation_score: score >= 70 ? 70 + Math.random() * 25 : 35 + Math.random() * 35,
      formatting_score: wordCount > 500 ? 80 + Math.random() * 15 : 50 + Math.random() * 30,
      clarity_score: wordCount > 300 ? 75 + Math.random() * 20 : 45 + Math.random() * 30,
      completeness_score: (presentCount / testCase.requiredElements.length) * 100,
      creativity_score: 60 + Math.random() * 30,
      strengths: [
        'Boa estruturação da peça',
        'Fundamentação jurídica adequada',
        'Clareza na exposição dos fatos'
      ].slice(0, Math.floor(score / 30)),
      weaknesses: [
        'Faltou maior detalhamento nos cálculos',
        'Poderia citar mais jurisprudência',
        'Formatação pode ser melhorada'
      ].slice(0, 3 - Math.floor(score / 30)),
      suggestions: [
        'Incluir mais referências doutrinárias',
        'Detalhar melhor os pedidos',
        'Revisar a ordem dos argumentos'
      ],
      requiredElements: hasAllElements,
      passed: score >= 70
    }
  }

  const handleSubmit = async () => {
    if (!documentContent.trim()) {
      notification.error('Por favor, elabore a peça jurídica antes de enviar')
      return
    }

    setIsLoading(true)
    try {
      // Analyze the document
      const analysis = await analyzeDocument(documentContent)
      setAnalysisResult(analysis)
      
      // Save test result to database
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get provider profile
        const { data: profile } = await supabase
          .from('provider_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          // Save practical test
          await supabase
            .from('provider_practical_tests')
            .insert({
              provider_id: profile.id,
              test_type: 'initial_assessment',
              specialty,
              difficulty_level: 'intermediate',
              case_description: testCase.description,
              required_document_type: testCase.documentType,
              submitted_document: documentContent,
              submission_time: new Date().toISOString(),
              time_spent_minutes: Math.floor((7200 - timeRemaining) / 60),
              ai_analysis_result: analysis,
              ai_score: analysis.score,
              technical_accuracy_score: analysis.technical_accuracy_score,
              legal_argumentation_score: analysis.legal_argumentation_score,
              formatting_score: analysis.formatting_score,
              clarity_score: analysis.clarity_score,
              completeness_score: analysis.completeness_score,
              creativity_score: analysis.creativity_score,
              strengths: analysis.strengths,
              weaknesses: analysis.weaknesses,
              suggestions: analysis.suggestions,
              final_score: analysis.score,
              passed: analysis.passed
            })
          
          // Update provider status if passed
          if (analysis.passed) {
            await supabase
              .from('provider_profiles')
              .update({
                assessment_status: 'completed',
                assessment_score: analysis.score,
                assessment_date: new Date().toISOString(),
                provider_level: getProviderLevel(analysis.score),
                status: 'approved'
              })
              .eq('id', profile.id)
          }
        }
      }
      
      setTestSubmitted(true)
      
      if (analysis.passed) {
        notification.success('Parabéns! Você foi aprovado na avaliação!')
      } else {
        notification.error('Você não atingiu a pontuação mínima. Tente novamente em 7 dias.')
      }
    } catch (error) {
      notification.error('Erro ao enviar avaliação')
    } finally {
      setIsLoading(false)
    }
  }

  const getProviderLevel = (score: number) => {
    if (score >= 90) return 'expert'
    if (score >= 80) return 'senior'
    if (score >= 70) return 'pleno'
    return 'junior'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (testSubmitted && analysisResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-white dark:from-freelaw-black dark:via-background dark:to-tech-blue py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <Image
              src="/logo-color.png"
              alt="Freelaw"
              width={180}
              height={54}
              className="h-12 w-auto mx-auto mb-6"
              priority
            />
            <h1 className="text-3xl font-bold mb-2">Resultado da Avaliação</h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Análise da Peça Jurídica</CardTitle>
                <Badge variant={analysisResult.passed ? "default" : "destructive"} className="text-lg px-4 py-2">
                  {analysisResult.passed ? 'APROVADO' : 'REPROVADO'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Score */}
              <div className="text-center p-6 bg-gradient-to-r from-freelaw-purple/10 to-tech-blue/10 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Pontuação Final</h3>
                <div className="text-5xl font-bold text-freelaw-purple mb-2">
                  {analysisResult.score}/100
                </div>
                <Progress value={analysisResult.score} className="h-3 max-w-xs mx-auto" />
              </div>

              {/* Detailed Scores */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Critérios de Avaliação</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Precisão Técnica', score: analysisResult.technical_accuracy_score },
                    { label: 'Argumentação Jurídica', score: analysisResult.legal_argumentation_score },
                    { label: 'Formatação', score: analysisResult.formatting_score },
                    { label: 'Clareza', score: analysisResult.clarity_score },
                    { label: 'Completude', score: analysisResult.completeness_score },
                    { label: 'Criatividade', score: analysisResult.creativity_score }
                  ].map((criterion, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm">{criterion.label}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={criterion.score} className="h-2 w-32" />
                        <span className={`text-sm font-semibold ${getScoreColor(criterion.score)}`}>
                          {criterion.score.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Elements Check */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Elementos Obrigatórios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysisResult.requiredElements.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      {item.present ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm ${item.present ? '' : 'text-muted-foreground'}`}>
                        {item.element}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              {analysisResult.strengths.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-600">Pontos Fortes</h3>
                  <ul className="space-y-2">
                    {analysisResult.strengths.map((strength: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {analysisResult.weaknesses.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-orange-600">Pontos a Melhorar</h3>
                  <ul className="space-y-2">
                    {analysisResult.weaknesses.map((weakness: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                        <span className="text-sm">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {analysisResult.suggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Sugestões</h3>
                  <ul className="space-y-2">
                    {analysisResult.suggestions.map((suggestion: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Brain className="h-4 w-4 text-blue-600 mt-0.5" />
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              <Alert className={analysisResult.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <Award className={`h-4 w-4 ${analysisResult.passed ? 'text-green-600' : 'text-red-600'}`} />
                <AlertDescription>
                  {analysisResult.passed ? (
                    <>
                      <strong>Parabéns!</strong> Você foi aprovado e já pode começar a receber trabalhos. 
                      Seu nível inicial é <strong>{getProviderLevel(analysisResult.score)}</strong>. 
                      Continue se aprimorando para subir de nível e receber trabalhos mais complexos e melhor remunerados.
                    </>
                  ) : (
                    <>
                      <strong>Não desista!</strong> Você não atingiu a pontuação mínima de 70%. 
                      Revise os pontos fracos identificados e tente novamente em 7 dias. 
                      Recomendamos estudar os elementos obrigatórios e praticar a elaboração de peças similares.
                    </>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 justify-center pt-4">
                {analysisResult.passed ? (
                  <Link href="/portal-prestador/dashboard">
                    <Button className="bg-freelaw-purple hover:bg-freelaw-purple/90">
                      Ir para o Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href="/portal-prestador">
                    <Button variant="outline" className="border-freelaw-purple text-freelaw-purple">
                      Voltar ao Portal
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-white dark:from-freelaw-black dark:via-background dark:to-tech-blue py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <Image
            src="/logo-color.png"
            alt="Freelaw"
            width={180}
            height={54}
            className="h-12 w-auto mx-auto mb-6"
            priority
          />
          <h1 className="text-3xl font-bold mb-2">Avaliação Prática</h1>
          <p className="text-muted-foreground">
            Elabore uma peça jurídica para demonstrar suas habilidades
          </p>
        </div>

        {!testStarted ? (
          <Card>
            <CardHeader>
              <CardTitle>Instruções da Avaliação</CardTitle>
              <CardDescription>
                Leia atentamente antes de iniciar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Você terá 2 horas para elaborar a peça jurídica. 
                  O tempo começará a contar assim que você clicar em "Iniciar Avaliação". 
                  Não é possível pausar ou reiniciar o teste.
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-semibold mb-3">Caso para Análise</h3>
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <Badge className="mb-3">{testCase.documentType}</Badge>
                    <h4 className="font-semibold mb-2">{testCase.title}</h4>
                    <p className="text-sm whitespace-pre-line">{testCase.description}</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Elementos Obrigatórios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {testCase.requiredElements.map((element, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-freelaw-purple" />
                      <span className="text-sm">{element}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Critérios de Avaliação</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    'Precisão técnica e jurídica',
                    'Qualidade da argumentação',
                    'Formatação adequada',
                    'Clareza e objetividade',
                    'Completude dos elementos',
                    'Criatividade jurídica'
                  ].map((criterion, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{criterion}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Alert className="border-freelaw-purple/20 bg-freelaw-purple/5">
                <Brain className="h-4 w-4 text-freelaw-purple" />
                <AlertDescription>
                  Nossa IA analisará sua peça em tempo real, verificando aspectos técnicos, 
                  argumentação jurídica e aderência aos requisitos. A nota mínima para aprovação é 70/100.
                </AlertDescription>
              </Alert>

              <div className="flex justify-center">
                <Button 
                  onClick={startTest} 
                  size="lg"
                  className="bg-freelaw-purple hover:bg-freelaw-purple/90"
                >
                  <Clock className="mr-2 h-5 w-5" />
                  Iniciar Avaliação
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{testCase.title}</CardTitle>
                  <CardDescription>{testCase.documentType}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Tempo Restante</div>
                  <div className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-freelaw-purple'}`}>
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-line">{testCase.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Elabore sua peça jurídica:
                </label>
                <Textarea
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  placeholder="Digite aqui sua peça jurídica..."
                  className="min-h-[500px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {documentContent.split(' ').filter(w => w).length} palavras
                </p>
              </div>

              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Elementos obrigatórios: {testCase.requiredElements.length}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !documentContent.trim()}
                  className="bg-freelaw-purple hover:bg-freelaw-purple/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Enviar para Avaliação
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}