'use client'

import { useState, memo, useMemo } from 'react'
import { AppLayout } from '@/components/layouts/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Star, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Filter,
  Search,
  Plus,
  BarChart3,
  Award,
  Target,
  FileText,
  MessageSquare
} from 'lucide-react'

// Mock data - será substituído por dados reais
const EXTERNAL_LAWYERS = [
  {
    id: '1',
    name: 'Dra. Marina Silva',
    specialty: 'Direito Trabalhista',
    rating: 4.9,
    completedTasks: 180,
    avgTime: '2.3 dias',
    success_rate: 95,
    price_range: 'R$ 150-300',
    availability: 'Disponível',
    profile_image: '/avatar-1.jpg'
  },
  {
    id: '2', 
    name: 'Dr. Carlos Oliveira',
    specialty: 'Direito Civil',
    rating: 4.8,
    completedTasks: 120,
    avgTime: '1.8 dias',
    success_rate: 92,
    price_range: 'R$ 200-400',
    availability: 'Ocupado',
    profile_image: '/avatar-2.jpg'
  },
  {
    id: '3',
    name: 'Dra. Ana Paula Costa',
    specialty: 'Direito do Consumidor', 
    rating: 5.0,
    completedTasks: 200,
    avgTime: '1.5 dias',
    success_rate: 98,
    price_range: 'R$ 250-500',
    availability: 'Disponível',
    profile_image: '/avatar-3.jpg'
  }
]

const ACTIVE_DELEGATIONS = [
  {
    id: '1',
    title: 'Petição Inicial - Danos Morais',
    lawyer: 'Dra. Marina Silva',
    deadline: '2024-01-15',
    status: 'Em Andamento',
    progress: 75
  },
  {
    id: '2',
    title: 'Recurso Ordinário Trabalhista',
    lawyer: 'Dr. Carlos Oliveira', 
    deadline: '2024-01-10',
    status: 'Revisão',
    progress: 90
  }
]

const PERFORMANCE_COMPARISON = {
  ai: { quality: 85, speed: 95, cost: 98, satisfaction: 82 },
  external: { quality: 92, speed: 78, cost: 75, satisfaction: 90 },
  internal: { quality: 88, speed: 85, cost: 85, satisfaction: 87 }
}

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState('lawyers')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('all')

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
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">
                      Marketplace de Advogados
                    </h1>
                    <p className="mt-1 text-freelaw-purple-light/90">
                      Delegue tarefas para especialistas e gerencie sua equipe externa
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button 
                    className="bg-white text-freelaw-purple hover:bg-white/90"
                    onClick={() => setActiveTab('new-delegation')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Delegação
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="lawyers">Advogados Externos</TabsTrigger>
              <TabsTrigger value="delegations">Delegações Ativas</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="new-delegation">Nova Delegação</TabsTrigger>
            </TabsList>

            {/* Advogados Externos */}
            <TabsContent value="lawyers" className="space-y-6">
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar advogados por nome ou especialidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="trabalhista">Direito Trabalhista</SelectItem>
                    <SelectItem value="civil">Direito Civil</SelectItem>
                    <SelectItem value="consumidor">Direito do Consumidor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de Advogados */}
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {EXTERNAL_LAWYERS.map((lawyer) => (
                  <Card key={lawyer.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{lawyer.name}</CardTitle>
                          <CardDescription>{lawyer.specialty}</CardDescription>
                        </div>
                        <Badge 
                          variant={lawyer.availability === 'Disponível' ? 'default' : 'secondary'}
                          className={lawyer.availability === 'Disponível' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {lawyer.availability}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{lawyer.rating}</span>
                        </div>
                        <span className="text-muted-foreground">{lawyer.completedTasks} tarefas</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Tempo médio</p>
                          <p className="font-medium">{lawyer.avgTime}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Taxa de sucesso</p>
                          <p className="font-medium">{lawyer.success_rate}%</p>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-muted-foreground">Faixa de preço</p>
                        <p className="font-medium">{lawyer.price_range}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Conversar
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Ver Perfil
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Delegações Ativas */}
            <TabsContent value="delegations" className="space-y-6">
              <div className="grid gap-6">
                {ACTIVE_DELEGATIONS.map((delegation) => (
                  <Card key={delegation.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{delegation.title}</CardTitle>
                          <CardDescription>Delegado para: {delegation.lawyer}</CardDescription>
                        </div>
                        <Badge 
                          variant={delegation.status === 'Em Andamento' ? 'default' : 'secondary'}
                        >
                          {delegation.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Prazo: {delegation.deadline}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Progresso: {delegation.progress}%</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Ver Detalhes</Button>
                          <Button size="sm">Chat</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Performance Comparativa */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-tech-blue rounded-full" />
                      <span>IA</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(PERFORMANCE_COMPARISON.ai).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm capitalize">{key === 'quality' ? 'Qualidade' : key === 'speed' ? 'Velocidade' : key === 'cost' ? 'Custo-benefício' : 'Satisfação'}</span>
                        <span className="font-medium">{value}%</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-product-pink rounded-full" />
                      <span>Advogados Externos</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(PERFORMANCE_COMPARISON.external).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm capitalize">{key === 'quality' ? 'Qualidade' : key === 'speed' ? 'Velocidade' : key === 'cost' ? 'Custo-benefício' : 'Satisfação'}</span>
                        <span className="font-medium">{value}%</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-freelaw-purple rounded-full" />
                      <span>Equipe Interna</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(PERFORMANCE_COMPARISON.internal).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm capitalize">{key === 'quality' ? 'Qualidade' : key === 'speed' ? 'Velocidade' : key === 'cost' ? 'Custo-benefício' : 'Satisfação'}</span>
                        <span className="font-medium">{value}%</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Nova Delegação */}
            <TabsContent value="new-delegation">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Nova Delegação</CardTitle>
                  <CardDescription>
                    Delegue uma tarefa para um advogado especialista da nossa rede
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => window.location.href = '/delegacoes/nova'}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Iniciar Nova Delegação
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  )
}
