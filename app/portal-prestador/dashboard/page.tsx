'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowRight, 
  Bell, 
  BellRing,
  Briefcase, 
  Calendar,
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Filter,
  Gavel,
  MessageSquare,
  Settings,
  Star,
  TrendingUp,
  Trophy,
  User,
  Wallet
} from 'lucide-react'
import Link from 'next/link'

// Mock data for demonstration
const AVAILABLE_WORK = [
  {
    id: 1,
    client: 'Escritório Silva & Associados',
    type: 'Petição Inicial',
    specialty: 'Direito Trabalhista',
    complexity: 'MÉDIA',
    deadline: '48h',
    value: 75,
    baseValue: 50,
    multipliers: {
      complexity: 1.0,
      urgency: 1.0,
      rating: 1.1,
      experience: 1.2,
      clientPlan: 1.2
    },
    description: 'Ação trabalhista de verbas rescisórias',
    documents: 5,
    status: 'new'
  },
  {
    id: 2,
    client: 'Advocacia Martins',
    type: 'Contestação',
    specialty: 'Direito Civil',
    complexity: 'SIMPLES',
    deadline: '72h',
    value: 48,
    baseValue: 50,
    multipliers: {
      complexity: 0.8,
      urgency: 1.0,
      rating: 1.1,
      experience: 1.2,
      clientPlan: 0.9
    },
    description: 'Contestação em ação de cobrança',
    documents: 3,
    status: 'new'
  },
  {
    id: 3,
    client: 'Costa Advogados',
    type: 'Agravo de Instrumento',
    specialty: 'Direito Civil',
    complexity: 'COMPLEXA',
    deadline: '24h',
    value: 145,
    baseValue: 45,
    multipliers: {
      complexity: 1.5,
      urgency: 1.5,
      rating: 1.1,
      experience: 1.2,
      clientPlan: 1.2
    },
    description: 'Agravo contra decisão que indeferiu tutela',
    documents: 8,
    status: 'urgent'
  }
]

const MY_WORK = [
  {
    id: 4,
    client: 'Pereira & Partners',
    type: 'Recurso Ordinário',
    deadline: '5 dias',
    value: 126,
    status: 'in_progress',
    progress: 65,
    submitted: false
  },
  {
    id: 5,
    client: 'Lima Sociedade',
    type: 'Manifestação',
    deadline: '2 dias',
    value: 35,
    status: 'review',
    progress: 100,
    submitted: true,
    feedback: 'Aguardando aprovação do cliente'
  }
]

const COMPLETED_WORK = [
  {
    id: 6,
    client: 'Escritório ABC',
    type: 'Petição Inicial',
    completedAt: '2 dias atrás',
    value: 82,
    rating: 5,
    feedback: 'Excelente trabalho!'
  },
  {
    id: 7,
    client: 'XYZ Advogados',
    type: 'Contestação',
    completedAt: '5 dias atrás',
    value: 56,
    rating: 4,
    feedback: 'Muito bom'
  }
]

