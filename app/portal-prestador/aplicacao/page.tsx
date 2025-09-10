'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Brain,
  Target,
  Trophy,
  Clock,
  TrendingUp,
  Users,
  Briefcase,
  GraduationCap,
  Scale,
  Loader2
} from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

const STEPS = [
  { id: 1, title: 'Informações Pessoais', icon: Users },
  { id: 2, title: 'Experiência Profissional', icon: Briefcase },
  { id: 3, title: 'Motivação & Fit', icon: Brain },
  { id: 4, title: 'Disponibilidade & Expectativas', icon: Target },
  { id: 5, title: 'Revisão & Envio', icon: CheckCircle2 }
]

const SPECIALTIES = [
  'Direito Civil',
  'Direito Trabalhista',
  'Direito Penal',
  'Direito Tributário',
  'Direito Empresarial',
  'Direito do Consumidor',
  'Direito de Família',
  'Direito Imobiliário',
  'Direito Previdenciário',
  'Direito Ambiental',
  'Direito Digital',
  'Direito Administrativo'
]

export default function ApplicationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Step 1 - Personal Info
    fullName: '',
    email: '',
    phone: '',
    oabNumber: '',
    oabState: '',
    city: '',
    state: '',
    
    // Step 2 - Professional Experience
    yearsOfExperience: '',
    currentSituation: '',
    previousExperience: '',
    specialties: [] as string[],
    documentsPerMonth: '',
    strongestSkills: '',
    
    // Step 3 - Motivation & Fit
    whyJoinFreeLaw: '',
    whatExcitesYou: '',
    workStyle: '',
    qualityApproach: '',
    feedbackReaction: '',
    
    // Step 4 - Availability
    hoursPerWeek: '',
    workSchedule: '',
    expectedEarnings: '',
    growthPlans: '',
    startDate: '',
    
    // Terms
    acceptTerms: false,
    understandTest: false
  })

  const progress = (currentStep / STEPS.length) * 100

  // Load saved form data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('providerApplicationForm')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setFormData(parsed)
      } catch (e) {
        console.error('Failed to load saved form data')
      }
    }
  }, [])

  // Save form data whenever it changes
  useEffect(() => {
    localStorage.setItem('providerApplicationForm', JSON.stringify(formData))
  }, [formData])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Map form data to API format
      const apiData = {
        full_name: formData.fullName,
        cpf: '000.000.000-00', // TODO: Add CPF field to form
        birth_date: '1990-01-01', // TODO: Add birth date field to form
        phone: formData.phone,
        oab_number: formData.oabNumber,
        oab_state: formData.oabState,
        state: formData.state,
        city: formData.city,
        years_of_experience: parseInt(formData.yearsOfExperience) || 0,
        specialties: formData.specialties,
        summary: `${formData.previousExperience}\n\nMotivação: ${formData.whyJoinFreeLaw}`,
        weekly_availability: parseInt(formData.hoursPerWeek) || 40,
        work_preference: formData.workStyle === 'remoto' ? 'freelance' : 'full_time',
        expected_monthly_income: parseFloat(formData.expectedEarnings.replace(/[^\d]/g, '')) || 0,
        high_volume_interest: formData.documentsPerMonth === 'alto',
        massive_volume_interest: formData.documentsPerMonth === 'muito-alto',
        why_join: formData.whyJoinFreeLaw,
        email: formData.email
      }

      // Submit to backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/providers/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao enviar aplicação')
      }

      const result = await response.json()
      console.log('Application submitted successfully:', result)
      
      // Clear saved form data on successful submission
      localStorage.removeItem('providerApplicationForm')
      
      // Store provider ID for later use
      if (result.providerId) {
        localStorage.setItem('providerId', result.providerId)
      }
      
      router.push('/portal-prestador/aplicacao/sucesso')
    } catch (error) {
      console.error('Error submitting application:', error)
      alert(error instanceof Error ? error.message : 'Erro ao enviar aplicação. Por favor, tente novamente.')
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="João Silva"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="joao@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 98765-4321"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oabNumber">Número OAB *</Label>
                <div className="flex gap-2">
                  <Input
                    id="oabNumber"
                    value={formData.oabNumber}
                    onChange={(e) => handleInputChange('oabNumber', e.target.value)}
                    placeholder="123456"
                    className="flex-1"
                    required
                  />
                  <Select value={formData.oabState} onValueChange={(value) => handleInputChange('oabState', value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">SP</SelectItem>
                      <SelectItem value="RJ">RJ</SelectItem>
                      <SelectItem value="MG">MG</SelectItem>
                      <SelectItem value="RS">RS</SelectItem>
                      <SelectItem value="PR">PR</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="BA">BA</SelectItem>
                      <SelectItem value="PE">PE</SelectItem>
                      <SelectItem value="CE">CE</SelectItem>
                      <SelectItem value="DF">DF</SelectItem>
                      <SelectItem value="GO">GO</SelectItem>
                      <SelectItem value="ES">ES</SelectItem>
                      <SelectItem value="PA">PA</SelectItem>
                      <SelectItem value="MA">MA</SelectItem>
                      <SelectItem value="MT">MT</SelectItem>
                      <SelectItem value="MS">MS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="São Paulo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">São Paulo</SelectItem>
                    <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                    <SelectItem value="MG">Minas Gerais</SelectItem>
                    <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                    <SelectItem value="PR">Paraná</SelectItem>
                    <SelectItem value="SC">Santa Catarina</SelectItem>
                    <SelectItem value="BA">Bahia</SelectItem>
                    <SelectItem value="PE">Pernambuco</SelectItem>
                    <SelectItem value="CE">Ceará</SelectItem>
                    <SelectItem value="DF">Distrito Federal</SelectItem>
                    <SelectItem value="GO">Goiás</SelectItem>
                    <SelectItem value="ES">Espírito Santo</SelectItem>
                    <SelectItem value="PA">Pará</SelectItem>
                    <SelectItem value="MA">Maranhão</SelectItem>
                    <SelectItem value="MT">Mato Grosso</SelectItem>
                    <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Anos de Experiência em Advocacia *</Label>
                <Select value={formData.yearsOfExperience} onValueChange={(value) => handleInputChange('yearsOfExperience', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">Menos de 1 ano</SelectItem>
                    <SelectItem value="1-3">1 a 3 anos</SelectItem>
                    <SelectItem value="3-5">3 a 5 anos</SelectItem>
                    <SelectItem value="5-10">5 a 10 anos</SelectItem>
                    <SelectItem value="10+">Mais de 10 anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Situação Profissional Atual *</Label>
                <RadioGroup value={formData.currentSituation} onValueChange={(value) => handleInputChange('currentSituation', value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="employed" id="employed" />
                    <Label htmlFor="employed">Empregado em escritório/empresa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="autonomous" id="autonomous" />
                    <Label htmlFor="autonomous">Advogado autônomo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partner" id="partner" />
                    <Label htmlFor="partner">Sócio de escritório</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unemployed" id="unemployed" />
                    <Label htmlFor="unemployed">Sem atuação no momento</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student">Recém-formado</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Áreas de Especialização * (Selecione até 3)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SPECIALTIES.map(specialty => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={specialty}
                        checked={formData.specialties.includes(specialty)}
                        onCheckedChange={() => handleSpecialtyToggle(specialty)}
                        disabled={formData.specialties.length >= 3 && !formData.specialties.includes(specialty)}
                      />
                      <Label 
                        htmlFor={specialty}
                        className="text-sm cursor-pointer"
                      >
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentsPerMonth">Quantas peças você elabora por mês atualmente?</Label>
                <Input
                  id="documentsPerMonth"
                  value={formData.documentsPerMonth}
                  onChange={(e) => handleInputChange('documentsPerMonth', e.target.value)}
                  placeholder="Ex: 20-30 peças"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strongestSkills">Quais são suas maiores fortalezas como advogado? *</Label>
                <Textarea
                  id="strongestSkills"
                  value={formData.strongestSkills}
                  onChange={(e) => handleInputChange('strongestSkills', e.target.value)}
                  placeholder="Ex: Excelente argumentação jurídica, atenção aos detalhes, cumprimento de prazos..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <Alert className="border-olympic-gold/20 bg-olympic-gold/5">
              <Brain className="h-4 w-4 text-olympic-gold" />
              <AlertDescription className="text-sm">
                Esta é a parte mais importante da sua aplicação. Seja genuíno e específico em suas respostas.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="whyJoinFreeLaw">Por que você quer fazer parte da FreeLaw? *</Label>
                <Textarea
                  id="whyJoinFreeLaw"
                  value={formData.whyJoinFreeLaw}
                  onChange={(e) => handleInputChange('whyJoinFreeLaw', e.target.value)}
                  placeholder="Explique suas motivações, o que te atrai na nossa proposta e como isso se alinha com seus objetivos profissionais..."
                  rows={5}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">Mínimo 100 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatExcitesYou">O que mais te entusiasma na possibilidade de trabalhar com IA e tecnologia? *</Label>
                <Textarea
                  id="whatExcitesYou"
                  value={formData.whatExcitesYou}
                  onChange={(e) => handleInputChange('whatExcitesYou', e.target.value)}
                  placeholder="Como você vê a tecnologia transformando a advocacia? Como isso pode melhorar seu trabalho?"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Como você se descreve como profissional? *</Label>
                <RadioGroup value={formData.workStyle} onValueChange={(value) => handleInputChange('workStyle', value)}>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="detail-oriented" id="detail-oriented" className="mt-1" />
                      <div>
                        <Label htmlFor="detail-oriented" className="font-medium">Detalhista e Meticuloso</Label>
                        <p className="text-sm text-muted-foreground">Foco em precisão e qualidade, mesmo que leve mais tempo</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="efficient" id="efficient" className="mt-1" />
                      <div>
                        <Label htmlFor="efficient" className="font-medium">Eficiente e Produtivo</Label>
                        <p className="text-sm text-muted-foreground">Entrego volume com qualidade, otimizando processos</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="balanced" id="balanced" className="mt-1" />
                      <div>
                        <Label htmlFor="balanced" className="font-medium">Equilibrado</Label>
                        <p className="text-sm text-muted-foreground">Adapto meu estilo conforme a necessidade do caso</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualityApproach">Como você garante a qualidade do seu trabalho? *</Label>
                <Textarea
                  id="qualityApproach"
                  value={formData.qualityApproach}
                  onChange={(e) => handleInputChange('qualityApproach', e.target.value)}
                  placeholder="Descreva seu processo de revisão, como você se mantém atualizado, como lida com prazos apertados..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Como você reage a feedback e avaliações? *</Label>
                <RadioGroup value={formData.feedbackReaction} onValueChange={(value) => handleInputChange('feedbackReaction', value)}>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="growth" id="growth" className="mt-1" />
                      <div>
                        <Label htmlFor="growth" className="font-medium">Oportunidade de Crescimento</Label>
                        <p className="text-sm text-muted-foreground">Vejo feedback como essencial para melhorar</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="professional" id="professional" className="mt-1" />
                      <div>
                        <Label htmlFor="professional" className="font-medium">Profissional</Label>
                        <p className="text-sm text-muted-foreground">Aceito feedback construtivo de forma objetiva</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="selective" id="selective" className="mt-1" />
                      <div>
                        <Label htmlFor="selective" className="font-medium">Seletivo</Label>
                        <p className="text-sm text-muted-foreground">Analiso o feedback e aplico o que faz sentido</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hoursPerWeek">Quantas horas por semana você pode dedicar à FreeLaw? *</Label>
                <Select value={formData.hoursPerWeek} onValueChange={(value) => handleInputChange('hoursPerWeek', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10-20">10 a 20 horas</SelectItem>
                    <SelectItem value="20-30">20 a 30 horas</SelectItem>
                    <SelectItem value="30-40">30 a 40 horas</SelectItem>
                    <SelectItem value="40+">Mais de 40 horas (dedicação integral)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preferência de Horário de Trabalho *</Label>
                <RadioGroup value={formData.workSchedule} onValueChange={(value) => handleInputChange('workSchedule', value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="morning" id="morning" />
                    <Label htmlFor="morning">Manhã (6h - 12h)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="afternoon" id="afternoon" />
                    <Label htmlFor="afternoon">Tarde (12h - 18h)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="evening" id="evening" />
                    <Label htmlFor="evening">Noite (18h - 00h)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flexible" id="flexible" />
                    <Label htmlFor="flexible">Flexível - trabalho em qualquer horário</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedEarnings">Expectativa de Ganhos Mensais *</Label>
                <Select value={formData.expectedEarnings} onValueChange={(value) => handleInputChange('expectedEarnings', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000-2000">R$ 1.000 a R$ 2.000</SelectItem>
                    <SelectItem value="2000-4000">R$ 2.000 a R$ 4.000</SelectItem>
                    <SelectItem value="4000-6000">R$ 4.000 a R$ 6.000</SelectItem>
                    <SelectItem value="6000-10000">R$ 6.000 a R$ 10.000</SelectItem>
                    <SelectItem value="10000+">Mais de R$ 10.000</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Lembre-se: seus ganhos dependem da sua produtividade e qualidade
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="growthPlans">Onde você se vê na FreeLaw em 6 meses? *</Label>
                <Textarea
                  id="growthPlans"
                  value={formData.growthPlans}
                  onChange={(e) => handleInputChange('growthPlans', e.target.value)}
                  placeholder="Descreva suas metas de produção, nível que deseja alcançar, especialização..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Quando você pode começar? *</Label>
                <Select value={formData.startDate} onValueChange={(value) => handleInputChange('startDate', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediately">Imediatamente</SelectItem>
                    <SelectItem value="1week">Em 1 semana</SelectItem>
                    <SelectItem value="2weeks">Em 2 semanas</SelectItem>
                    <SelectItem value="1month">Em 1 mês</SelectItem>
                    <SelectItem value="2months">Em 2 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <Alert className="border-product-teal/20 bg-product-teal/5">
              <CheckCircle2 className="h-4 w-4 text-product-teal" />
              <AlertDescription>
                Revise suas informações antes de enviar. Após o envio, você receberá um e-mail com os próximos passos.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Próximos Passos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-full bg-olympic-gold/10 p-2">
                      <BookOpen className="h-4 w-4 text-olympic-gold" />
                    </div>
                    <div>
                      <p className="font-medium">1. Análise da Aplicação</p>
                      <p className="text-sm text-muted-foreground">
                        Nossa equipe analisará sua aplicação em até 48h
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="rounded-full bg-product-teal/10 p-2">
                      <Brain className="h-4 w-4 text-product-teal" />
                    </div>
                    <div>
                      <p className="font-medium">2. Teste Prático com IA</p>
                      <p className="text-sm text-muted-foreground">
                        Se aprovado, você receberá 5 casos para elaborar peças que serão avaliadas por nossa IA
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="rounded-full bg-product-pink/10 p-2">
                      <Trophy className="h-4 w-4 text-product-pink" />
                    </div>
                    <div>
                      <p className="font-medium">3. Início da Jornada</p>
                      <p className="text-sm text-muted-foreground">
                        Aprovado no teste, você começa com 30 peças/mês e pode crescer até 200+
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sistema de Progressão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="font-medium">Iniciante</span>
                      <span className="text-sm text-muted-foreground">30 peças/mês → R$ 1.200</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="font-medium">Júnior</span>
                      <span className="text-sm text-muted-foreground">50 peças/mês → R$ 2.000</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="font-medium">Pleno</span>
                      <span className="text-sm text-muted-foreground">100 peças/mês → R$ 4.000</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-olympic-gold/10 to-product-pink/10">
                      <span className="font-medium">Sênior</span>
                      <span className="text-sm font-medium">150 peças/mês → R$ 6.000+</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-olympic-gold/20 to-product-pink/20">
                      <span className="font-bold">Expert</span>
                      <span className="text-sm font-bold">200+ peças/mês → R$ 10.000+</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleInputChange('acceptTerms', checked)}
                  />
                  <Label htmlFor="acceptTerms" className="text-sm leading-relaxed">
                    Declaro que todas as informações fornecidas são verdadeiras e concordo com os{' '}
                    <a href="/termos" className="text-olympic-gold hover:underline">Termos de Uso</a> e{' '}
                    <a href="/privacidade" className="text-olympic-gold hover:underline">Política de Privacidade</a> da FreeLaw.
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="understandTest"
                    checked={formData.understandTest}
                    onCheckedChange={(checked) => handleInputChange('understandTest', checked)}
                  />
                  <Label htmlFor="understandTest" className="text-sm leading-relaxed">
                    Entendo que passarei por um teste prático de 5 peças avaliadas por IA e que minha aprovação 
                    depende da qualidade do meu trabalho.
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.email && formData.phone && 
               formData.oabNumber && formData.oabState && formData.city && formData.state
      case 2:
        return formData.yearsOfExperience && formData.currentSituation && 
               formData.specialties.length > 0 && formData.strongestSkills
      case 3:
        return formData.whyJoinFreeLaw.length >= 100 && formData.whatExcitesYou && 
               formData.workStyle && formData.qualityApproach && formData.feedbackReaction
      case 4:
        return formData.hoursPerWeek && formData.workSchedule && 
               formData.expectedEarnings && formData.growthPlans && formData.startDate
      case 5:
        return formData.acceptTerms && formData.understandTest
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-olympic-gold/5">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Aplicação FreeLaw</h1>
          <p className="text-muted-foreground">
            Junte-se a mais de 11.000 advogados que transformaram suas carreiras
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = step.id < currentStep
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full transition-colors
                    ${isActive ? 'bg-olympic-gold text-white' : ''}
                    ${isCompleted ? 'bg-product-teal text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
                  `}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`h-0.5 w-12 md:w-24 mx-2 transition-colors ${
                      isCompleted ? 'bg-product-teal' : 'bg-muted'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Title */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Precisamos conhecer você melhor"}
              {currentStep === 2 && "Conte-nos sobre sua experiência profissional"}
              {currentStep === 3 && "Esta é a parte mais importante da sua aplicação"}
              {currentStep === 4 && "Entenda como será sua rotina na FreeLaw"}
              {currentStep === 5 && "Revise suas informações e confirme sua aplicação"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed() || isSubmitting}
              className="bg-olympic-gold hover:bg-olympic-gold/90"
            >
              Próximo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="bg-gradient-to-r from-olympic-gold to-product-pink hover:from-olympic-gold/90 hover:to-product-pink/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar Aplicação
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}