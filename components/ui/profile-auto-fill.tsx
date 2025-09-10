'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  GraduationCap,
  Briefcase,
  Award,
  BookOpen,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'

interface ProfileData {
  personalInfo?: {
    name?: string
    location?: string
    summary?: string
    academicLevel?: string
  }
  professional?: {
    totalExperience?: number
    currentPosition?: string
    currentCompany?: string
    specialties?: string[]
    skills?: string[]
  }
  academic?: {
    education?: Array<{
      degree?: string
      institution?: string
      year?: string
      area?: string
    }>
    publications?: {
      total?: number
      recent?: number
    }
    awards?: Array<{
      title?: string
      year?: string
    }>
  }
  validation?: {
    source?: 'linkedin' | 'lattes'
    academicCredibility?: 'high' | 'medium' | 'low'
  }
}

interface ProfileAutoFillProps {
  onDataExtracted: (data: ProfileData) => void
  className?: string
}

export function ProfileAutoFill({ onDataExtracted, className }: ProfileAutoFillProps) {
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [lattesUrl, setLattesUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [extractedData, setExtractedData] = useState<ProfileData | null>(null)
  const [activeSource, setActiveSource] = useState<'linkedin' | 'lattes' | null>(null)

  const handleLinkedInExtraction = async () => {
    if (!linkedinUrl) {
      toast.error('Por favor, insira a URL do LinkedIn')
      return
    }

    if (!linkedinUrl.includes('linkedin.com')) {
      toast.error('URL deve ser do LinkedIn')
      return
    }

    setIsLoading(true)
    setActiveSource('linkedin')

    try {
      const response = await fetch('/api/providers/scrape-linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: linkedinUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao extrair dados do LinkedIn')
      }

      setExtractedData(data.profile)
      toast.success('Dados extraídos do LinkedIn com sucesso!')
      
    } catch (error: any) {
      console.error('Erro LinkedIn:', error)
      toast.error(error.message || 'Erro ao processar LinkedIn')
    } finally {
      setIsLoading(false)
      setActiveSource(null)
    }
  }

  const handleLattesExtraction = async () => {
    if (!lattesUrl) {
      toast.error('Por favor, insira a URL do Lattes')
      return
    }

    if (!lattesUrl.includes('lattes.cnpq.br') && !lattesUrl.includes('buscatextual.cnpq.br')) {
      toast.error('URL deve ser do Currículo Lattes')
      return
    }

    setIsLoading(true)
    setActiveSource('lattes')

    try {
      const response = await fetch('/api/providers/scrape-lattes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: lattesUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao extrair dados do Lattes')
      }

      setExtractedData(data.profile)
      toast.success('Dados extraídos do Lattes com sucesso!')
      
    } catch (error: any) {
      console.error('Erro Lattes:', error)
      toast.error(error.message || 'Erro ao processar Lattes')
    } finally {
      setIsLoading(false)
      setActiveSource(null)
    }
  }

  const handleApplyData = () => {
    if (extractedData) {
      onDataExtracted(extractedData)
      toast.success('Dados aplicados ao formulário!')
    }
  }

  const getCredibilityColor = (level?: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800 border-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getCredibilityLabel = (level?: string) => {
    switch (level) {
      case 'high': return 'Alta Credibilidade'
      case 'medium': return 'Média Credibilidade'
      case 'low': return 'Baixa Credibilidade'
      default: return 'Não Avaliado'
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Preenchimento Automático do Perfil
          </CardTitle>
          <CardDescription>
            Extraia informações automaticamente do seu LinkedIn ou Currículo Lattes para validar sua experiência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* LinkedIn */}
          <div className="space-y-3">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              LinkedIn
            </Label>
            <div className="flex gap-2">
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/seu-perfil"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleLinkedInExtraction}
                disabled={isLoading || !linkedinUrl}
                variant="outline"
                className="whitespace-nowrap"
              >
                {isLoading && activeSource === 'linkedin' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Extrair
              </Button>
            </div>
          </div>

          {/* Lattes */}
          <div className="space-y-3">
            <Label htmlFor="lattes" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-green-600" />
              Currículo Lattes
            </Label>
            <div className="flex gap-2">
              <Input
                id="lattes"
                placeholder="http://lattes.cnpq.br/1234567890123456"
                value={lattesUrl}
                onChange={(e) => setLattesUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleLattesExtraction}
                disabled={isLoading || !lattesUrl}
                variant="outline"
                className="whitespace-nowrap"
              >
                {isLoading && activeSource === 'lattes' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Extrair
              </Button>
            </div>
          </div>

          {/* Dados Extraídos */}
          {extractedData && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Dados Extraídos
                </h4>
                {extractedData.validation?.academicCredibility && (
                  <Badge className={getCredibilityColor(extractedData.validation.academicCredibility)}>
                    {getCredibilityLabel(extractedData.validation.academicCredibility)}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Informações Pessoais */}
                {extractedData.personalInfo && (
                  <div className="space-y-2">
                    <h5 className="font-medium flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Pessoal
                    </h5>
                    {extractedData.personalInfo.name && (
                      <p><strong>Nome:</strong> {extractedData.personalInfo.name}</p>
                    )}
                    {extractedData.personalInfo.location && (
                      <p><strong>Localização:</strong> {extractedData.personalInfo.location}</p>
                    )}
                    {extractedData.personalInfo.academicLevel && (
                      <p><strong>Nível:</strong> {extractedData.personalInfo.academicLevel}</p>
                    )}
                  </div>
                )}

                {/* Experiência Profissional */}
                {extractedData.professional && (
                  <div className="space-y-2">
                    <h5 className="font-medium flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      Profissional
                    </h5>
                    {extractedData.professional.totalExperience && (
                      <p><strong>Experiência:</strong> {extractedData.professional.totalExperience} anos</p>
                    )}
                    {extractedData.professional.currentPosition && (
                      <p><strong>Cargo:</strong> {extractedData.professional.currentPosition}</p>
                    )}
                    {extractedData.professional.specialties && extractedData.professional.specialties.length > 0 && (
                      <div>
                        <strong>Especialidades:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {extractedData.professional.specialties.slice(0, 3).map((spec, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {extractedData.professional.specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{extractedData.professional.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Formação Acadêmica */}
                {extractedData.academic && (
                  <div className="space-y-2">
                    <h5 className="font-medium flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      Acadêmico
                    </h5>
                    {extractedData.academic.education && extractedData.academic.education.length > 0 && (
                      <div>
                        <strong>Formação:</strong>
                        {extractedData.academic.education.slice(0, 2).map((edu, idx) => (
                          <p key={idx} className="text-xs">
                            {edu.degree} - {edu.institution} ({edu.year})
                          </p>
                        ))}
                      </div>
                    )}
                    {extractedData.academic.publications && (
                      <p><strong>Publicações:</strong> {extractedData.academic.publications.total}</p>
                    )}
                  </div>
                )}

                {/* Validação */}
                <div className="space-y-2">
                  <h5 className="font-medium flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Validação
                  </h5>
                  <p><strong>Fonte:</strong> {extractedData.validation?.source === 'linkedin' ? 'LinkedIn' : 'Lattes'}</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 text-xs">Perfil verificado externamente</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button onClick={handleApplyData} className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aplicar Dados ao Formulário
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setExtractedData(null)}
                >
                  Limpar
                </Button>
              </div>
            </div>
          )}

          {/* Informações sobre validação externa */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Validação Externa:</strong> Os dados extraídos do LinkedIn e Lattes servem como 
              confirmação adicional da sua experiência profissional e acadêmica, aumentando a credibilidade 
              do seu perfil na plataforma.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
