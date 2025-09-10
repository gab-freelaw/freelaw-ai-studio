'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  FileText, 
  Clock, 
  CheckCircle,
  Calendar,
  User,
  Building,
  Download,
  UserPlus,
  FileX
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Publicacao {
  id: string
  numero_processo: string
  tribunal: string
  data_publicacao: string
  conteudo: string
  tipo_movimento: string
  destinatarios: string[]
  advogados_mencionados: string[]
  prazo_dias?: number
  urgente: boolean
  status: 'nova' | 'lida' | 'processada'
}

interface BuscaParams {
  oab_numero: string
  oab_uf: string
  data_inicio?: string
  data_fim?: string
  tribunal?: string
  numero_processo?: string
  tipo_movimento?: string
}

export default function PublicacoesPage() {
  const { toast } = useToast()
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([])
  const [publicacoesUrgentes, setPublicacoesUrgentes] = useState<Publicacao[]>([])
  const [loading, setLoading] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [selectedPublicacoes, setSelectedPublicacoes] = useState<string[]>([])
  
  const [buscaParams, setBuscaParams] = useState<BuscaParams>({
    oab_numero: '',
    oab_uf: 'SP',
  })

  const [resumoUrgentes, setResumoUrgentes] = useState({
    com_prazo: 0,
    sem_prazo: 0,
    vencendo_hoje: 0,
    vencendo_amanha: 0,
    vencendo_semana: 0
  })

  // Carregar publicações urgentes ao inicializar
  useEffect(() => {
    carregarPublicacoesUrgentes()
  }, [])

  const buscarPublicacoes = async () => {
    if (!buscaParams.oab_numero || !buscaParams.oab_uf) {
      toast({
        title: "Erro",
        description: "Informe o número da OAB e UF",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams(buscaParams as any)
      const response = await fetch(`/api/publicacoes/comunica?${params}`)
      const result = await response.json()

      if (response.ok) {
        setPublicacoes(result.data.comunicacoes)
        toast({
          title: "Sucesso",
          description: result.message,
        })
        // Recarregar urgentes após busca
        await carregarPublicacoesUrgentes()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao buscar publicações: ${error}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarPublicacoesUrgentes = async () => {
    try {
      const response = await fetch('/api/publicacoes/urgentes')
      const result = await response.json()

      if (response.ok) {
        setPublicacoesUrgentes(result.data.publicacoes_urgentes)
        setResumoUrgentes(result.data.resumo)
      }
    } catch (error) {
      console.error('Erro ao carregar publicações urgentes:', error)
    }
  }

  const processarPublicacoes = async (criarProcessos = true, criarClientes = true) => {
    if (selectedPublicacoes.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma publicação para processar",
        variant: "destructive",
      })
      return
    }

    setProcessando(true)
    try {
      const response = await fetch('/api/publicacoes/processar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicacoes_ids: selectedPublicacoes,
          criar_processos: criarProcessos,
          criar_clientes: criarClientes,
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: result.message,
        })
        setSelectedPublicacoes([])
        await carregarPublicacoesUrgentes()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao processar publicações: ${error}`,
        variant: "destructive",
      })
    } finally {
      setProcessando(false)
    }
  }

  const marcarComoLida = async (publicacaoIds: string[]) => {
    try {
      const response = await fetch('/api/publicacoes/urgentes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicacao_ids: publicacaoIds })
      })

      if (response.ok) {
        await carregarPublicacoesUrgentes()
        toast({
          title: "Sucesso",
          description: "Publicações marcadas como lidas",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao marcar como lida",
        variant: "destructive",
      })
    }
  }

  const formatarDataPrazo = (dataPublicacao: string, prazoDias?: number) => {
    if (!prazoDias) return 'Sem prazo'
    
    const data = new Date(dataPublicacao)
    data.setDate(data.getDate() + prazoDias)
    
    const hoje = new Date()
    const diffDays = Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `Vencido há ${Math.abs(diffDays)} dias`
    if (diffDays === 0) return 'Vence hoje'
    if (diffDays === 1) return 'Vence amanhã'
    return `${diffDays} dias restantes`
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'nova': 'destructive',
      'lida': 'secondary',
      'processada': 'default'
    } as const
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'nova' ? 'Nova' : status === 'lida' ? 'Lida' : 'Processada'}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Publicações</h1>
          <p className="text-gray-600">
            Gerencie publicações judiciais usando a Comunica API do PJE
          </p>
        </div>
        <Button onClick={carregarPublicacoesUrgentes} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="urgentes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="urgentes">
            Urgentes ({publicacoesUrgentes.length})
          </TabsTrigger>
          <TabsTrigger value="buscar">Buscar Publicações</TabsTrigger>
          <TabsTrigger value="processar">Processar ({selectedPublicacoes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="urgentes" className="space-y-4">
          {/* Resumo de Publicações Urgentes */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">Vencendo Hoje</p>
                    <p className="text-2xl font-bold text-red-600">{resumoUrgentes.vencendo_hoje}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Vencendo Amanhã</p>
                    <p className="text-2xl font-bold text-orange-600">{resumoUrgentes.vencendo_amanha}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Esta Semana</p>
                    <p className="text-2xl font-bold text-yellow-600">{resumoUrgentes.vencendo_semana}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Com Prazo</p>
                    <p className="text-2xl font-bold text-blue-600">{resumoUrgentes.com_prazo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileX className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Sem Prazo</p>
                    <p className="text-2xl font-bold text-gray-600">{resumoUrgentes.sem_prazo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Publicações Urgentes */}
          <div className="space-y-4">
            {publicacoesUrgentes.map((pub) => (
              <Card key={pub.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{pub.numero_processo}</CardTitle>
                      <CardDescription className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Building className="w-3 h-3 mr-1" />
                          {pub.tribunal}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(pub.data_publicacao).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatarDataPrazo(pub.data_publicacao, pub.prazo_dias)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {pub.urgente && <Badge variant="destructive">Urgente</Badge>}
                      {getStatusBadge(pub.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-3">{pub.conteudo.substring(0, 200)}...</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedPublicacoes.includes(pub.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPublicacoes([...selectedPublicacoes, pub.id])
                          } else {
                            setSelectedPublicacoes(selectedPublicacoes.filter(id => id !== pub.id))
                          }
                        }}
                      />
                      <Label className="text-sm">Selecionar</Label>
                    </div>
                    {pub.status === 'nova' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => marcarComoLida([pub.id])}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Marcar como Lida
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {publicacoesUrgentes.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma publicação urgente</h3>
                  <p className="text-gray-600">Todas as publicações estão em dia!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="buscar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Novas Publicações</CardTitle>
              <CardDescription>
                Digite os dados da OAB para buscar publicações na Comunica API do PJE
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="oab_numero">Número da OAB</Label>
                  <Input
                    id="oab_numero"
                    placeholder="Ex: 123456"
                    value={buscaParams.oab_numero}
                    onChange={(e) => setBuscaParams({ ...buscaParams, oab_numero: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oab_uf">UF da OAB</Label>
                  <Input
                    id="oab_uf"
                    placeholder="Ex: SP"
                    value={buscaParams.oab_uf}
                    onChange={(e) => setBuscaParams({ ...buscaParams, oab_uf: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data Início (opcional)</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={buscaParams.data_inicio || ''}
                    onChange={(e) => setBuscaParams({ ...buscaParams, data_inicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_fim">Data Fim (opcional)</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={buscaParams.data_fim || ''}
                    onChange={(e) => setBuscaParams({ ...buscaParams, data_fim: e.target.value })}
                  />
                </div>
              </div>
              
              <Button onClick={buscarPublicacoes} disabled={loading} className="w-full">
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Buscar Publicações
              </Button>
            </CardContent>
          </Card>

          {publicacoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados da Busca ({publicacoes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {publicacoes.map((pub) => (
                    <div key={pub.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{pub.numero_processo}</h4>
                        <div className="flex items-center space-x-2">
                          {pub.urgente && <Badge variant="destructive">Urgente</Badge>}
                          {getStatusBadge(pub.status)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{pub.conteudo.substring(0, 150)}...</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{pub.tribunal}</span>
                        <span>{formatarDataPrazo(pub.data_publicacao, pub.prazo_dias)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processar Publicações Selecionadas</CardTitle>
              <CardDescription>
                Extrair automaticamente processos e clientes das publicações selecionadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPublicacoes.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Selecione publicações na aba "Urgentes" para processá-las aqui.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    {selectedPublicacoes.length} publicação(ões) selecionada(s)
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => processarPublicacoes(true, true)}
                      disabled={processando}
                      className="w-full"
                    >
                      {processando ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Criar Processos + Clientes
                    </Button>
                    
                    <Button
                      onClick={() => processarPublicacoes(true, false)}
                      disabled={processando}
                      variant="outline"
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Apenas Processos
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}




