'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CountUp from 'react-countup'
import { motion } from 'framer-motion'
import { 
  Star,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  BarChart3,
  Award,
  MessageSquare,
  Settings,
  RefreshCw
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { toast } from 'sonner'

export default function ProviderDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [updatingGoal, setUpdatingGoal] = useState(false)
  const [newGoal, setNewGoal] = useState<number>(10)

  // Carregar dados do dashboard
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/providers/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data.data)
        setNewGoal(data.data.performance.monthlyGoal)
      } else {
        toast.error('Erro ao carregar dados do dashboard')
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const updateMonthlyGoal = async () => {
    try {
      setUpdatingGoal(true)
      const response = await fetch('/api/providers/goal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ monthlyGoal: newGoal })
      })

      if (response.ok) {
        toast.success('Meta mensal atualizada com sucesso!')
        await loadDashboardData() // Recarregar dados
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao atualizar meta')
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      toast.error('Erro ao atualizar meta')
    } finally {
      setUpdatingGoal(false)
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 3.5) return 'text-yellow-600'
    if (rating >= 2.5) return 'text-orange-600'
    return 'text-red-600'
  }

  const getIncidentColor = (rate: number) => {
    if (rate <= 5) return 'text-green-600'
    if (rate <= 15) return 'text-yellow-600'
    if (rate <= 25) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-purple/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-purple/5">
      {/* Header */}
      <div className="bg-gradient-purple text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Meu Dashboard
                  </h1>
                  <p className="mt-1 text-freelaw-purple-light/90">
                    Acompanhe sua performance e métricas de serviços
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <LoadingButton 
                  variant="outline" 
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                  onClick={loadDashboardData}
                  loadingText="Atualizando..."
                  loadingKey="provider-dashboard-refresh"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </LoadingButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nota Média</p>
                        <p className={`text-2xl font-bold ${getRatingColor(dashboardData?.performance?.averageRating || 0)}`}>
                          <CountUp
                            end={dashboardData?.performance?.averageRating || 0}
                            decimals={1}
                            duration={2}
                            preserveValue
                          />/5
                        </p>
                        <div className="flex items-center mt-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-muted-foreground ml-1">
                            <CountUp
                              end={dashboardData?.performance?.totalServices || 0}
                              duration={2}
                              preserveValue
                            /> avaliações
                          </span>
                        </div>
                      </div>
                      <div className="h-12 w-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
                        <Award className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">% Intercorrências</p>
                        <p className={`text-2xl font-bold ${getIncidentColor(dashboardData?.performance?.incidentRate || 0)}`}>
                          <CountUp
                            end={dashboardData?.performance?.incidentRate || 0}
                            decimals={1}
                            duration={2}
                            preserveValue
                          />%
                        </p>
                        <div className="flex items-center mt-1">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-muted-foreground ml-1">
                            <CountUp
                              end={dashboardData?.incidents?.totalIncidents || 0}
                              duration={2}
                              preserveValue
                            /> incidentes
                          </span>
                        </div>
                      </div>
                      <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Serviços Este Mês</p>
                        <p className="text-2xl font-bold text-blue-600">
                          <CountUp
                            end={dashboardData?.performance?.currentMonthServices || 0}
                            duration={2}
                            preserveValue
                          />
                        </p>
                        <div className="flex items-center mt-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600">
                            <CountUp
                              end={dashboardData?.performance?.completedServices || 0}
                              duration={2}
                              preserveValue
                            /> concluídos
                          </span>
                        </div>
                      </div>
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Meta Mensal</p>
                        <p className="text-2xl font-bold text-purple-600">
                          <CountUp
                            end={dashboardData?.performance?.monthlyGoal || 0}
                            duration={2}
                            preserveValue
                          />
                        </p>
                        <div className="flex items-center mt-1">
                          <Target className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-purple-600">
                            <CountUp
                              end={Math.round(dashboardData?.performance?.goalProgress || 0)}
                              duration={2}
                              preserveValue
                            />% alcançado
                          </span>
                        </div>
                      </div>
                      <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Progresso da Meta */}
            <Card>
              <CardHeader>
                <CardTitle>Progresso da Meta Mensal</CardTitle>
                <CardDescription>
                  {dashboardData?.performance?.currentMonthServices || 0} de {dashboardData?.performance?.monthlyGoal || 0} serviços este mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={dashboardData?.performance?.goalProgress || 0} className="h-3" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0 serviços</span>
                    <span>{dashboardData?.performance?.monthlyGoal || 0} serviços (meta)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Serviços Mensais */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Serviços</CardTitle>
                <CardDescription>Últimos 12 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dashboardData?.monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="servicesCompleted" 
                      stackId="1" 
                      stroke="#6B46C1" 
                      fill="#6B46C1" 
                      opacity={0.8}
                      name="Serviços Concluídos"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="goal" 
                      stackId="2" 
                      stroke="#9CA3AF" 
                      fill="none" 
                      strokeDasharray="5 5"
                      name="Meta Mensal"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Análise de Intercorrências */}
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Intercorrências</CardTitle>
                  <CardDescription>Breakdown dos problemas identificados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Notas Baixas (1-2)</p>
                      <p className="text-2xl font-bold text-red-600">
                        {dashboardData?.incidents?.lowRatings || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Entregas Atrasadas</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {dashboardData?.incidents?.lateDeliveries || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Problemas Mais Comuns</p>
                    <div className="space-y-2">
                      {dashboardData?.incidents?.mostCommonIssues?.map((issue: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="capitalize">{issue.issue}</span>
                          <Badge variant="outline">{issue.count}</Badge>
                        </div>
                      )) || (
                        <p className="text-muted-foreground">Nenhum problema identificado</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Taxa de Entrega no Prazo */}
              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Entrega no Prazo</CardTitle>
                  <CardDescription>Performance de pontualidade</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {dashboardData?.performance?.onTimeDeliveryRate || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Entregas realizadas no prazo
                    </p>
                  </div>
                  <Progress value={dashboardData?.performance?.onTimeDeliveryRate || 0} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">No Prazo</p>
                      <p className="font-medium">
                        {Math.round((dashboardData?.performance?.onTimeDeliveryRate || 0) * (dashboardData?.performance?.completedServices || 0) / 100)} serviços
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Com Atraso</p>
                      <p className="font-medium">
                        {dashboardData?.incidents?.lateDeliveries || 0} serviços
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Avaliações por Mês */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução das Avaliações</CardTitle>
                <CardDescription>Nota média por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData?.monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="averageRating" 
                      stroke="#6B46C1" 
                      strokeWidth={3}
                      name="Nota Média"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Recente</CardTitle>
                <CardDescription>Comentários dos clientes sobre seus serviços</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentFeedback?.map((feedback: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="outline">{feedback.legalArea}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(feedback.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm">{feedback.clientFeedback}</p>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum feedback disponível ainda</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metas */}
          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Meta Mensal</CardTitle>
                <CardDescription>Defina quantos serviços deseja realizar por mês</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="monthlyGoal">Meta de Serviços por Mês</Label>
                      <Input
                        id="monthlyGoal"
                        type="number"
                        min="1"
                        max="100"
                        value={newGoal}
                        onChange={(e) => setNewGoal(parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Recomendamos entre 5-20 serviços por mês para manter a qualidade
                      </p>
                    </div>
                    <Button 
                      onClick={updateMonthlyGoal}
                      disabled={updatingGoal || newGoal === dashboardData?.performance?.monthlyGoal}
                    >
                      {updatingGoal ? 'Atualizando...' : 'Atualizar Meta'}
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">Progresso Atual</p>
                      <div className="mt-2">
                        <Progress value={dashboardData?.performance?.goalProgress || 0} className="h-3" />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>{dashboardData?.performance?.currentMonthServices || 0} realizados</span>
                          <span>{dashboardData?.performance?.monthlyGoal || 0} meta</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Dica</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Estabeleça metas realistas baseadas no seu tempo disponível. 
                        Uma meta bem planejada ajuda a manter consistência e qualidade.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}