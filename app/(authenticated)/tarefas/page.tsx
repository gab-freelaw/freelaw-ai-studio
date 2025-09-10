'use client'

import { AppLayout } from '@/components/layouts/app-layout'
import { useState, useEffect } from 'react'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Calendar,
  User,
  Tag,
  Filter,
  Plus,
  Sparkles,
  TrendingUp,
  Target,
  Brain,
  Zap,
  ChevronRight,
  FileText,
  Users,
  Briefcase,
  AlertTriangle,
  CheckCheck,
  ListTodo,
  ArrowUpRight,
  Bot
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Task {
  id: string
  titulo: string
  descricao?: string
  tipo: 'PETICAO' | 'AUDIENCIA' | 'PRAZO' | 'DOCUMENTO' | 'LIGACAO' | 'EMAIL' | 'ANALISE' | 'OUTRO'
  prioridade: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA'
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  prazo?: string
  processo_id?: string
  contato_id?: string
  responsavel?: string
  tags?: string[]
  tempo_estimado?: number // em minutos
  tempo_gasto?: number // em minutos
  ai_sugestao?: string
  ai_prioridade_score?: number // 0-100
  ai_complexidade?: 'SIMPLES' | 'MODERADA' | 'COMPLEXA'
  created_at: string
  updated_at: string
  completed_at?: string
}

interface AIInsight {
  tipo: 'sugestao' | 'alerta' | 'automacao'
  titulo: string
  descricao: string
  acao?: () => void
}

const TIPO_ICONS = {
  PETICAO: FileText,
  AUDIENCIA: Users,
  PRAZO: Clock,
  DOCUMENTO: FileText,
  LIGACAO: User,
  EMAIL: AlertCircle,
  ANALISE: Brain,
  OUTRO: ListTodo
}

const PRIORIDADE_COLORS = {
  URGENTE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300',
  ALTA: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300',
  MEDIA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300',
  BAIXA: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300'
}

