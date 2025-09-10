'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOabMask } from '@/hooks/use-oab-mask'
import { 
  CheckCircle, 
  ArrowRight, 
  Search, 
  Loader2, 
  AlertCircle,
  Shield,
  Clock,
  FileText,
  Users,
  ChevronRight,
  Check,
  Newspaper,
  Brain
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const UF_OPTIONS = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
]

interface EscritorioInfo {
  responsavelNome: string
  escritorioNome: string
  email: string
  telefone: string
  site?: string
  oab: string
  uf: string
}

interface ProcessoInfo {
  numero_cnj: string
  titulo: string
  cliente: string
  tipo_cliente: 'AUTOR' | 'REU'
  valor_causa?: number
  data_inicio: string
  tribunal: string
}

interface ClienteInfo {
  nome: string
  cpf_cnpj?: string
  tipo_pessoa: 'FISICA' | 'JURIDICA'
  processos: string[]
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const oabMask = useOabMask()
  const [ufSelecionada, setUfSelecionada] = useState('')
  const [escritorioInfo, setEscritorioInfo] = useState<EscritorioInfo | null>(null)
  const [processos, setProcessos] = useState<ProcessoInfo[]>([])
  const [clientes, setClientes] = useState<ClienteInfo[]>([])
  const [publicacoes, setPublicacoes] = useState(0)
  const [progressoImportacao, setProgressoImportacao] = useState(0)

  const steps = [
    { id: 1, title: 'Dados do escritório', completed: step > 1 },
    { id: 2, title: 'Buscar processos', completed: step > 2 },
    { id: 3, title: 'Confirmar informações', completed: step > 3 },
    { id: 4, title: 'Começar a usar', completed: step > 4 }
  ]

