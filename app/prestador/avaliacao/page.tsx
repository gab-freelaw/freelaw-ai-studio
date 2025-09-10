'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Brain,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Loader2,
  ArrowLeft,
  Target,
  Award,
  TrendingUp,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface TestPiece {
  id: string
  title: string
  description: string
  context: string
  requirements: string[]
  expectedLength: number
  legalArea: string
}

interface Evaluation {
  id: string
  status: string
  testPieces: TestPiece[]
  scores?: {
    technical: number
    argumentation: number
    formatting: number
    overall: number
  }
  feedback?: string
  suggestions?: {
    strengths: string[]
    improvements: string[]
    recommendations: string[]
  }
}

interface PieceSubmission {
  testPieceId: string
  content: string
}

export default function ProviderEvaluationPage() {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [submissions, setSubmissions] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentPiece, setCurrentPiece] = useState(0)

  useEffect(() => {
    loadEvaluation()
  }, [])

  const loadEvaluation = async () => {
    try {
      const supabase = createClient()
      
      // Buscar avaliação atual
      const response = await fetch('/api/providers/evaluation')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      // Se não há avaliações, mostrar botão para iniciar
      if (!data.evaluations || data.evaluations.length === 0) {
        setEvaluation(null)
        setIsLoading(false)
        return
      }

      // Pegar a avaliação mais recente
      const latestEval = data.evaluations[0]
      
      if (latestEval.status === 'pending') {
        // Buscar detalhes da avaliação pendente
        const detailResponse = await fetch(`/api/providers/evaluation?id=${latestEval.id}`)
        const detailData = await detailResponse.json()
        
        if (detailResponse.ok) {
          setEvaluation(detailData.evaluation)
        }
      } else {
        // Avaliação já finalizada
        const detailResponse = await fetch(`/api/providers/evaluation?id=${latestEval.id}`)
        const detailData = await detailResponse.json()
        
        if (detailResponse.ok) {
          setEvaluation(detailData.evaluation)
        }
      }

    } catch (error: any) {
      console.error('Load evaluation error:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const startEvaluation = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/providers/evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setEvaluation(data.evaluation)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmissionChange = (pieceId: string, content: string) => {
    setSubmissions(prev => ({
      ...prev,
      [pieceId]: content
    }))
  }

  const submitEvaluation = async () => {
    try {
      setIsSubmitting(true)
      setError('')

      if (!evaluation) return

      // Validar se todas as peças foram preenchidas
      const pieces = evaluation.testPieces.map(piece => ({
        testPieceId: piece.id,
        content: submissions[piece.id] || ''
      }))

      const emptyPieces = pieces.filter(p => p.content.trim().length < 100)
      if (emptyPieces.length > 0) {
        throw new Error('Todas as peças devem ter pelo menos 100 caracteres')
      }

      const response = await fetch('/api/providers/evaluation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          evaluationId: evaluation.id,
          pieces
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      // Atualizar com resultado
      setEvaluation(prev => prev ? {
        ...prev,
        status: data.result.approved ? 'approved' : 'rejected',
        scores: {
          technical: data.result.scores.technical_score,
          argumentation: data.result.scores.argumentation_score,
          formatting: data.result.scores.formatting_score,
          overall: data.result.scores.overall_score
        },
        feedback: data.result.feedback,
        suggestions: data.result.suggestions
      } : null)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700">Em Andamento</Badge>
      case 'approved':
        return <Badge variant="outline" className="border-green-300 text-green-700">Aprovado</Badge>
      case 'rejected':
        return <Badge variant="destructive">Reprovado</Badge>
      default:
        return <Badge variant="outline">Aguardando</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const completedPieces = evaluation?.testPieces.filter(piece => 
    submissions[piece.id] && submissions[piece.id].length >= 100
  ).length || 0

  const totalPieces = evaluation?.testPieces.length || 0
  const progress = totalPieces > 0 ? (completedPieces / totalPieces) * 100 : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-gray-50 to-tech-blue/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-freelaw-purple mx-auto mb-4" />
          <p className="text-gray-600">Carregando avaliação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-gray-50 to-tech-blue/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link 
            href="/portal-prestador/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-freelaw-purple transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar ao Dashboard
          </Link>
        </div>

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-freelaw-purple to-tech-blue p-3 rounded-2xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-freelaw-black">
            Avaliação Técnica
          </h1>
          <p className="text-gray-600">
            Demonstre suas habilidades jurídicas através de peças práticas
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* No Evaluation - Start Button */}
        {!evaluation && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-6">
              <div className="space-y-4">
                <Target className="w-16 h-16 text-freelaw-purple mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold text-freelaw-black mb-2">
                    Pronto para a Avaliação?
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    A avaliação técnica consiste em 5 peças jurídicas de diferentes áreas do direito. 
                    Você terá que demonstrar conhecimento técnico, capacidade de argumentação e formatação adequada.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <FileText className="w-8 h-8 text-freelaw-purple mx-auto mb-2" />
                  <h3 className="font-medium text-freelaw-black">5 Peças</h3>
                  <p className="text-sm text-gray-600">Diferentes áreas jurídicas</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-8 h-8 text-freelaw-purple mx-auto mb-2" />
                  <h3 className="font-medium text-freelaw-black">7 Dias</h3>
                  <p className="text-sm text-gray-600">Para completar</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Award className="w-8 h-8 text-freelaw-purple mx-auto mb-2" />
                  <h3 className="font-medium text-freelaw-black">Nota 7.0</h3>
                  <p className="text-sm text-gray-600">Mínima para aprovação</p>
                </div>
              </div>

              <Button
                onClick={startEvaluation}
                disabled={isLoading}
                className="bg-gradient-to-r from-freelaw-purple to-tech-blue hover:from-freelaw-purple/90 hover:to-tech-blue/90 text-white px-8 py-3 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-5 w-5" />
                    Iniciar Avaliação
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Evaluation Results */}
        {evaluation && (evaluation.status === 'approved' || evaluation.status === 'rejected') && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {evaluation.status === 'approved' ? (
                  <CheckCircle2 className="w-16 h-16 text-green-600" />
                ) : (
                  <AlertCircle className="w-16 h-16 text-red-600" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {evaluation.status === 'approved' ? 'Parabéns! Você foi aprovado!' : 'Avaliação não aprovada'}
              </CardTitle>
              <CardDescription>
                {getStatusBadge(evaluation.status)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Scores */}
              {evaluation.scores && (
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getScoreColor(evaluation.scores.technical)}`}>
                      {evaluation.scores.technical.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Técnica Jurídica</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getScoreColor(evaluation.scores.argumentation)}`}>
                      {evaluation.scores.argumentation.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Argumentação</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getScoreColor(evaluation.scores.formatting)}`}>
                      {evaluation.scores.formatting.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Formatação</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-freelaw-purple/10 to-tech-blue/10 rounded-lg border-2 border-freelaw-purple/20">
                    <div className={`text-2xl font-bold ${getScoreColor(evaluation.scores.overall)}`}>
                      {evaluation.scores.overall.toFixed(1)}
                    </div>
                    <div className="text-sm text-freelaw-purple font-medium">Nota Final</div>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {evaluation.feedback && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-freelaw-black">Feedback Detalhado</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {evaluation.feedback}
                    </pre>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {evaluation.suggestions && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Pontos Fortes
                    </h4>
                    <ul className="space-y-1">
                      {evaluation.suggestions.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-600">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-700 mb-2 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Melhorias
                    </h4>
                    <ul className="space-y-1">
                      {evaluation.suggestions.improvements.map((improvement, index) => (
                        <li key={index} className="text-sm text-gray-600">• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      Recomendações
                    </h4>
                    <ul className="space-y-1">
                      {evaluation.suggestions.recommendations.map((recommendation, index) => (
                        <li key={index} className="text-sm text-gray-600">• {recommendation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Evaluation in Progress */}
        {evaluation && evaluation.status === 'pending' && (
          <>
            {/* Progress */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-freelaw-black">
                      Progresso da Avaliação
                    </span>
                    <span className="text-sm text-gray-600">
                      {completedPieces} de {totalPieces} peças
                    </span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Test Pieces */}
            <div className="space-y-6">
              {evaluation.testPieces.map((piece, index) => (
                <Card key={piece.id} className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-freelaw-black">
                          {index + 1}. {piece.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <Badge variant="outline" className="mr-2">{piece.legalArea}</Badge>
                          Aproximadamente {piece.expectedLength} palavras
                        </CardDescription>
                      </div>
                      {submissions[piece.id] && submissions[piece.id].length >= 100 && (
                        <CheckCircle2 className="w-6 h-6 text-green-500 mt-1" />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-freelaw-black mb-2">Descrição</h4>
                      <p className="text-sm text-gray-700">{piece.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-freelaw-black mb-2">Contexto</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {piece.context}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-freelaw-black mb-2">Requisitos</h4>
                      <ul className="space-y-1">
                        {piece.requirements.map((req, reqIndex) => (
                          <li key={reqIndex} className="text-sm text-gray-600 flex items-start">
                            <span className="text-freelaw-purple mr-2">•</span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-freelaw-black mb-2">Sua Resposta</h4>
                      <Textarea
                        value={submissions[piece.id] || ''}
                        onChange={(e) => handleSubmissionChange(piece.id, e.target.value)}
                        placeholder="Digite sua peça jurídica aqui..."
                        className="min-h-[300px] resize-none"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          {submissions[piece.id]?.length || 0} caracteres
                        </span>
                        <span>
                          Mínimo: 100 caracteres
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Submit Button */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Button
                  onClick={submitEvaluation}
                  disabled={completedPieces < totalPieces || isSubmitting}
                  className="bg-gradient-to-r from-freelaw-purple to-tech-blue hover:from-freelaw-purple/90 hover:to-tech-blue/90 text-white px-8 py-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando para avaliação...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Enviar Avaliação
                    </>
                  )}
                </Button>
                
                {completedPieces < totalPieces && (
                  <p className="text-sm text-gray-600 mt-2">
                    Complete todas as peças para enviar a avaliação
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}