export default function ProviderDashboardPage() {
  const [selectedTab, setSelectedTab] = useState('available')
  
  // Mock provider data
  const provider = {
    name: 'Dr. Maria Santos Silva',
    oab: 'SP123456',
    level: 'Sênior',
    rating: 4.7,
    completedJobs: 142,
    monthlyEarnings: 4850,
    weeklyEarnings: 1225,
    todayEarnings: 245,
    nextPayout: '15/09/2025',
    badges: ['Top Performer', 'Especialista Trabalhista', 'Entregas Rápidas'],
    score: 92
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'SIMPLES': return 'bg-green-100 text-green-700'
      case 'MÉDIA': return 'bg-yellow-100 text-yellow-700'
      case 'COMPLEXA': return 'bg-orange-100 text-orange-700'
      case 'MUITO_COMPLEXA': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDeadlineColor = (deadline: string) => {
    if (deadline.includes('24h')) return 'text-red-600'
    if (deadline.includes('48h')) return 'text-orange-600'
    return 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/avatar-placeholder.png" />
                <AvatarFallback>MS</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">Olá, {provider.name.split(' ')[1]}!</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{provider.oab}</span>
                  <Badge variant="secondary">{provider.level}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span>{provider.rating}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Link href="/portal-prestador/perfil">
                <Button variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-xs text-muted-foreground">Este mês</span>
              </div>
              <div className="text-2xl font-bold">R$ {provider.monthlyEarnings.toLocaleString('pt-BR')}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Próximo pagamento: {provider.nextPayout}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="text-2xl font-bold">{provider.completedJobs}</div>
              <p className="text-xs text-muted-foreground mt-1">Trabalhos concluídos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-xs text-muted-foreground">Score</span>
              </div>
              <div className="text-2xl font-bold">{provider.score}/100</div>
              <Progress value={provider.score} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="text-xs text-muted-foreground">Badges</span>
              </div>
              <div className="text-2xl font-bold">{provider.badges.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Conquistas desbloqueadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <BellRing className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">3 novos trabalhos disponíveis!</p>
                <p className="text-sm text-muted-foreground">
                  Há novas oportunidades compatíveis com seu perfil. Aceite antes que outros peguem!
                </p>
              </div>
              <Button size="sm">Ver agora</Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="available">
              Disponíveis
              <Badge variant="secondary" className="ml-2">
                {AVAILABLE_WORK.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="my-work">
              Meus Trabalhos
              <Badge variant="secondary" className="ml-2">
                {MY_WORK.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
            <TabsTrigger value="earnings">Ganhos</TabsTrigger>
          </TabsList>

          {/* Available Work */}
          <TabsContent value="available" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Trabalhos Disponíveis</h2>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>

            {AVAILABLE_WORK.map((work) => (
              <Card key={work.id} className={work.status === 'urgent' ? 'border-red-200' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{work.type}</Badge>
                        <Badge className={getComplexityColor(work.complexity)}>
                          {work.complexity}
                        </Badge>
                        <Badge variant="secondary">{work.specialty}</Badge>
                        {work.status === 'urgent' && (
                          <Badge variant="destructive">URGENTE</Badge>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">{work.description}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Cliente: {work.client}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className={getDeadlineColor(work.deadline)}>
                            Prazo: {work.deadline}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{work.documents} documentos</span>
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Valor calculado:</span>
                            <span className="text-2xl font-bold text-green-600">
                              R$ {work.value}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Base ({work.type}):</span>
                              <span>R$ {work.baseValue}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Complexidade ({work.multipliers.complexity}x):</span>
                              <span>{work.complexity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Seu nível (Sênior {work.multipliers.experience}x):</span>
                              <span>+20%</span>
                            </div>
                            {work.multipliers.urgency > 1 && (
                              <div className="flex justify-between text-orange-600">
                                <span>Urgência ({work.multipliers.urgency}x):</span>
                                <span>+50%</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="ml-4 space-y-2">
                      <Button className="w-full">
                        Aceitar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Perguntar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* My Work */}
          <TabsContent value="my-work" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Trabalhos em Andamento</h2>
            
            {MY_WORK.map((work) => (
              <Card key={work.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{work.type}</Badge>
                        {work.status === 'in_progress' && (
                          <Badge className="bg-blue-100 text-blue-700">Em progresso</Badge>
                        )}
                        {work.status === 'review' && (
                          <Badge className="bg-yellow-100 text-yellow-700">Em revisão</Badge>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">Cliente: {work.client}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Prazo: {work.deadline} | Valor: R$ {work.value}
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso</span>
                          <span>{work.progress}%</span>
                        </div>
                        <Progress value={work.progress} className="h-2" />
                      </div>

                      {work.feedback && (
                        <Alert className="bg-yellow-50 dark:bg-yellow-950/20">
                          <AlertDescription>{work.feedback}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="ml-4 space-y-2">
                      {!work.submitted ? (
                        <>
                          <Button className="w-full">
                            Continuar
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                          <Button variant="outline" className="w-full">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Chat
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Enviado
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Completed */}
          <TabsContent value="completed" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Trabalhos Concluídos</h2>
            
            {COMPLETED_WORK.map((work) => (
              <Card key={work.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{work.type}</Badge>
                        <Badge className="bg-green-100 text-green-700">Concluído</Badge>
                      </div>
                      <div>
                        <h3 className="font-semibold">{work.client}</h3>
                        <p className="text-sm text-muted-foreground">
                          Concluído {work.completedAt} | Recebido: R$ {work.value}
                        </p>
                      </div>
                      {work.feedback && (
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < work.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            "{work.feedback}"
                          </span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost">
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Earnings */}
          <TabsContent value="earnings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Ganhos</CardTitle>
                  <CardDescription>Acompanhe sua evolução financeira</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Hoje</p>
                      <p className="text-2xl font-bold">R$ {provider.todayEarnings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Esta semana</p>
                      <p className="text-2xl font-bold">R$ {provider.weeklyEarnings.toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Este mês</p>
                      <p className="text-2xl font-bold">R$ {provider.monthlyEarnings.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold">Saldo disponível</p>
                        <p className="text-sm text-muted-foreground">
                          Próximo pagamento em {provider.nextPayout}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-600">
                          R$ {provider.monthlyEarnings.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button className="w-full">
                      <Wallet className="mr-2 h-4 w-4" />
                      Solicitar Saque
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Transações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { date: '10/09/2025', type: 'Petição Inicial', value: 82, status: 'pago' },
                      { date: '08/09/2025', type: 'Contestação', value: 56, status: 'pago' },
                      { date: '05/09/2025', type: 'Recurso', value: 145, status: 'pendente' },
                    ].map((transaction, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{transaction.type}</p>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">R$ {transaction.value}</p>
                          <Badge variant={transaction.status === 'pago' ? 'default' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}