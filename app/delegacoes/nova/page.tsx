'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft,
  Plus,
  X,
  Calculator,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Scale,
  Briefcase
} from 'lucide-react'
import Link from 'next/link'

interface FormData {
  title: string
  description: string
  legalArea: string
  serviceType: string
  urgency: string
  processNumber: string
  clientName: string
  court: string
  deadline: string
  estimatedHours: number
  requiredExperience: string
  complexity: string
  requirements: string[]
  responseDeadline: string
  deliveryDeadline: string
}

const LEGAL_AREAS = [
  'Direito Civil',
  'Direito do Trabalho',
  'Direito Penal',
  'Direito Tributário',
  'Direito Empresarial',
  'Direito Administrativo',
  'Direito Previdenciário',
  'Direito do Consumidor',
  'Direito de Família',
  'Direito Imobiliário',
  'Direito Ambiental',
  'Direito Digital'
]

const SERVICE_TYPES = [
  { value: 'petition', label: 'Petição Inicial' },
  { value: 'appeal', label: 'Recurso' },
  { value: 'defense', label: 'Defesa/Contestação' },
  { value: 'contract', label: 'Contrato' },
  { value: 'opinion', label: 'Parecer Jurídico' },
  { value: 'research', label: 'Pesquisa Jurídica' },
  { value: 'other', label: 'Outros' }
]

