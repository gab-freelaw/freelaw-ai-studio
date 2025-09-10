'use client'

import { AppLayout } from '@/components/layouts/app-layout'

import { useState, useEffect } from 'react'
import { Bell, Calendar, Clock, FileText, AlertTriangle, Eye, Download, Filter, CheckCircle, XCircle } from 'lucide-react'
import { escavadorService, type Publicacao } from '@/lib/services/escavador.service'
import { toast } from 'sonner'

interface PublicacaoComAnalise extends Publicacao {
  analise?: {
    prazo_calculado: string | null
    acao_sugerida: string
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
    fundamentacao_legal: string
    template_peca?: string
  }
  lida?: boolean
  respondida?: boolean
}

function PublicationsContent() {
  const [publicacoes, setPublicacoes] = useState<PublicacaoComAnalise[]>([])
  const [loading, setLoading] = useState(false)
  const [filterTipo, setFilterTipo] = useState<string>('TODOS')
  const [filterUrgencia, setFilterUrgencia] = useState<string>('TODOS')
  const [selectedPublicacao, setSelectedPublicacao] = useState<PublicacaoComAnalise | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [monitoringActive, setMonitoringActive] = useState(true)

  // OAB configuration
  const OAB_NUMERO = '183619'
  const OAB_UF = 'MG'

  useEffect(() => {
    loadMockPublications()
    // In production, would set up real-time monitoring
    const interval = setInterval(() => {
      if (monitoringActive) {
        checkNewPublications()
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [monitoringActive])

  const loadMockPublications = async () => {
    const mockPublicacoes: PublicacaoComAnalise[] = [
      {
        id: '1',
        numero_processo: '1234567-12.2024.8.26.0100',
        data_publicacao: new Date().toISOString().split('T')[0],
        tipo: 'INTIMACAO',
        conteudo: 'Intimação da parte autora para manifestação sobre os documentos juntados pela parte ré no prazo de 15 dias.',
        orgao: 'TJSP - 12ª Vara Cível',
        diario: 'DJE-SP',
        pagina: 1234,
        prazo_dias: 15,
        data_limite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        advogados_intimados: ['Dr. Gabriel Magalhães - OAB 183.619/MG'],
        lida: false,
        respondida: false
      },
      {
        id: '2',
        numero_processo: '9876543-21.2023.5.02.0011',
        data_publicacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tipo: 'SENTENCA',
        conteudo: 'Sentença procedente. Condeno a reclamada ao pagamento das verbas rescisórias no valor de R$ 35.000,00.',
        orgao: 'TRT-2 - 11ª Vara do Trabalho',
        diario: 'DEJT',
        pagina: 567,
        prazo_dias: 8,
        data_limite: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        advogados_intimados: ['Dr. Gabriel Magalhães - OAB 183.619/MG'],
        lida: true,
        respondida: false
      },
      {
        id: '3',
        numero_processo: '5555555-55.2023.8.26.0224',
        data_publicacao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tipo: 'DECISAO',
        conteudo: 'Defiro o pedido de tutela de urgência. Determino o bloqueio dos valores via SISBAJUD.',
        orgao: 'TJSP - 3ª Vara Cível de Guarulhos',
        diario: 'DJE-SP',
        pagina: 890,
        prazo_dias: 5,
        data_limite: new Date().toISOString().split('T')[0],
        advogados_intimados: ['Dr. Gabriel Magalhães - OAB 183.619/MG'],
        lida: true,
        respondida: false
      },
      {
        id: '4',
        numero_processo: '3333333-33.2024.8.26.0100',
        data_publicacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tipo: 'DESPACHO',
        conteudo: 'Designo audiência de conciliação para o dia 15/02/2024 às 14h00.',
        orgao: 'TJSP - 5ª Vara Cível',
        diario: 'DJE-SP',
        pagina: 234,
        lida: false,
        respondida: false
      },
      {
        id: '5',
        numero_processo: '4444444-44.2023.8.26.0100',
        data_publicacao: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tipo: 'ACORDAO',
        conteudo: 'Acordão negando provimento ao recurso. Mantida a sentença de primeiro grau.',
        orgao: 'TJSP - 3ª Câmara de Direito Privado',
        diario: 'DJE-SP',
        pagina: 456,
        prazo_dias: 15,
        data_limite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        advogados_intimados: ['Dr. Gabriel Magalhães - OAB 183.619/MG'],
        lida: true,
        respondida: true
      }
    ]

    // Analyze each publication
    const publicacoesComAnalise = await Promise.all(
      mockPublicacoes.map(async (pub) => {
        const analise = await escavadorService.analisarPublicacao(pub)
        return { ...pub, analise }
      })
    )

    setPublicacoes(publicacoesComAnalise)
  }

  const checkNewPublications = async () => {
    try {
      // In production, this would call the real API
      // const result = await escavadorService.monitorarPublicacoes(OAB_NUMERO, OAB_UF)
      
      // For demo, simulate finding new publications occasionally
      if (Math.random() > 0.7) {
        toast.info('Nova publicação identificada!', {
          description: 'Uma nova intimação foi encontrada no DJE'
        })
      }
    } catch (error) {
      console.error('Erro ao verificar publicações:', error)
    }
  }

  const handleMarkAsRead = (id: string) => {
    setPublicacoes(prev => 
      prev.map(pub => 
        pub.id === id ? { ...pub, lida: true } : pub
      )
    )
    toast.success('Publicação marcada como lida')
  }

  const handleMarkAsResponded = (id: string) => {
    setPublicacoes(prev => 
      prev.map(pub => 
        pub.id === id ? { ...pub, respondida: true } : pub
      )
    )
    toast.success('Publicação marcada como respondida')
  }

  const handleViewDetails = (publicacao: PublicacaoComAnalise) => {
    setSelectedPublicacao(publicacao)
    setShowDetails(true)
    if (!publicacao.lida) {
      handleMarkAsRead(publicacao.id)
    }
  }

  const filteredPublicacoes = publicacoes.filter(pub => {
    const matchTipo = filterTipo === 'TODOS' || pub.tipo === filterTipo
    const matchUrgencia = filterUrgencia === 'TODOS' || 
      (filterUrgencia === 'URGENTE' && pub.analise?.prioridade === 'URGENTE') ||
      (filterUrgencia === 'ALTA' && pub.analise?.prioridade === 'ALTA') ||
      (filterUrgencia === 'COM_PRAZO' && pub.prazo_dias && pub.prazo_dias > 0)
    
    return matchTipo && matchUrgencia
  })

  const stats = {
    total: publicacoes.length,
    naoLidas: publicacoes.filter(p => !p.lida).length,
    urgentes: publicacoes.filter(p => p.analise?.prioridade === 'URGENTE').length,
    comPrazo: publicacoes.filter(p => p.prazo_dias && p.prazo_dias > 0).length,
    respondidas: publicacoes.filter(p => p.respondida).length
  }

  const getPrioridadeColor = (prioridade?: string) => {
    switch (prioridade) {
      case 'URGENTE': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900'
      case 'ALTA': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900'
      case 'MEDIA': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900'
      case 'BAIXA': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900'
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Monitoramento de Publicações
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Acompanhamento automático de publicações oficiais - OAB {OAB_NUMERO}/{OAB_UF}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                monitoringActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                <div className={`w-2 h-2 rounded-full ${monitoringActive ? 'bg-green-600 animate-pulse' : 'bg-gray-600'}`} />
                {monitoringActive ? 'Monitoramento Ativo' : 'Monitoramento Pausado'}
              </span>
              <button
                onClick={() => setMonitoringActive(!monitoringActive)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {monitoringActive ? 'Pausar' : 'Ativar'} Monitoramento
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Não Lidas</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.naoLidas}</p>
              </div>
              <Bell className="w-6 h-6 text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Urgentes</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.urgentes}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Com Prazo</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.comPrazo}</p>
              </div>
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Respondidas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.respondidas}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="INTIMACAO">Intimações</option>
              <option value="SENTENCA">Sentenças</option>
              <option value="DECISAO">Decisões</option>
              <option value="DESPACHO">Despachos</option>
              <option value="ACORDAO">Acórdãos</option>
              <option value="EDITAL">Editais</option>
            </select>

            <select
              value={filterUrgencia}
              onChange={(e) => setFilterUrgencia(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todas as Prioridades</option>
              <option value="URGENTE">Urgentes</option>
              <option value="ALTA">Prioridade Alta</option>
              <option value="COM_PRAZO">Com Prazo</option>
            </select>
          </div>
        </div>

        {/* Publications List */}
        <div className="space-y-4">
          {filteredPublicacoes.map((publicacao) => (
            <div
              key={publicacao.id}
              className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-2 transition-all ${
                !publicacao.lida 
                  ? 'border-orange-300 dark:border-orange-700' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {publicacao.tipo.charAt(0) + publicacao.tipo.slice(1).toLowerCase().replace('_', ' ')}
                    </h3>
                    {publicacao.analise && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(publicacao.analise.prioridade)}`}>
                        {publicacao.analise.prioridade}
                      </span>
                    )}
                    {!publicacao.lida && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        Nova
                      </span>
                    )}
                    {publicacao.respondida && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Processo: {publicacao.numero_processo}
                  </p>

                  <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                    {publicacao.conteudo}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Publicado em {new Date(publicacao.data_publicacao).toLocaleDateString('pt-BR')}
                    </span>
                    {publicacao.data_limite && (
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                        <Clock className="w-4 h-4" />
                        Prazo até {new Date(publicacao.data_limite).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    <span>{publicacao.orgao}</span>
                    {publicacao.diario && publicacao.pagina && (
                      <span>{publicacao.diario} - Pág. {publicacao.pagina}</span>
                    )}
                  </div>

                  {publicacao.analise && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                        Ação Sugerida:
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {publicacao.analise.acao_sugerida}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Fundamentação: {publicacao.analise.fundamentacao_legal}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(publicacao)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Ver detalhes"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {!publicacao.lida && (
                    <button
                      onClick={() => handleMarkAsRead(publicacao.id)}
                      className="p-2 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Marcar como lida"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  {!publicacao.respondida && publicacao.prazo_dias && (
                    <button
                      onClick={() => handleMarkAsResponded(publicacao.id)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Marcar como respondida"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPublicacoes.length === 0 && (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma publicação encontrada com os filtros selecionados
            </p>
          </div>
        )}
      </div>

      {/* Publication Details Modal */}
      {showDetails && selectedPublicacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Detalhes da Publicação
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Tipo</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedPublicacao.tipo.charAt(0) + selectedPublicacao.tipo.slice(1).toLowerCase().replace('_', ' ')}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Processo</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPublicacao.numero_processo}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Data de Publicação</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(selectedPublicacao.data_publicacao).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {selectedPublicacao.data_limite && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Prazo Limite</label>
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {new Date(selectedPublicacao.data_limite).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Órgão</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPublicacao.orgao}</p>
              </div>

              {selectedPublicacao.diario && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Publicado em</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedPublicacao.diario} - Página {selectedPublicacao.pagina}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Conteúdo</label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedPublicacao.conteudo}
                  </p>
                </div>
              </div>

              {selectedPublicacao.advogados_intimados && selectedPublicacao.advogados_intimados.length > 0 && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Advogados Intimados</label>
                  <ul className="mt-2 space-y-1">
                    {selectedPublicacao.advogados_intimados.map((adv, index) => (
                      <li key={index} className="text-gray-900 dark:text-white">• {adv}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPublicacao.analise && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Análise e Recomendações
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400">Prioridade</label>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                        getPrioridadeColor(selectedPublicacao.analise.prioridade)
                      }`}>
                        {selectedPublicacao.analise.prioridade}
                      </span>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400">Ação Sugerida</label>
                      <p className="font-medium text-gray-900 dark:text-white mt-1">
                        {selectedPublicacao.analise.acao_sugerida}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400">Fundamentação Legal</label>
                      <p className="font-medium text-gray-900 dark:text-white mt-1">
                        {selectedPublicacao.analise.fundamentacao_legal}
                      </p>
                    </div>

                    {selectedPublicacao.analise.template_peca && (
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400">Template de Peça Sugerido</label>
                        <p className="font-medium text-blue-600 dark:text-blue-400 mt-1">
                          {selectedPublicacao.analise.template_peca.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {!selectedPublicacao.respondida && selectedPublicacao.prazo_dias && (
                  <button
                    onClick={() => {
                      handleMarkAsResponded(selectedPublicacao.id)
                      setShowDetails(false)
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Marcar como Respondida
                  </button>
                )}
                <button
                  onClick={() => toast.info('Download da publicação iniciado')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PublicationsPage() {
  return (
    <AppLayout>
      <PublicationsContent />
    </AppLayout>
  )
}