function TarefasContent() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('TODOS')
  const [filterPrioridade, setFilterPrioridade] = useState<string>('TODOS')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false)

  // Load tasks
  useEffect(() => {
    loadTasks()
    generateAIInsights()
  }, [])

  const loadTasks = () => {
    // Mock data com tarefas inteligentes
    const mockTasks: Task[] = [
      {
        id: '1',
        titulo: 'Elaborar contestação - Processo 1234567',
        descricao: 'Preparar contestação completa com preliminares e mérito',
        tipo: 'PETICAO',
        prioridade: 'URGENTE',
        status: 'PENDENTE',
        prazo: '2025-09-10',
        processo_id: '1234567-89.2024.8.26.0100',
        tempo_estimado: 240,
        ai_sugestao: 'Baseado em casos similares, recomendo incluir preliminar de ilegitimidade passiva e no mérito focar na ausência de provas',
        ai_prioridade_score: 95,
        ai_complexidade: 'COMPLEXA',
        tags: ['Cível', 'Contestação', 'Urgente'],
        created_at: '2024-09-01',
        updated_at: '2024-09-01'
      },
      {
        id: '2',
        titulo: 'Preparar para audiência de conciliação',
        descricao: 'Revisar documentos e preparar proposta de acordo',
        tipo: 'AUDIENCIA',
        prioridade: 'ALTA',
        status: 'EM_ANDAMENTO',
        prazo: '2025-09-08',
        processo_id: '9876543-21.2024.8.26.0100',
        tempo_estimado: 120,
        tempo_gasto: 45,
        ai_sugestao: 'Cliente tem 73% de chance de acordo favorável. Sugestão: propor parcelamento em 12x com desconto de 20%',
        ai_prioridade_score: 82,
        ai_complexidade: 'MODERADA',
        tags: ['Audiência', 'Conciliação'],
        created_at: '2024-09-02',
        updated_at: '2024-09-03'
      },
      {
        id: '3',
        titulo: 'Analisar novos documentos recebidos',
        descricao: 'Cliente enviou 15 documentos para análise',
        tipo: 'ANALISE',
        prioridade: 'MEDIA',
        status: 'PENDENTE',
        tempo_estimado: 60,
        ai_sugestao: 'Detectei 3 documentos críticos que podem impactar o caso. Priorize: contrato assinado, comprovante de pagamento e emails',
        ai_prioridade_score: 65,
        ai_complexidade: 'SIMPLES',
        tags: ['Documentos', 'Análise'],
        created_at: '2024-09-03',
        updated_at: '2024-09-03'
      },
      {
        id: '4',
        titulo: 'Protocolar recurso de apelação',
        descricao: 'Prazo fatal para protocolo do recurso',
        tipo: 'PRAZO',
        prioridade: 'URGENTE',
        status: 'PENDENTE',
        prazo: '2025-09-07',
        processo_id: '5555555-55.2024.8.26.0100',
        tempo_estimado: 300,
        ai_sugestao: 'ATENÇÃO: Prazo fatal em 2 dias! Modelo de apelação similar disponível no caso 4444444-44',
        ai_prioridade_score: 100,
        ai_complexidade: 'COMPLEXA',
        tags: ['Recurso', 'Prazo Fatal', 'Urgente'],
        created_at: '2024-09-01',
        updated_at: '2024-09-04'
      },
      {
        id: '5',
        titulo: 'Ligar para cliente João Silva',
        descricao: 'Retorno sobre andamento do processo',
        tipo: 'LIGACAO',
        prioridade: 'BAIXA',
        status: 'PENDENTE',
        contato_id: '1',
        tempo_estimado: 15,
        ai_sugestao: 'Melhor horário para contato: 14h-16h (baseado em histórico)',
        ai_prioridade_score: 30,
        ai_complexidade: 'SIMPLES',
        tags: ['Cliente', 'Follow-up'],
        created_at: '2024-09-04',
        updated_at: '2024-09-04'
      },
      {
        id: '6',
        titulo: 'Revisar contratos de prestação de serviços',
        descricao: 'Análise de 3 contratos novos',
        tipo: 'DOCUMENTO',
        prioridade: 'MEDIA',
        status: 'CONCLUIDA',
        tempo_estimado: 90,
        tempo_gasto: 75,
        ai_sugestao: 'Cláusulas revisadas com sucesso. Sugestão implementada: adicionar cláusula de reajuste anual',
        ai_prioridade_score: 50,
        ai_complexidade: 'MODERADA',
        tags: ['Contratos', 'Revisão'],
        created_at: '2024-09-02',
        updated_at: '2024-09-04',
        completed_at: '2024-09-04'
      }
    ]

    setTasks(mockTasks)
  }

  const generateAIInsights = () => {
    // Gerar insights de IA baseados nas tarefas
    const insights: AIInsight[] = [
      {
        tipo: 'alerta',
        titulo: '2 prazos críticos esta semana',
        descricao: 'Recurso de apelação (07/09) e Contestação (10/09) precisam de atenção imediata',
        acao: () => setFilterPrioridade('URGENTE')
      },
      {
        tipo: 'sugestao',
        titulo: 'Otimize seu tempo com templates',
        descricao: 'Usar template de contestação pode economizar 2 horas no caso 1234567',
        acao: () => toast.success('Template carregado com sucesso!')
      },
      {
        tipo: 'automacao',
        titulo: 'Automatizar follow-ups de clientes',
        descricao: '5 ligações pendentes podem ser convertidas em emails automáticos',
        acao: () => handleAutomateFollowUps()
      },
      {
        tipo: 'sugestao',
        titulo: 'Melhor momento para tarefas complexas',
        descricao: 'Baseado no seu histórico, você é 40% mais produtivo em tarefas complexas pela manhã (9h-12h)',
      }
    ]

    setAiInsights(insights)
  }

  const handleAutomateFollowUps = () => {
    toast.success('5 emails de follow-up agendados automaticamente')
    // Atualizar tarefas de ligação para email automático
    setTasks(prev => prev.map(task => 
      task.tipo === 'LIGACAO' && task.status === 'PENDENTE'
        ? { ...task, tipo: 'EMAIL', descricao: task.descricao + ' (Automatizado)' }
        : task
    ))
  }

  const handleGenerateTasksWithAI = async () => {
    setIsGeneratingTasks(true)
    
    // Simular análise de IA
    setTimeout(() => {
      const newTasks: Task[] = [
        {
          id: Date.now().toString(),
          titulo: 'Analisar jurisprudência para caso 1234567',
          descricao: 'IA identificou 5 julgados relevantes do TJSP',
          tipo: 'ANALISE',
          prioridade: 'ALTA',
          status: 'PENDENTE',
          tempo_estimado: 45,
          ai_sugestao: 'Julgados encontrados: 2023.0000.12345, 2023.0000.67890 com teses favoráveis',
          ai_prioridade_score: 78,
          ai_complexidade: 'SIMPLES',
          tags: ['IA', 'Jurisprudência'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      
      setTasks(prev => [...newTasks, ...prev])
      setIsGeneratingTasks(false)
      toast.success('Nova tarefa criada pela IA com base na análise do caso')
    }, 2000)
  }

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA'
        return {
          ...task,
          status: newStatus,
          completed_at: newStatus === 'CONCLUIDA' ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        }
      }
      return task
    }))
    
    toast.success('Tarefa atualizada')
  }

  const handleStartTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: 'EM_ANDAMENTO',
          updated_at: new Date().toISOString()
        }
      }
      return task
    }))
    
    toast.success('Tarefa iniciada')
  }

  // Filtrar tarefas
  const filteredTasks = tasks.filter(task => {
    const matchStatus = filterStatus === 'TODOS' || task.status === filterStatus
    const matchPrioridade = filterPrioridade === 'TODOS' || task.prioridade === filterPrioridade
    return matchStatus && matchPrioridade
  })

  // Estatísticas
  const stats = {
    total: tasks.length,
    pendentes: tasks.filter(t => t.status === 'PENDENTE').length,
    em_andamento: tasks.filter(t => t.status === 'EM_ANDAMENTO').length,
    concluidas: tasks.filter(t => t.status === 'CONCLUIDA').length,
    urgentes: tasks.filter(t => t.prioridade === 'URGENTE' && t.status !== 'CONCLUIDA').length,
    produtividade: Math.round((tasks.filter(t => t.status === 'CONCLUIDA').length / tasks.length) * 100) || 0,
    tempo_economizado: tasks.reduce((acc, t) => {
      if (t.status === 'CONCLUIDA' && t.tempo_estimado && t.tempo_gasto) {
        return acc + Math.max(0, t.tempo_estimado - t.tempo_gasto)
      }
      return acc
    }, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                Tarefas Inteligentes
                <Sparkles className="w-8 h-8 text-blue-500" />
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Sistema de tarefas com IA para otimizar sua produtividade
              </p>
            </div>
            
            <Button 
              onClick={handleGenerateTasksWithAI}
              disabled={isGeneratingTasks}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isGeneratingTasks ? (
                <>
                  <Brain className="w-4 h-4 mr-2 animate-pulse" />
                  Analisando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Gerar Tarefas com IA
                </>
              )}
            </Button>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            Insights da IA
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiInsights.map((insight, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  insight.tipo === 'alerta' ? 'border-red-200 dark:border-red-800' : ''
                }`}
                onClick={insight.acao}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {insight.tipo === 'alerta' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    {insight.tipo === 'sugestao' && <Sparkles className="w-4 h-4 text-blue-500" />}
                    {insight.tipo === 'automacao' && <Zap className="w-4 h-4 text-purple-500" />}
                    {insight.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {insight.descricao}
                  </p>
                  {insight.acao && (
                    <ArrowUpRight className="w-3 h-3 mt-2 text-blue-500" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendentes</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">{stats.pendentes}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Em Andamento</CardDescription>
              <CardTitle className="text-2xl text-blue-600">{stats.em_andamento}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Concluídas</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.concluidas}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="pb-2">
              <CardDescription>Urgentes</CardDescription>
              <CardTitle className="text-2xl text-red-600">{stats.urgentes}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardHeader className="pb-2">
              <CardDescription>Produtividade</CardDescription>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{stats.produtividade}%</CardTitle>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <Progress value={stats.produtividade} className="mt-2" />
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDA">Concluídas</option>
            </select>

            <select
              value={filterPrioridade}
              onChange={(e) => setFilterPrioridade(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="TODOS">Todas as Prioridades</option>
              <option value="URGENTE">Urgente</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Média</option>
              <option value="BAIXA">Baixa</option>
            </select>

            <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 inline mr-1" />
              Tempo economizado hoje: <strong>{stats.tempo_economizado} min</strong>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.map(task => {
            const Icon = TIPO_ICONS[task.tipo]
            const isOverdue = task.prazo && new Date(task.prazo) < new Date() && task.status !== 'CONCLUIDA'
            
            return (
              <Card 
                key={task.id}
                className={`transition-all hover:shadow-md ${
                  task.status === 'CONCLUIDA' ? 'opacity-60' : ''
                } ${isOverdue ? 'border-red-300 dark:border-red-700' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-1"
                    >
                      {task.status === 'CONCLUIDA' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 hover:text-blue-500" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-medium text-gray-900 dark:text-white ${
                            task.status === 'CONCLUIDA' ? 'line-through' : ''
                          }`}>
                            {task.titulo}
                          </h3>
                          {task.descricao && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {task.descricao}
                            </p>
                          )}

                          {/* AI Suggestion */}
                          {task.ai_sugestao && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-blue-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                    Sugestão da IA
                                  </p>
                                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    {task.ai_sugestao}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            <Badge variant="outline" className="gap-1">
                              <Icon className="w-3 h-3" />
                              {task.tipo}
                            </Badge>

                            <Badge className={PRIORIDADE_COLORS[task.prioridade]}>
                              {task.prioridade}
                            </Badge>

                            {task.ai_complexidade && (
                              <Badge variant="secondary">
                                {task.ai_complexidade}
                              </Badge>
                            )}

                            {task.prazo && (
                              <span className={`text-sm flex items-center gap-1 ${
                                isOverdue ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                <Calendar className="w-3 h-3" />
                                {format(new Date(task.prazo), "d 'de' MMM", { locale: ptBR })}
                              </span>
                            )}

                            {task.tempo_estimado && (
                              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.tempo_estimado} min
                              </span>
                            )}

                            {task.tags?.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Progress bar for tasks in progress */}
                          {task.status === 'EM_ANDAMENTO' && task.tempo_estimado && task.tempo_gasto && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                <span>Progresso</span>
                                <span>{Math.round((task.tempo_gasto / task.tempo_estimado) * 100)}%</span>
                              </div>
                              <Progress value={(task.tempo_gasto / task.tempo_estimado) * 100} className="h-2" />
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {task.ai_prioridade_score && (
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                task.ai_prioridade_score >= 80 ? 'text-red-500' :
                                task.ai_prioridade_score >= 60 ? 'text-orange-500' :
                                task.ai_prioridade_score >= 40 ? 'text-yellow-500' :
                                'text-green-500'
                              }`}>
                                {task.ai_prioridade_score}
                              </div>
                              <div className="text-xs text-gray-500">IA Score</div>
                            </div>
                          )}

                          {task.status === 'PENDENTE' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartTask(task.id)}
                              className="gap-1"
                            >
                              <ChevronRight className="w-4 h-4" />
                              Iniciar
                            </Button>
                          )}

                          {task.status === 'EM_ANDAMENTO' && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Em andamento
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhuma tarefa encontrada
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function TarefasPage() {
  return (
    <AppLayout>
      <TarefasContent />
    </AppLayout>
  )
}