const URGENCY_LEVELS = [
  { value: 'low', label: 'Baixa', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' }
]

const EXPERIENCE_LEVELS = [
  { value: 'junior', label: 'Júnior', description: 'Até 2 anos de experiência' },
  { value: 'pleno', label: 'Pleno', description: '2-5 anos de experiência' },
  { value: 'senior', label: 'Sênior', description: '5-10 anos de experiência' },
  { value: 'especialista', label: 'Especialista', description: 'Mais de 10 anos' }
]

const COMPLEXITY_LEVELS = [
  { value: 'simple', label: 'Simples', description: 'Caso rotineiro' },
  { value: 'medium', label: 'Médio', description: 'Requer análise' },
  { value: 'complex', label: 'Complexo', description: 'Múltiplas variáveis' },
  { value: 'very_complex', label: 'Muito Complexo', description: 'Caso excepcional' }
]

export default function NovaDelegacaoPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    legalArea: '',
    serviceType: '',
    urgency: '',
    processNumber: '',
    clientName: '',
    court: '',
    deadline: '',
    estimatedHours: 4,
    requiredExperience: 'pleno',
    complexity: 'medium',
    requirements: [],
    responseDeadline: '',
    deliveryDeadline: ''
  })
  
  const [newRequirement, setNewRequirement] = useState('')
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Recalcular preço quando campos relevantes mudarem
    if (['legalArea', 'serviceType', 'urgency', 'estimatedHours', 'requiredExperience', 'complexity'].includes(field)) {
      calculatePrice({ ...formData, [field]: value })
    }
  }

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const calculatePrice = async (data: FormData) => {
    if (!data.legalArea || !data.serviceType || !data.urgency || !data.requiredExperience) {
      return
    }

    try {
      setIsCalculating(true)
      
      // Simular cálculo de preço (em produção, chamar API de pricing)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Preços base simulados
      const basePrices = {
        junior: 80,
        pleno: 120,
        senior: 180,
        especialista: 250
      }
      
      const serviceMultipliers = {
        petition: 1.0,
        appeal: 1.3,
        defense: 1.2,
        contract: 0.9,
        opinion: 1.1,
        research: 0.8,
        other: 1.0
      }
      
      const urgencyMultipliers = {
        low: 0.9,
        medium: 1.0,
        high: 1.3,
        urgent: 1.8
      }
      
      const complexityMultipliers = {
        simple: 0.8,
        medium: 1.0,
        complex: 1.4,
        very_complex: 1.8
      }
      
      const basePrice = basePrices[data.requiredExperience as keyof typeof basePrices] * data.estimatedHours
      const serviceMultiplier = serviceMultipliers[data.serviceType as keyof typeof serviceMultipliers] || 1
      const urgencyMultiplier = urgencyMultipliers[data.urgency as keyof typeof urgencyMultipliers] || 1
      const complexityMultiplier = complexityMultipliers[data.complexity as keyof typeof complexityMultipliers] || 1
      
      const finalPrice = Math.ceil(basePrice * serviceMultiplier * urgencyMultiplier * complexityMultiplier / 10) * 10
      
      setCalculatedPrice(finalPrice)
      
    } catch (error) {
      console.error('Error calculating price:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // Validações
      if (!formData.title.trim()) {
        throw new Error('Título é obrigatório')
      }
      
      if (!formData.description.trim()) {
        throw new Error('Descrição é obrigatória')
      }
      
      if (!formData.legalArea) {
        throw new Error('Área jurídica é obrigatória')
      }
      
      if (!formData.serviceType) {
        throw new Error('Tipo de serviço é obrigatório')
      }
      
      if (!formData.urgency) {
        throw new Error('Urgência é obrigatória')
      }

      // Preparar dados para envio
      const delegationData = {
        title: formData.title,
        description: formData.description,
        legalArea: formData.legalArea,
        serviceType: formData.serviceType,
        urgency: formData.urgency,
        processNumber: formData.processNumber || undefined,
        clientName: formData.clientName || undefined,
        court: formData.court || undefined,
        deadline: formData.deadline || undefined,
        estimatedHours: formData.estimatedHours,
        requiredExperience: formData.requiredExperience,
        complexity: formData.complexity,
        requirements: formData.requirements,
        responseDeadline: formData.responseDeadline || undefined,
        deliveryDeadline: formData.deliveryDeadline || undefined
      }

      const response = await fetch('/api/delegations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(delegationData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar delegação')
      }

      // Sucesso - redirecionar para a delegação criada
      router.push(`/delegacoes/${result.delegation.id}`)
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.title && formData.description && formData.legalArea && 
                     formData.serviceType && formData.urgency

  return (
    <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-gray-50 to-tech-blue/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link 
            href="/delegacoes"
            className="inline-flex items-center text-sm text-gray-600 hover:text-freelaw-purple transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para Delegações
          </Link>
        </div>

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-freelaw-purple to-tech-blue p-3 rounded-2xl">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-freelaw-black">
            Nova Delegação
          </h1>
          <p className="text-gray-600">
            Crie uma nova ordem de serviço para prestadores especializados
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-freelaw-purple" />
                <span>Informações Básicas</span>
              </CardTitle>
              <CardDescription>
                Defina o título, descrição e contexto da delegação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título da Delegação *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Contestação em Ação de Cobrança - Cliente João Silva"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição Detalhada *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva o contexto, fatos relevantes e o que precisa ser feito..."
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="processNumber">Número do Processo</Label>
                  <Input
                    id="processNumber"
                    value={formData.processNumber}
                    onChange={(e) => handleInputChange('processNumber', e.target.value)}
                    placeholder="0000000-00.0000.0.00.0000"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    placeholder="Nome do cliente envolvido"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="court">Tribunal/Vara</Label>
                <Input
                  id="court"
                  value={formData.court}
                  onChange={(e) => handleInputChange('court', e.target.value)}
                  placeholder="Ex: 1ª Vara Cível de São Paulo"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Classificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-freelaw-purple" />
                <span>Classificação</span>
              </CardTitle>
              <CardDescription>
                Defina a área jurídica, tipo de serviço e urgência
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="legalArea">Área Jurídica *</Label>
                  <Select value={formData.legalArea} onValueChange={(value) => handleInputChange('legalArea', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a área" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEGAL_AREAS.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="serviceType">Tipo de Serviço *</Label>
                  <Select value={formData.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="urgency">Urgência *</Label>
                  <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      {URGENCY_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center space-x-2">
                            <Badge className={level.color}>{level.label}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="complexity">Complexidade</Label>
                  <Select value={formData.complexity} onValueChange={(value) => handleInputChange('complexity', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a complexidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLEXITY_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-xs text-gray-500">{level.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requisitos Técnicos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-freelaw-purple" />
                <span>Requisitos Técnicos</span>
              </CardTitle>
              <CardDescription>
                Defina experiência necessária, prazos e requisitos específicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requiredExperience">Experiência Necessária</Label>
                  <Select value={formData.requiredExperience} onValueChange={(value) => handleInputChange('requiredExperience', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-xs text-gray-500">{level.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    min="1"
                    max="200"
                    value={formData.estimatedHours}
                    onChange={(e) => handleInputChange('estimatedHours', parseInt(e.target.value) || 4)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="deadline">Prazo Final</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="responseDeadline">Prazo para Resposta</Label>
                  <Input
                    id="responseDeadline"
                    type="datetime-local"
                    value={formData.responseDeadline}
                    onChange={(e) => handleInputChange('responseDeadline', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="deliveryDeadline">Prazo de Entrega</Label>
                  <Input
                    id="deliveryDeadline"
                    type="datetime-local"
                    value={formData.deliveryDeadline}
                    onChange={(e) => handleInputChange('deliveryDeadline', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Requisitos Específicos */}
              <div>
                <Label>Requisitos Específicos</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      placeholder="Ex: Experiência em contratos internacionais"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    />
                    <Button type="button" onClick={addRequirement} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {formData.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.requirements.map((req, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                          <span>{req}</span>
                          <button
                            type="button"
                            onClick={() => removeRequirement(index)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preço Calculado */}
          {(calculatedPrice !== null || isCalculating) && (
            <Card className="border-freelaw-purple/20 bg-gradient-to-r from-freelaw-purple/5 to-tech-blue/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-freelaw-purple" />
                  <span>Preço Calculado</span>
                </CardTitle>
                <CardDescription>
                  Valor automático baseado nos critérios definidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isCalculating ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin text-freelaw-purple" />
                    <span>Calculando preço...</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-freelaw-purple">
                      R$ {calculatedPrice?.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Baseado em {formData.estimatedHours}h × {formData.requiredExperience} × {formData.urgency}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Card>
            <CardContent className="p-6 text-center">
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-freelaw-purple to-tech-blue hover:from-freelaw-purple/90 hover:to-tech-blue/90 text-white font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Criando delegação...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Criar Delegação
                  </>
                )}
              </Button>
              
              {!isFormValid && (
                <p className="text-sm text-gray-600 mt-2">
                  Preencha os campos obrigatórios para continuar
                </p>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}



