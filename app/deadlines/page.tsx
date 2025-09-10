'use client'

import { AppLayout } from '@/components/layouts/app-layout'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  CalendarDays, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Bell,
  Filter,
  Download,
  ChevronRight,
  Gavel,
  FileText,
  Users,
  Calendar as CalendarIcon
} from 'lucide-react'

interface Deadline {
  id: string
  title: string
  description: string
  date: Date
  type: 'judicial' | 'administrative' | 'contractual' | 'internal'
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'completed' | 'overdue'
  caseNumber?: string
  client?: string
  responsible?: string
}

// Mock deadlines
const mockDeadlines: Deadline[] = [
  {
    id: '1',
    title: 'Contestação - Ação de Cobrança',
    description: 'Prazo para apresentar contestação no processo',
    date: new Date('2025-01-10'),
    type: 'judicial',
    priority: 'high',
    status: 'pending',
    caseNumber: '1234567-89.2024.8.26.0100',
    client: 'João Silva',
    responsible: 'Dr. Pedro Santos'
  },
  {
    id: '2',
    title: 'Entrega de Documentos - Due Diligence',
    description: 'Prazo para entrega de documentos solicitados',
    date: new Date('2025-01-08'),
    type: 'administrative',
    priority: 'medium',
    status: 'pending',
    client: 'Tech Solutions Ltda',
    responsible: 'Dra. Ana Costa'
  },
  {
    id: '3',
    title: 'Renovação de Contrato',
    description: 'Prazo para renovação do contrato de prestação de serviços',
    date: new Date('2025-01-15'),
    type: 'contractual',
    priority: 'medium',
    status: 'pending',
    client: 'Maria Santos',
    responsible: 'Dr. Carlos Oliveira'
  },
  {
    id: '4',
    title: 'Recurso de Apelação',
    description: 'Prazo fatal para interposição de recurso',
    date: new Date('2025-01-05'),
    type: 'judicial',
    priority: 'high',
    status: 'pending',
    caseNumber: '9876543-21.2024.8.26.0100',
    client: 'Roberto Alves',
    responsible: 'Dr. Pedro Santos'
  },
  {
    id: '5',
    title: 'Audiência de Conciliação',
    description: 'Comparecimento em audiência',
    date: new Date('2024-12-20'),
    type: 'judicial',
    priority: 'high',
    status: 'completed',
    caseNumber: '5555555-55.2024.8.26.0100',
    client: 'Empresa ABC',
    responsible: 'Dra. Ana Costa'
  }
]

function DeadlinesContent() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [deadlines] = useState<Deadline[]>(mockDeadlines)

  const getTypeIcon = (type: Deadline['type']) => {
    switch (type) {
      case 'judicial': return <Gavel className="h-4 w-4" />
      case 'administrative': return <FileText className="h-4 w-4" />
      case 'contractual': return <FileText className="h-4 w-4" />
      case 'internal': return <Users className="h-4 w-4" />
      default: return <CalendarIcon className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: Deadline['type']) => {
    switch (type) {
      case 'judicial': return 'Judicial'
      case 'administrative': return 'Administrativo'
      case 'contractual': return 'Contratual'
      case 'internal': return 'Interno'
      default: return type
    }
  }

  const getPriorityColor = (priority: Deadline['priority']) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: Deadline['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'overdue': return <AlertTriangle className="h-4 w-4" />
      default: return null
    }
  }

  const getDaysUntil = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const upcomingDeadlines = deadlines
    .filter(d => d.status === 'pending')
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  const todayDeadlines = deadlines.filter(d => {
    const today = new Date()
    return d.date.toDateString() === today.toDateString()
  })

  const overdueDeadlines = deadlines.filter(d => {
    const today = new Date()
    return d.date < today && d.status === 'pending'
  })

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Prazos e Compromissos</h1>
          <p className="text-muted-foreground">Gerencie seus prazos judiciais e compromissos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Prazo
          </Button>
        </div>
      </div>

      {/* Alerts for urgent deadlines */}
      {overdueDeadlines.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Prazos Vencidos!</AlertTitle>
          <AlertDescription>
            Você tem {overdueDeadlines.length} prazo{overdueDeadlines.length !== 1 ? 's' : ''} vencido{overdueDeadlines.length !== 1 ? 's' : ''} que 
            {overdueDeadlines.length !== 1 ? ' precisam' : ' precisa'} de atenção imediata.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
            
            {/* Today's Deadlines */}
            {todayDeadlines.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Prazos de Hoje</h4>
                {todayDeadlines.map(deadline => (
                  <div key={deadline.id} className="text-sm p-2 bg-secondary rounded">
                    <div className="font-medium">{deadline.title}</div>
                    <div className="text-muted-foreground text-xs">{deadline.client}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deadlines List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximos 7 dias</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {deadlines.filter(d => {
                    const days = getDaysUntil(d.date)
                    return days >= 0 && days <= 7 && d.status === 'pending'
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  prazos pendentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {deadlines.filter(d => d.priority === 'high' && d.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  alta prioridade
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {deadlines.filter(d => d.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  este mês
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Deadlines Tabs */}
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming">Próximos</TabsTrigger>
              <TabsTrigger value="overdue">Vencidos</TabsTrigger>
              <TabsTrigger value="completed">Concluídos</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingDeadlines.map((deadline) => {
                const daysUntil = getDaysUntil(deadline.date)
                return (
                  <Card key={deadline.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getPriorityColor(deadline.priority)}>
                              {getTypeIcon(deadline.type)}
                              <span className="ml-1">{getTypeLabel(deadline.type)}</span>
                            </Badge>
                            {daysUntil <= 3 && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {daysUntil === 0 ? 'Hoje' : 
                                 daysUntil === 1 ? 'Amanhã' : 
                                 `${daysUntil} dias`}
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold">{deadline.title}</h3>
                          <p className="text-sm text-muted-foreground">{deadline.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {deadline.caseNumber && (
                              <span>Processo: {deadline.caseNumber}</span>
                            )}
                            {deadline.client && (
                              <span>Cliente: {deadline.client}</span>
                            )}
                            {deadline.responsible && (
                              <span>Responsável: {deadline.responsible}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {deadline.date.toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="overdue" className="space-y-4">
              {overdueDeadlines.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum prazo vencido</p>
                  </CardContent>
                </Card>
              ) : (
                overdueDeadlines.map((deadline) => (
                  <Card key={deadline.id} className="border-destructive">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Vencido há {Math.abs(getDaysUntil(deadline.date))} dias
                            </Badge>
                          </div>
                          
                          <h3 className="text-lg font-semibold">{deadline.title}</h3>
                          <p className="text-sm text-muted-foreground">{deadline.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {deadline.client && (
                              <span>Cliente: {deadline.client}</span>
                            )}
                            {deadline.responsible && (
                              <span>Responsável: {deadline.responsible}</span>
                            )}
                          </div>
                        </div>
                        
                        <Button variant="destructive" size="sm">
                          Resolver
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {deadlines.filter(d => d.status === 'completed').map((deadline) => (
                <Card key={deadline.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                            Concluído
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-semibold line-through">{deadline.title}</h3>
                        <p className="text-sm text-muted-foreground">{deadline.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {deadline.client && (
                            <span>Cliente: {deadline.client}</span>
                          )}
                          <span>
                            Concluído em: {deadline.date.toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default function DeadlinesPage() {
  return (
    <AppLayout>
      <DeadlinesContent />
    </AppLayout>
  )
}