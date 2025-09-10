'use client'

import { AppLayout } from '@/components/layouts/app-layout'
import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Users, 
  Bell, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  List,
  Grid3x3,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar as CalendarIcon,
  Timer,
  Zap,
  FileText,
  Eye,
  Play,
  Pause
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Mock data para compromissos
const MOCK_APPOINTMENTS = [
  {
    id: '1',
    title: 'Audiência Trabalhista - Silva vs Empresa XYZ',
    type: 'audiencia',
    date: '2024-01-15',
    time: '14:00',
    location: 'Tribunal do Trabalho - SP',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Reunião com cliente - Análise contrato',
    type: 'reuniao',
    date: '2024-01-12',
    time: '10:00',
    location: 'Escritório',
    priority: 'medium'
  }
]

// Mock data para prazos
const UPCOMING_DEADLINES = [
  {
    id: '1',
    title: 'Contestação - Processo 123456',
    deadline: '2024-01-10',
    days_remaining: 3,
    type: 'legal',
    priority: 'urgent',
    case_number: '123456'
  },
  {
    id: '2',
    title: 'Recurso Ordinário - Processo 789123',
    deadline: '2024-01-15',
    days_remaining: 8,
    type: 'legal',
    priority: 'high',
    case_number: '789123'
  },
  {
    id: '3',
    title: 'Petição Inicial - Danos Morais',
    deadline: '2024-01-18',
    days_remaining: 11,
    type: 'legal',
    priority: 'medium',
    case_number: '456789'
  }
]

// Mock data para tarefas de IA
const AI_TASKS = [
  {
    id: '1',
    title: 'Analisar jurisprudência sobre danos morais',
    type: 'research',
    priority: 'high',
    deadline: '2024-01-15',
    estimated_time: '2 horas',
    status: 'pending',
    generated_by: 'Chat IA',
    case_id: 'CASO-001',
    progress: 0
  },
  {
    id: '2', 
    title: 'Revisar petição inicial elaborada por IA',
    type: 'review',
    priority: 'medium',
    deadline: '2024-01-12',
    estimated_time: '1 hora',
    status: 'in_progress',
    generated_by: 'Gerador de Petições',
    case_id: 'CASO-002',
    progress: 65
  },
  {
    id: '3',
    title: 'Verificar cálculos trabalhistas automáticos',
    type: 'validation',
    priority: 'low',
    deadline: '2024-01-18',
    estimated_time: '30 min',
    status: 'completed',
    generated_by: 'Calculadora IA',
    case_id: 'CASO-003',
    progress: 100
  },
  {
    id: '4',
    title: 'Gerar minuta de contrato empresarial',
    type: 'generation',
    priority: 'medium',
    deadline: '2024-01-20',
    estimated_time: '45 min',
    status: 'pending',
    generated_by: 'Assistente Contratos',
    case_id: 'CASO-004',
    progress: 0
  }
]