  // Etapa 1: Validar OAB e confirmar dados
  const handleBuscarProcessos = async () => {
    if (!oabMask.getRawValue() || !ufSelecionada) {
      toast.error('Por favor, preencha o número da OAB e selecione a UF')
      return
    }

    if (!oabMask.isValid()) {
      toast.error('Por favor, insira um número de OAB válido (3 a 6 dígitos)')
      return
    }

    setLoading(true)
    try {
      // 1) Validar OAB via serviço CNAWS
      const validateRes = await fetch('/api/oab/validate-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oab: oabMask.getRawValue(), uf: ufSelecionada, persist: true })
      })
      const valData = await validateRes.json()
      if (!validateRes.ok) {
        throw new Error(valData.error || 'Falha ao validar OAB')
      }
      const st = (valData.status || 'DESCONHECIDO') as string
      if (!valData.valid) {
        toast.error(`OAB não encontrada. Verifique o número e UF informados.`)
        return
      }
      
      // Aceitar ATIVO ou DESCONHECIDO (quando não conseguimos determinar o status)
      if (st === 'SUSPENSO' || st === 'CANCELADO' || st === 'INEXISTENTE') {
        toast.error(`OAB encontrada, mas está ${st.toLowerCase()}. Entre em contato com a OAB para regularizar sua situação.`)
        return
      }
      
      // Mostrar mensagem informativa para status desconhecido
      if (st === 'DESCONHECIDO') {
        toast.success(`OAB ${oabMask.getRawValue()}/${ufSelecionada} encontrada! Não foi possível verificar o status automaticamente, mas prosseguiremos com o cadastro.`)
      } else {
        toast.success(`OAB ${oabMask.getRawValue()}/${ufSelecionada} validada com sucesso! Status: ${st}`)
      }

      // Preenche informações básicas do responsável
      const responsavelNome = valData.lawyer?.nome || `Advogado OAB ${oabMask.getRawValue()}/${ufSelecionada}`
      setEscritorioInfo({ 
        responsavelNome, 
        escritorioNome: '', 
        email: '', 
        telefone: '', 
        site: '',
        oab: oabMask.getRawValue(), 
        uf: ufSelecionada 
      })
      setProcessos([])
      setClientes([])
      setStep(2)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao validar OAB')
    } finally {
      setLoading(false)
    }
  }

  // Etapa 2: Confirmar dados do advogado -> buscar processos
  const handleConfirmarAdvogado = async () => {
    try {
      setLoading(true)
      
      // 1. Buscar processos via ComunicaAPI
      const response = await fetch('/api/onboarding/buscar-processos-comunicaapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oab: oabMask.getRawValue(), 
          uf: ufSelecionada,
          persist: true // Enable database persistence
        })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar processos')
      }
      setProcessos(data.processos || [])
      setClientes(data.clientes || [])
      setPublicacoes(data.publicacoes || 0)

      // Mostrar estatísticas dos dados encontrados
      const stats = data.estatisticas
      if (stats) {
        if (stats.total_publicacoes > 0) {
          toast.success(`📰 Encontradas ${stats.total_publicacoes} publicações dos últimos 30 dias!`)
        } else {
          toast.info('ℹ️ Nenhuma publicação encontrada nos últimos 30 dias')
        }
        
        if (stats.total_processos > 0) {
          toast.success(`⚖️ ${stats.total_processos} processos únicos identificados das publicações!`)
        }
        
        if (stats.total_clientes > 0) {
          toast.success(`👥 ${stats.total_clientes} clientes identificados automaticamente!`)
        }
        
        // Mostrar informações sobre persistência
        if (data.persistedData) {
          const persisted = data.persistedData
          toast.success(`💾 Dados salvos: ${persisted.processCount} processos, ${persisted.clientCount} clientes, ${persisted.publicationCount} publicações`)
        }
      }

    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao buscar processos')
      setLoading(false)
      return
    }
    setLoading(false)
    setStep(3)
    // Iniciar importação dos processos
    handleImportarProcessos()
  }

  // Etapa 3: Importar e processar todos os dados
  const handleImportarProcessos = async () => {
    setLoading(true)
    setProgressoImportacao(0)

    try {
      // Simular progresso de importação
      const totalItens = processos.length + clientes.length
      let processados = 0

      // Salvar advogado
      await fetch('/api/onboarding/salvar-advogado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(escritorioInfo)
      })

      // Salvar clientes
      for (const cliente of clientes) {
        await fetch('/api/onboarding/salvar-cliente', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cliente)
        })
        processados++
        setProgressoImportacao((processados / totalItens) * 100)
      }

      // Salvar processos
      for (const processo of processos) {
        await fetch('/api/onboarding/salvar-processo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(processo)
        })
        processados++
        setProgressoImportacao((processados / totalItens) * 100)
      }

      toast.success('Todos os dados foram importados com sucesso!')
      setStep(4)
    } catch (error) {
      toast.error('Erro ao importar dados')
    } finally {
      setLoading(false)
    }
  }

  // Finalizar onboarding
  const handleFinalizar = () => {
    router.push('/processes')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-purple/5">
      {/* Progress Steps */}
      <div className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all
                    ${step === s.id ? 'bg-freelaw-purple text-white' : 
                      s.completed ? 'bg-green-500 text-white' : 
                      'bg-gray-200 text-gray-400'}
                  `}>
                    {s.completed ? <Check className="w-5 h-5" /> : s.id}
                  </div>
                  <span className={`ml-3 font-medium ${
                    step === s.id ? 'text-freelaw-purple' : 
                    s.completed ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {s.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 mx-4 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Etapa 1: Cadastro OAB */}
        {step === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                Configure seu escritório em 2 minutos
              </CardTitle>
              <CardDescription className="text-lg mt-4">
                Insira a OAB do sócio responsável para importar todos os processos, clientes e publicações automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    OAB do Sócio Responsável
                  </label>
                  <Input
                    placeholder="Ex: 183.619"
                    value={oabMask.value}
                    onChange={(e) => oabMask.setValue(e.target.value)}
                    className="text-lg"
                    maxLength={7}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    UF da OAB
                  </label>
                  <Select value={ufSelecionada} onValueChange={setUfSelecionada}>
                    <SelectTrigger className="text-lg">
                      <SelectValue placeholder="Selecione a UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {UF_OPTIONS.map(uf => (
                        <SelectItem key={uf.value} value={uf.value}>
                          {uf.label} ({uf.value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleBuscarProcessos}
                disabled={loading || !oabMask.getRawValue() || !ufSelecionada}
                className="w-full h-12 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Validando OAB...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    VALIDAR OAB
                  </>
                )}
              </Button>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Por que a OAB do sócio responsável?</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                    <span>Importar automaticamente todos os processos do escritório</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                    <span>Monitorar publicações em nome do escritório nos diários oficiais</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                    <span>Identificar e organizar automaticamente todos os clientes</span>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <p className="text-xs text-yellow-800">
                    💡 <strong>Importante:</strong> As publicações ficam em nome do advogado, por isso precisamos da OAB do sócio responsável para capturar todos os dados do escritório.
                  </p>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Este dado é protegido e usado somente para localizar processos públicos nos tribunais
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Etapa 2: Confirmar dados do advogado */}
        {step === 2 && escritorioInfo && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Contadores visuais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center justify-center mb-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  {processos.length}
                </div>
                <div className="text-sm text-blue-600 font-medium">Processos</div>
                <div className="text-xs text-blue-500 mt-1">dos últimos 30 dias</div>
              </Card>

              <Card className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center justify-center mb-3">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-700 mb-1">
                  {clientes.length}
                </div>
                <div className="text-sm text-green-600 font-medium">Clientes</div>
                <div className="text-xs text-green-500 mt-1">identificados automaticamente</div>
              </Card>

              <Card className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center justify-center mb-3">
                  <Newspaper className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-700 mb-1">
                  {publicacoes}
                </div>
                <div className="text-sm text-purple-600 font-medium">Publicações</div>
                <div className="text-xs text-purple-500 mt-1">monitoradas nos diários</div>
              </Card>
            </div>

            {/* Explicação sobre os dados */}
            <Card className="bg-gradient-to-r from-freelaw-purple/5 to-freelaw-pink/5 border-freelaw-purple/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Brain className="w-6 h-6 text-freelaw-purple mt-1" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-freelaw-purple mb-2">
                      Como funciona nossa busca inteligente
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Buscamos automaticamente todos os processos e clientes das publicações que movimentaram nos últimos 30 dias usando a OAB informada.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Processos ativos e arquivados</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Clientes pessoa física e jurídica</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Publicações de todos os tribunais</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold">
                {processos.length > 0 ? 'Encontramos os processos!' : 'Configuração inicial'}
              </CardTitle>
              <CardDescription className="text-lg mt-4">
                {processos.length > 0 
                  ? 'Confira as informações abaixo. Se estiver tudo certo, é só confirmar para configurar seu sistema.'
                  : 'Não encontramos processos no momento, mas você pode continuar com a configuração.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{escritorioInfo.responsavelNome}</h3>
                  <CheckCircle className="w-6 h-6 text-blue-500" />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Inscrição:</span>
                    <p className="font-semibold">{escritorioInfo.oab}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">UF:</span>
                    <p className="font-semibold">{escritorioInfo.uf}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <p className="font-semibold">Sócio Responsável</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-freelaw-purple">
                          {processos.length}
                        </p>
                        <p className="text-sm text-gray-500">Processos encontrados</p>
                      </div>
                      <FileText className="w-8 h-8 text-freelaw-purple/20" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-blue-500">
                          {clientes.length}
                        </p>
                        <p className="text-sm text-gray-500">Clientes identificados</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500/20" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Voltar à tela anterior
                </Button>
                <Button 
                  onClick={handleConfirmarAdvogado}
                  className="flex-1"
                >
                  CONFIRMAR
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Etapa 3: Importando dados */}
        {step === 3 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <CardTitle className="text-3xl font-bold">
                Preparando seu ambiente
              </CardTitle>
              <CardDescription className="text-lg mt-4">
                Estamos importando seus processos e cadastrando seus clientes automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Progresso da importação</span>
                    <span className="text-sm text-gray-500">
                      {Math.round(progressoImportacao)}%
                    </span>
                  </div>
                  <Progress value={progressoImportacao} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Dados do advogado salvos</span>
                  </div>
                  <div className="flex items-center text-sm">
                    {progressoImportacao > 30 ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-blue-500 mr-3 animate-spin" />
                    )}
                    <span>Cadastrando {clientes.length} clientes</span>
                  </div>
                  <div className="flex items-center text-sm">
                    {progressoImportacao > 60 ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    ) : progressoImportacao > 30 ? (
                      <Loader2 className="w-5 h-5 text-blue-500 mr-3 animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400 mr-3" />
                    )}
                    <span>Importando {processos.length} processos</span>
                  </div>
                  <div className="flex items-center text-sm">
                    {progressoImportacao === 100 ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    ) : progressoImportacao > 60 ? (
                      <Loader2 className="w-5 h-5 text-blue-500 mr-3 animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400 mr-3" />
                    )}
                    <span>Vinculando clientes aos processos</span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este processo pode levar alguns minutos dependendo da quantidade de processos
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Etapa 4: Conclusão */}
        {step === 4 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-3xl font-bold">
                Parabéns! O Freelaw AI está pronto para acompanhar seu ritmo de advogado.
              </CardTitle>
              <CardDescription className="text-lg mt-4">
                Já estamos reunindo seus processos mais recentes e você pode começar a gerenciar os processos encontrados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 p-6 rounded-lg space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-semibold">Processos importados com sucesso</p>
                    <p className="text-sm text-gray-600">
                      {processos.length} processos foram adicionados ao sistema
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-semibold">Clientes cadastrados automaticamente</p>
                    <p className="text-sm text-gray-600">
                      {clientes.length} clientes foram identificados e cadastrados
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-semibold">Monitoramento ativado</p>
                    <p className="text-sm text-gray-600">
                      Você receberá notificações sobre movimentações dos processos
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleFinalizar}
                className="w-full h-12 text-lg"
              >
                VER MEUS PROCESSOS
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
