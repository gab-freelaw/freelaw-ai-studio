'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, ArrowRight, CheckCircle, FileText, GraduationCap, 
  User, Briefcase, MapPin, Calendar, Link as LinkIcon, Award,
  Clock, DollarSign, Building, AlertCircle, Shield, Loader2
} from 'lucide-react'
import { notification } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/client'
import { useOabMask } from '@/hooks/use-oab-mask'
import { UniversityAutocomplete } from '@/components/ui/university-autocomplete'
import { ProfileAutoFill } from '@/components/ui/profile-auto-fill'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

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

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const WEEK_DAYS = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
]

export default function ProviderSignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [oabVerified, setOabVerified] = useState(false)
  const oabMask = useOabMask()
  
  // Form data state
  const [formData, setFormData] = useState({
    // Step 1 - Personal Info
    fullName: '',
    cpf: '',
    birthDate: '',
    phone: '',
    email: '',
    password: '',
    
    // Step 2 - Professional Info
    oabState: '',
    university: '',
    universityRecommended: false,
    graduationYear: '',
    postGraduation: [] as string[],
    yearsOfExperience: '',
    summary: '',
    
    // Step 3 - Specialties
    mainSpecialty: '',
    specialties: [] as string[],
    servicesOffered: [] as string[],
    
    // Step 4 - Work Preferences
    workPreference: '',
    weeklyAvailability: '',
    availabilityDays: [] as string[],
    workOnHolidays: false,
    expectedMonthlyIncome: '',
    
    // Step 5 - Financial & Location
    hasCnpj: false,
    cnpj: '',
    companyName: '',
    canEmitInvoice: false,
    state: '',
    city: '',
    zipCode: '',
    
    // Step 6 - Professional Links & External Validation
    linkedinUrl: '',
    lattesUrl: '',
    websiteUrl: '',
    externalValidation: false,
    validationSource: '',
    
    // OAB Experience Validation
    experienceValidated: false,
    experienceAnalysis: null as any,
    
    // Step 7 - Motivação & Fit
    whyJoinFreeLaw: '',
    workStyle: '',
    qualityApproach: '',
    
    // Terms
    acceptTerms: false,
    acceptPrivacy: false
  })

  const totalSteps = 7

  // Salvamento automático no localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('providerRegistrationForm')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setFormData(prev => ({ ...prev, ...parsed }))
        if (parsed.oabNumber) {
          oabMask.setValue(parsed.oabNumber)
        }
      } catch (e) {
        console.error('Erro ao carregar dados salvos:', e)
      }
    }
  }, [])

  // Salvar dados sempre que o formulário mudar
  useEffect(() => {
    const dataToSave = {
      ...formData,
      oabNumber: oabMask.value
    }
    localStorage.setItem('providerRegistrationForm', JSON.stringify(dataToSave))
  }, [formData, oabMask.value])

  // Auto-fill experience when OAB is verified or LinkedIn/Lattes URLs change
  useEffect(() => {
    if (oabVerified && !formData.experienceValidated) {
      // Delay para dar tempo do usuário preencher LinkedIn/Lattes se quiser
      const timer = setTimeout(() => {
        autoFillExperience()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [oabVerified, formData.linkedinUrl, formData.lattesUrl, autoFillExperience, formData.experienceValidated])

  const handleExternalDataExtracted = (data: any) => {
    // Aplicar dados extraídos ao formulário
    setFormData(prev => ({
      ...prev,
      // Informações pessoais
      fullName: data.personalInfo?.name || prev.fullName,
      summary: data.personalInfo?.summary || prev.summary,
      
      // Experiência profissional
      yearsOfExperience: data.professional?.totalExperience?.toString() || prev.yearsOfExperience,
      
      // Especialidades (se extraídas)
      specialties: data.professional?.specialties?.length > 0 
        ? [...new Set([...prev.specialties, ...data.professional.specialties])]
        : prev.specialties,
      
      // Universidade (se extraída da educação)
      university: data.academic?.education?.[0]?.institution || prev.university,
      graduationYear: data.academic?.education?.[0]?.year || prev.graduationYear,
      
      // Validação externa
      externalValidation: true,
      validationSource: data.validation?.source || 'unknown'
    }))
    
    toast.success('Perfil atualizado com dados externos!')
  }

  // Função para buscar e pré-preencher experiência automaticamente
  const autoFillExperience = useCallback(async () => {
    if (!oabMask.getRawValue() || !formData.oabState || !oabVerified) {
      return
    }

    try {
      // 1. Buscar experiência via OAB (ComunicaAPI)
      const oabResponse = await fetch('/api/providers/validate-oab-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oabNumber: oabMask.getRawValue(),
          oabState: formData.oabState,
          daysBack: 30
        }),
      })

      if (oabResponse.ok) {
        const oabData = await oabResponse.json()
        const analysis = oabData.analysis

        // Pré-preencher especialidades baseadas nas publicações OAB
        if (analysis.legalAreas && analysis.legalAreas.length > 0) {
          const mainSpecialty = analysis.legalAreas[0].area
          const specialties = analysis.legalAreas.slice(0, 5).map((area: any) => area.area)
          
          setFormData(prev => ({
            ...prev,
            mainSpecialty,
            specialties,
            experienceValidated: true,
            experienceAnalysis: analysis,
            // Inferir anos de experiência baseado no nível
            yearsOfExperience: analysis.experienceLevel === 'especialista' ? '10+' :
                              analysis.experienceLevel === 'experiente' ? '5-10' :
                              analysis.experienceLevel === 'intermediário' ? '2-5' : '0-2'
          }))

          toast.success(`🎯 Experiência detectada via OAB: ${analysis.experienceLevel}. Áreas: ${specialties.slice(0, 2).join(', ')}.`)
        }
      }

      // 2. Buscar dados do LinkedIn se disponível
      if (formData.linkedinUrl) {
        const linkedinResponse = await fetch('/api/providers/scrape-linkedin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formData.linkedinUrl }),
        })

        if (linkedinResponse.ok) {
          const linkedinData = await linkedinResponse.json()
          if (linkedinData.success) {
            setFormData(prev => ({
              ...prev,
              fullName: linkedinData.data.fullName || prev.fullName,
              summary: linkedinData.data.summary || prev.summary,
              yearsOfExperience: linkedinData.data.yearsOfExperience || prev.yearsOfExperience,
              externalValidation: true,
              validationSource: prev.validationSource ? `${prev.validationSource}, LinkedIn` : 'LinkedIn'
            }))
            toast.success('📄 Dados do LinkedIn integrados!')
          }
        }
      }

      // 3. Buscar dados do Lattes se disponível
      if (formData.lattesUrl) {
        const lattesResponse = await fetch('/api/providers/scrape-lattes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formData.lattesUrl }),
        })

        if (lattesResponse.ok) {
          const lattesData = await lattesResponse.json()
          if (lattesData.success) {
      setFormData(prev => ({
        ...prev,
              fullName: lattesData.data.fullName || prev.fullName,
              university: lattesData.data.university || prev.university,
              graduationYear: lattesData.data.graduationYear || prev.graduationYear,
              postGraduation: [...new Set([...prev.postGraduation, ...(lattesData.data.postGraduation || [])])],
              externalValidation: true,
              validationSource: prev.validationSource ? `${prev.validationSource}, Lattes` : 'Lattes'
            }))
            toast.success('🎓 Dados do Lattes integrados!')
          }
        }
      }

    } catch (error: any) {
      console.error('Erro ao buscar experiência:', error)
      // Não mostrar erro para o usuário, é um processo automático
    }
  }, [oabMask, formData.oabState, formData.linkedinUrl, formData.lattesUrl, oabVerified])

  const verifyOAB = async () => {
    if (!oabMask.getRawValue() || !formData.oabState) {
      toast.error('Por favor, preencha o número da OAB e selecione a UF')
      return
    }
    
    if (!oabMask.isValid()) {
      toast.error('Por favor, insira um número de OAB válido (3 a 6 dígitos)')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/oab/validate-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oab: oabMask.getRawValue(),
          uf: formData.oabState,
          persist: true
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro na validação da OAB')
      }

      const status = (data.status || 'DESCONHECIDO') as string
      
      if (!data.valid) {
        toast.error(`OAB não encontrada. Verifique o número e UF informados.`)
        return
      }

      if (status === 'SUSPENSO' || status === 'CANCELADO' || status === 'INEXISTENTE') {
        toast.error(`OAB encontrada, mas está ${status.toLowerCase()}. Entre em contato com a OAB para regularizar sua situação.`)
        return
      }

      setOabVerified(true)
      
      if (status === 'DESCONHECIDO') {
        toast.success(`OAB ${oabMask.getRawValue()}/${formData.oabState} encontrada! Não foi possível verificar o status automaticamente, mas prosseguiremos com o cadastro.`)
      } else {
        toast.success(`OAB ${oabMask.getRawValue()}/${formData.oabState} validada com sucesso! Status: ${status}`)
      }

      // Auto-fill name if available
      if (data.lawyer?.nome) {
        setFormData(prev => ({
          ...prev,
          fullName: prev.fullName || data.lawyer.nome
        }))
      }
    } catch (error: any) {
      console.error('Erro ao validar OAB:', error)
      toast.error(error.message || 'Erro ao validar OAB. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      notification.error('Você deve aceitar os termos para continuar')
      return
    }

    // Validação da universidade (silenciosa no backend)
    if (!formData.universityRecommended) {
      toast.error(
        'Ops! Para garantir a qualidade dos nossos serviços, atualmente trabalhamos apenas com advogados formados em universidades com o Selo de Qualidade OAB. Agradecemos seu interesse!',
        { duration: 8000 }
      )
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'provider'
          }
        }
      })

      if (authError) throw authError

      // Create provider profile
      const { error: profileError } = await supabase
        .from('provider_profiles')
        .insert({
          user_id: authData.user?.id,
          full_name: formData.fullName,
          cpf: formData.cpf,
          birth_date: formData.birthDate,
          phone: formData.phone,
          oab_number: formData.oabNumber,
          oab_state: formData.oabState,
          oab_verified: oabVerified,
          university: formData.university,
          university_recommended: formData.universityRecommended,
          graduation_year: parseInt(formData.graduationYear),
          post_graduation: formData.postGraduation,
          years_of_experience: parseInt(formData.yearsOfExperience),
          summary: formData.summary,
          main_specialty: formData.mainSpecialty,
          specialties: formData.specialties,
          services_offered: formData.servicesOffered,
          work_preference: formData.workPreference,
          weekly_availability: parseInt(formData.weeklyAvailability),
          availability_days: formData.availabilityDays,
          work_on_holidays: formData.workOnHolidays,
          expected_monthly_income: parseFloat(formData.expectedMonthlyIncome),
          has_cnpj: formData.hasCnpj,
          cnpj: formData.cnpj,
          company_name: formData.companyName,
          can_emit_invoice: formData.canEmitInvoice,
          state: formData.state,
          city: formData.city,
          zip_code: formData.zipCode,
          linkedin_url: formData.linkedinUrl,
          lattes_url: formData.lattesUrl,
          website_url: formData.websiteUrl,
          external_validation: formData.externalValidation,
          validation_source: formData.validationSource,
          experience_validated: formData.experienceValidated,
          experience_analysis: formData.experienceAnalysis,
          status: 'pending_approval',
          assessment_status: 'pending'
        })

      if (profileError) throw profileError

      notification.success('Cadastro realizado com sucesso!')
      router.push('/portal-prestador/avaliacao')
    } catch (error: any) {
      notification.error('Erro ao realizar cadastro', { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
  return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-freelaw-purple" />
                Informações Pessoais
              </h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="João da Silva"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthDate">Data de Nascimento *</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(11) 98765-4321"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-freelaw-purple" />
                Informações Profissionais
              </h3>
              
              {/* Informação sobre preenchimento automático */}
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    <strong>Preenchimento Inteligente:</strong> Após validar sua OAB, preencheremos automaticamente 
                    suas especialidades e experiência baseado nas suas publicações oficiais. 
                    Você também pode adicionar LinkedIn e Lattes abaixo para dados complementares.
                  </p>
                </div>
              </div>
              
              <div className="grid gap-4">
                <div>
                  <Label>OAB *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Número"
                      value={formData.oabNumber}
                      onChange={(e) => setFormData({...formData, oabNumber: e.target.value})}
                      className="flex-1"
                    />
                    <Select
                      value={formData.oabState}
                      onValueChange={(value) => setFormData({...formData, oabState: value})}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={verifyOAB}
                      disabled={isLoading || oabVerified}
                      variant={oabVerified ? "default" : "outline"}
                      className={oabVerified ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {oabVerified ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verificada
                        </>
                      ) : (
                        'Verificar'
                      )}
                    </Button>
                  </div>
                  {oabVerified && (
                    <p className="text-sm text-green-600 mt-1">✓ OAB verificada e ativa</p>
                  )}
                </div>

                {/* Campos de LinkedIn e Lattes para preenchimento automático */}
                {oabVerified && (
                  <div className="grid gap-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon className="h-4 w-4 text-freelaw-purple" />
                      <h4 className="font-medium text-gray-900">Links Profissionais (Opcional)</h4>
                      <span className="text-xs text-gray-500">Para preenchimento automático</span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="linkedinUrl">LinkedIn</Label>
                        <Input
                          id="linkedinUrl"
                          value={formData.linkedinUrl}
                          onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                          placeholder="https://linkedin.com/in/seu-perfil"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="lattesUrl">Currículo Lattes</Label>
                        <Input
                          id="lattesUrl"
                          value={formData.lattesUrl}
                          onChange={(e) => setFormData({...formData, lattesUrl: e.target.value})}
                          placeholder="http://lattes.cnpq.br/0000000000000000"
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600">
                      💡 Adicionando esses links, preencheremos automaticamente suas informações de experiência 
                      e especialidades baseado no seu perfil profissional.
                    </p>
                  </div>
                )}
                
                <UniversityAutocomplete
                  value={formData.university}
                  onChange={(university, isRecommended) => 
                    setFormData({
                      ...formData, 
                      university,
                      universityRecommended: isRecommended
                    })
                  }
                  label="Instituição de Ensino"
                  placeholder="Digite o nome da sua universidade..."
                  required
                />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="graduationYear">Ano de Formatura *</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={formData.graduationYear}
                      onChange={(e) => setFormData({...formData, graduationYear: e.target.value})}
                      placeholder="2015"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearsOfExperience">Anos de Experiência *</Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      min="0"
                      value={formData.yearsOfExperience}
                      onChange={(e) => setFormData({...formData, yearsOfExperience: e.target.value})}
                      placeholder="5"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="summary">Resumo Profissional *</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData({...formData, summary: e.target.value})}
                    placeholder="Descreva sua experiência profissional, principais casos, especializações..."
                    rows={4}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-freelaw-purple" />
                Áreas de Atuação
              </h3>
              
              {/* Indicador de dados pré-preenchidos */}
              {formData.experienceValidated && formData.experienceAnalysis && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-800 mb-1">
                        ✨ Experiência detectada automaticamente
                      </h4>
                      <p className="text-xs text-green-700 mb-3">
                        Baseado nas suas publicações OAB{formData.validationSource ? `, ${formData.validationSource}` : ''}. 
                        Você pode editar as informações abaixo se necessário.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-medium text-green-800">Nível:</span> 
                          <span className="ml-1 capitalize">{formData.experienceAnalysis.experienceLevel}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Publicações:</span> 
                          <span className="ml-1">{formData.experienceAnalysis.totalPublications}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Processos:</span> 
                          <span className="ml-1">{formData.experienceAnalysis.uniqueProcesses}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Confiabilidade:</span> 
                          <span className="ml-1 capitalize">{formData.experienceAnalysis.reliability}</span>
                        </div>
                      </div>
                      
                      {formData.experienceAnalysis.legalAreas.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <span className="text-xs font-medium text-green-800">Áreas detectadas:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData.experienceAnalysis.legalAreas.slice(0, 5).map((area: any, idx: number) => (
                              <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {area.area} ({area.count})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="mainSpecialty">Especialidade Principal *</Label>
                  <Select
                    value={formData.mainSpecialty}
                    onValueChange={(value) => setFormData({...formData, mainSpecialty: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua área principal" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map(specialty => (
                        <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Outras Áreas de Atuação</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {SPECIALTIES.filter(s => s !== formData.mainSpecialty).map(specialty => (
                      <div key={specialty} className="flex items-center space-x-2">
                        <Checkbox
                          id={specialty}
                          checked={formData.specialties.includes(specialty)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                specialties: [...formData.specialties, specialty]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                specialties: formData.specialties.filter(s => s !== specialty)
                              })
                            }
                          }}
                        />
                        <Label htmlFor={specialty} className="text-sm font-normal cursor-pointer">
                          {specialty}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-freelaw-purple" />
                Preferências de Trabalho
              </h3>
              <div className="grid gap-4">
                <div>
                  <Label>Como você prefere trabalhar? *</Label>
                  <RadioGroup
                    value={formData.workPreference}
                    onValueChange={(value) => setFormData({...formData, workPreference: value})}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full_time" id="full_time" />
                      <Label htmlFor="full_time">Tempo integral</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="part_time" id="part_time" />
                      <Label htmlFor="part_time">Meio período</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="freelance" id="freelance" />
                      <Label htmlFor="freelance">Freelance</Label>
                  </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="on_demand" id="on_demand" />
                      <Label htmlFor="on_demand">Por demanda</Label>
                  </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="weeklyAvailability">Disponibilidade semanal (horas) *</Label>
                  <Input
                    id="weeklyAvailability"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.weeklyAvailability}
                    onChange={(e) => setFormData({...formData, weeklyAvailability: e.target.value})}
                    placeholder="20"
                    required
                  />
                </div>

                <div>
                  <Label>Dias disponíveis para trabalho *</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {WEEK_DAYS.map(day => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.value}
                          checked={formData.availabilityDays.includes(day.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                availabilityDays: [...formData.availabilityDays, day.value]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                availabilityDays: formData.availabilityDays.filter(d => d !== day.value)
                              })
                            }
                          }}
                        />
                        <Label htmlFor={day.value} className="text-sm font-normal cursor-pointer">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="workOnHolidays"
                      checked={formData.workOnHolidays}
                    onCheckedChange={(checked) => setFormData({...formData, workOnHolidays: checked as boolean})}
                    />
                  <Label htmlFor="workOnHolidays" className="font-normal">
                    Disponível para trabalhar em feriados e finais de semana
                    </Label>
                  </div>
                
                <div>
                  <Label htmlFor="expectedMonthlyIncome">Expectativa de renda mensal (R$) *</Label>
                  <Input
                    id="expectedMonthlyIncome"
                    type="number"
                    min="0"
                    value={formData.expectedMonthlyIncome}
                    onChange={(e) => setFormData({...formData, expectedMonthlyIncome: e.target.value})}
                    placeholder="5000"
                    required
                  />
                </div>
              </div>
            </div>
                  </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building className="h-5 w-5 text-freelaw-purple" />
                Informações Fiscais e Localização
              </h3>
              <div className="grid gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasCnpj"
                    checked={formData.hasCnpj}
                    onCheckedChange={(checked) => setFormData({...formData, hasCnpj: checked as boolean})}
                  />
                  <Label htmlFor="hasCnpj" className="font-normal">
                    Possuo CNPJ
                  </Label>
                </div>
                
                {formData.hasCnpj && (
                  <>
                    <div>
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyName">Razão Social</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        placeholder="Escritório de Advocacia João Silva ME"
                      />
                </div>
              </>
            )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canEmitInvoice"
                    checked={formData.canEmitInvoice}
                    onCheckedChange={(checked) => setFormData({...formData, canEmitInvoice: checked as boolean})}
                  />
                  <Label htmlFor="canEmitInvoice" className="font-normal">
                    Posso emitir nota fiscal
                  </Label>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData({...formData, state: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
              <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="São Paulo"
                      required
                    />
                  </div>
              </div>

              <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-freelaw-purple" />
                Website e Termos
              </h3>
              <div className="grid gap-4">
                
              <div>
                  <Label htmlFor="websiteUrl">Website Profissional</Label>
                  <Input
                    id="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                    placeholder="https://seu-site.com.br"
                  />
              </div>
                
                <Alert className="border-freelaw-purple/20 bg-freelaw-purple/5">
                  <AlertCircle className="h-4 w-4 text-freelaw-purple" />
                  <AlertDescription>
                    <strong>Próximo passo:</strong> Após o cadastro, você fará uma avaliação prática onde deverá 
                    elaborar uma peça jurídica de acordo com sua especialidade principal. Nossa IA analisará 
                    a qualidade técnica, argumentação e formatação. A aprovação é necessária para começar a receber trabalhos.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3 pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => setFormData({...formData, acceptTerms: checked as boolean})}
                    />
                    <Label htmlFor="acceptTerms" className="text-sm font-normal">
                      Li e aceito os <a href="/terms" className="text-freelaw-purple hover:underline" target="_blank">Termos de Uso</a>
                    </Label>
            </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acceptPrivacy"
                      checked={formData.acceptPrivacy}
                      onCheckedChange={(checked) => setFormData({...formData, acceptPrivacy: checked as boolean})}
                    />
                    <Label htmlFor="acceptPrivacy" className="text-sm font-normal">
                      Li e aceito a <a href="/privacy" className="text-freelaw-purple hover:underline" target="_blank">Política de Privacidade</a>
                    </Label>
              </div>
            </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-white dark:from-freelaw-black dark:via-background dark:to-tech-blue py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <Link href="/portal-prestador">
            <Image
              src="/logo-color.png"
              alt="Freelaw"
              width={180}
              height={54}
              className="h-12 w-auto mx-auto mb-6"
              priority
            />
          </Link>
          <h1 className="text-3xl font-bold mb-2">Cadastro de Advogado Prestador</h1>
          <p className="text-muted-foreground">
            Complete seu perfil profissional para começar a trabalhar com a Freelaw
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Etapa {currentStep} de {totalSteps}</CardTitle>
              <span className="text-sm text-muted-foreground">
                {Math.round((currentStep / totalSteps) * 100)}% completo
              </span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2 bg-freelaw-purple/20" />
          </CardHeader>
          
          <CardContent>
            {renderStepContent()}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isLoading}
                className="border-freelaw-purple/20 hover:border-freelaw-purple/40"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              
              <Button
                onClick={nextStep}
                disabled={isLoading}
                className="bg-freelaw-purple hover:bg-freelaw-purple/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    {currentStep === totalSteps ? 'Finalizar Cadastro' : 'Próximo'}
                    {currentStep < totalSteps && <ArrowRight className="h-4 w-4 ml-2" />}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}