export default function AgendaPrazosPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState('overview')

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'in_progress': return <Play className="w-4 h-4" />
      case 'pending': return <Pause className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-purple/5 px-4 md:px-6">
        {/* Header */}
        <div className="bg-gradient-purple text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <CalendarDays className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">
                      Agenda & Prazos
                    </h1>
                    <p className="mt-1 text-freelaw-purple-light/90">
                      Compromissos, prazos processuais e tarefas inteligentes
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                  <Button className="bg-white text-freelaw-purple hover:bg-white/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Compromisso
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="calendar">Calendário</TabsTrigger>
              <TabsTrigger value="deadlines">Prazos</TabsTrigger>
              <TabsTrigger value="ai-tasks">Tarefas IA</TabsTrigger>
            </TabsList>

            {/* Visão Geral */}
            <TabsContent value="overview" className="space-y-6">
              {/* Cards de Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Próximos Prazos</p>
                        <p className="text-2xl font-bold">{UPCOMING_DEADLINES.length}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tarefas IA Ativas</p>
                        <p className="text-2xl font-bold">{AI_TASKS.filter(t => t.status !== 'completed').length}</p>
                      </div>
                      <Brain className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Compromissos Hoje</p>
                        <p className="text-2xl font-bold">2</p>
                      </div>
                      <CalendarIcon className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Economia de Tempo</p>
                        <p className="text-2xl font-bold">12h</p>
                      </div>
                      <Zap className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Dashboard Combinado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Próximos Prazos Urgentes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <span>Prazos Urgentes</span>
                    </CardTitle>
                    <CardDescription>Próximos vencimentos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {UPCOMING_DEADLINES.slice(0, 3).map((deadline) => (
                      <div key={deadline.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{deadline.title}</h4>
                          <p className="text-xs text-muted-foreground">Processo: {deadline.case_number}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getPriorityColor(deadline.priority)}>
                            {deadline.days_remaining} dias
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Tarefas IA em Andamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <span>Tarefas IA</span>
                    </CardTitle>
                    <CardDescription>Atividades inteligentes em andamento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {AI_TASKS.filter(t => t.status !== 'completed').slice(0, 3).map((task) => (
                      <div key={task.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <Badge className={getStatusColor(task.status)}>
                            {getStatusIcon(task.status)}
                            <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{task.generated_by}</span>
                          <span>{task.estimated_time}</span>
                        </div>
                        {task.status === 'in_progress' && (
                          <div className="mt-2">
                            <Progress value={task.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Calendário */}
            <TabsContent value="calendar" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Calendário</CardTitle>
                      <CardDescription>Seus compromissos e eventos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className="rounded-md border"
                      />
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Próximos Compromissos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {MOCK_APPOINTMENTS.map((apt) => (
                        <div key={apt.id} className="p-3 border rounded-lg">
                          <h4 className="font-medium text-sm">{apt.title}</h4>
                          <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{apt.date} às {apt.time}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{apt.location}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Prazos */}
            <TabsContent value="deadlines" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Controle de Prazos</CardTitle>
                  <CardDescription>Prazos processuais e compromissos legais</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {UPCOMING_DEADLINES.map((deadline) => (
                      <div key={deadline.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <h3 className="font-semibold">{deadline.title}</h3>
                          <p className="text-sm text-muted-foreground">Processo: {deadline.case_number}</p>
                          <p className="text-sm text-muted-foreground">Vencimento: {deadline.deadline}</p>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className={getPriorityColor(deadline.priority)}>
                            {deadline.priority === 'urgent' ? 'Urgente' : 
                             deadline.priority === 'high' ? 'Alto' :
                             deadline.priority === 'medium' ? 'Médio' : 'Baixo'}
                          </Badge>
                          <p className="text-sm font-medium">
                            {deadline.days_remaining} dias restantes
                          </p>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tarefas IA */}
            <TabsContent value="ai-tasks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5" />
                    <span>Tarefas Inteligentes</span>
                  </CardTitle>
                  <CardDescription>Atividades geradas e gerenciadas por IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {AI_TASKS.map((task) => (
                      <div key={task.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold">{task.title}</h3>
                            <p className="text-sm text-muted-foreground">Gerado por: {task.generated_by}</p>
                            <p className="text-sm text-muted-foreground">Caso: {task.case_id}</p>
                          </div>
                          <div className="text-right space-y-2">
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusIcon(task.status)}
                              <span className="ml-1 capitalize">
                                {task.status === 'pending' ? 'Pendente' :
                                 task.status === 'in_progress' ? 'Em Andamento' : 'Concluída'}
                              </span>
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(task.priority)}>
                              {task.priority === 'high' ? 'Alta' :
                               task.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Timer className="w-4 h-4" />
                              <span>{task.estimated_time}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>Até {task.deadline}</span>
                            </div>
                          </div>
                        </div>

                        {task.status === 'in_progress' && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progresso</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-2" />
                          </div>
                        )}

                        <div className="flex gap-2">
                          {task.status === 'pending' && (
                            <Button size="sm">
                              <Play className="w-4 h-4 mr-2" />
                              Iniciar
                            </Button>
                          )}
                          {task.status === 'in_progress' && (
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              Acompanhar
                            </Button>
                          )}
                          {task.status === 'completed' && (
                            <Button size="sm" variant="outline">
                              <FileText className="w-4 h-4 mr-2" />
                              Ver Resultado
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  )
}