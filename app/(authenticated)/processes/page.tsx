'use client'

import { AppLayout } from '@/components/layouts/app-layout'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, Users, DollarSign, FileText, AlertCircle, ChevronRight, RefreshCw, Plus, Star, Rss, MoreVertical, Download, Printer } from 'lucide-react'
import { escavadorService, type Processo, type ProcessoDetalhado } from '@/lib/services/escavador.service'
import { toast } from 'sonner'

function ProcessesContent() {
  const [processos, setProcessos] = useState<Processo[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'ATIVO' | 'ARQUIVADO' | 'SUSPENSO'>('TODOS')
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoDetalhado | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Mock data for development
  useEffect(() => {
    loadMockData()
  }, [])

  const loadMockData = () => {
    const mockProcessos: Processo[] = [
      {
        id: '1',
        numero_cnj: '1234567-12.2024.8.26.0100',
        numero_processo: '1234567/2024',
        classe: 'Procedimento Comum Cível',
        assunto: 'Indenização por Danos Morais',
        valor_causa: 50000,
        tribunal: 'TJSP',
        vara: '12ª Vara Cível',
        comarca: 'São Paulo',
        status: 'ATIVO',
        data_distribuicao: '2024-01-15',
        data_ultima_movimentacao: '2024-01-20',
        partes: [
          {
            tipo: 'AUTOR',
            nome: 'João Silva',
            cpf_cnpj: '123.456.789-00',
            advogados: [
              { nome: 'Dr. Gabriel Magalhães', oab: '183.619/MG' }
            ]
          },
          {
            tipo: 'REU',
            nome: 'Empresa ABC Ltda',
            cpf_cnpj: '12.345.678/0001-00',
            advogados: [
              { nome: 'Dra. Maria Santos', oab: '987.654/SP' }
            ]
          }
        ],
        movimentacoes: [
          {
            id: '1',
            data: '2024-01-20',
            tipo: 'Despacho',
            descricao: 'Cite-se o réu para apresentar defesa no prazo legal.'
          }
        ]
      },
      {
        id: '2',
        numero_cnj: '9876543-21.2023.5.02.0011',
        numero_processo: '9876543/2023',
        classe: 'Reclamação Trabalhista',
        assunto: 'Verbas Rescisórias',
        valor_causa: 35000,
        tribunal: 'TRT-2',
        vara: '11ª Vara do Trabalho',
        comarca: 'São Paulo',
        status: 'ATIVO',
        data_distribuicao: '2023-11-10',
        data_ultima_movimentacao: '2024-01-18',
        partes: [
          {
            tipo: 'AUTOR',
            nome: 'Pedro Oliveira',
            cpf_cnpj: '987.654.321-00',
            advogados: [
              { nome: 'Dr. Gabriel Magalhães', oab: '183.619/MG' }
            ]
          },
          {
            tipo: 'REU',
            nome: 'Construtora XYZ S/A',
            cpf_cnpj: '98.765.432/0001-00'
          }
        ]
      },
      {
        id: '3',
        numero_cnj: '5555555-55.2023.8.26.0224',
        numero_processo: '5555555/2023',
        classe: 'Execução de Título Extrajudicial',
        assunto: 'Cobrança',
        valor_causa: 125000,
        tribunal: 'TJSP',
        vara: '3ª Vara Cível de Guarulhos',
        status: 'ARQUIVADO',
        data_distribuicao: '2023-06-15',
        data_ultima_movimentacao: '2023-12-20',
        partes: [
          {
            tipo: 'AUTOR',
            nome: 'Banco ABC S/A',
            cpf_cnpj: '11.222.333/0001-44'
          },
          {
            tipo: 'REU',
            nome: 'José Santos',
            cpf_cnpj: '111.222.333-44',
            advogados: [
              { nome: 'Dr. Gabriel Magalhães', oab: '183.619/MG' }
            ]
          }
        ]
      }
    ]

    setProcessos(mockProcessos)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Digite um número de processo para buscar')
      return
    }

    setLoading(true)
    try {
      // In production, this would call the real API
      // const results = await escavadorService.buscarProcessos({
      //   numero_cnj: searchQuery,
      //   incluir_movimentacoes: true
      // })
      
      // For now, filter mock data
      const filtered = processos.filter(p => 
        p.numero_cnj.includes(searchQuery) || 
        p.numero_processo?.includes(searchQuery)
      )
      
      if (filtered.length > 0) {
        toast.success(`${filtered.length} processo(s) encontrado(s)`)
      } else {
        toast.info('Nenhum processo encontrado com esse número')
      }
    } catch (error) {
      console.error('Erro ao buscar processos:', error)
      toast.error('Erro ao buscar processos')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessoClick = async (processo: Processo) => {
    setSelectedProcesso(processo as ProcessoDetalhado)
    setShowDetails(true)
  }

  const filteredProcessos = processos.filter(p => {
    const matchStatus = filterStatus === 'TODOS' || p.status === filterStatus
    const matchSearch = !searchQuery || 
      p.numero_cnj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.numero_processo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.assunto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.partes.some(parte => parte.nome.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchStatus && matchSearch
  })

  const stats = {
    total: processos.length,
    ativos: processos.filter(p => p.status === 'ATIVO').length,
    arquivados: processos.filter(p => p.status === 'ARQUIVADO').length,
    valorTotal: processos.reduce((acc, p) => acc + (p.valor_causa || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestão de Processos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe e gerencie todos os processos judiciais
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Processos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processos Ativos</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.ativos}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Arquivados</p>
                <p className="text-2xl font-bold text-gray-500 dark:text-gray-400 mt-1">{stats.arquivados}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  R$ {stats.valorTotal.toLocaleString('pt-BR')}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por número CNJ, processo ou parte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="ATIVO">Ativos</option>
              <option value="ARQUIVADO">Arquivados</option>
              <option value="SUSPENSO">Suspensos</option>
            </select>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Buscar
            </button>

            <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Processo
            </button>
          </div>
        </div>

        {/* Process List */}
        <div className="space-y-4">
          {filteredProcessos.map((processo) => (
            <div
              key={processo.id}
              onClick={() => handleProcessoClick(processo)}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {processo.numero_cnj}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      processo.status === 'ATIVO' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : processo.status === 'ARQUIVADO'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {processo.status}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {processo.classe} - {processo.assunto}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {processo.partes.find(p => p.tipo === 'AUTOR')?.nome || 'Autor não informado'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Distribuído em {new Date(processo.data_distribuicao).toLocaleDateString('pt-BR')}
                    </span>
                    {processo.valor_causa && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        R$ {processo.valor_causa.toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Tribunal:</span> {processo.tribunal} | 
                    <span className="font-medium ml-2">Vara:</span> {processo.vara}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
              </div>
            </div>
          ))}
        </div>

        {filteredProcessos.length === 0 && (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum processo encontrado com os filtros selecionados
            </p>
          </div>
        )}
      </div>

      {/* Process Details Modal */}
      {showDetails && selectedProcesso && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Detalhes do Processo
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Informações Gerais
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Número CNJ:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedProcesso.numero_cnj}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedProcesso.status}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Classe:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedProcesso.classe}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Assunto:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedProcesso.assunto}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Partes</h3>
                <div className="space-y-2">
                  {selectedProcesso.partes.map((parte, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {parte.tipo}: {parte.nome}
                      </p>
                      {parte.advogados && parte.advogados.length > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Advogado: {parte.advogados[0].nome} - OAB {parte.advogados[0].oab}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedProcesso.movimentacoes && selectedProcesso.movimentacoes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Últimas Movimentações
                  </h3>
                  <div className="space-y-2">
                    {selectedProcesso.movimentacoes.map((mov) => (
                      <div key={mov.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{mov.tipo}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{mov.descricao}</p>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(mov.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProcessesPage() {
  return (
    <AppLayout>
      <ProcessesContent />
    </AppLayout>
  )
}