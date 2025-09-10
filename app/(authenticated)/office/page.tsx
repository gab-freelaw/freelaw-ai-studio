'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layouts/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign,
  FileText,
  Clock,
  Target,
  Award,
  Brain,
  BarChart3,
  PieChart,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Download,
  RefreshCw,
  Zap,
  Scale,
  Heart
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Mock data - será integrado com dados reais
const OFFICE_PROFILE = {
  name: "Escritório Santos & Associados",
  founded: "2015",
  lawyers: 12,
  specialties: ["Direito Civil", "Trabalhista", "Empresarial"],
  oab_registration: "SP 123.456",
  address: "São Paulo, SP"
}

const BUSINESS_METRICS = {
  revenue: {
    current_month: 180000,
    last_month: 165000,
    current_year: 1950000,
    last_year: 1680000
  },
  cases: {
    active: 156,
    won: 142,
    lost: 18,
    settled: 89
  },
  productivity: {
    petitions_generated: 89,
    ai_usage_percent: 65,
    avg_case_duration: 45,
    client_satisfaction: 4.7
  },
  team_performance: {
    internal_lawyers: 8,
    external_lawyers: 24,
    ai_vs_human_quality: { ai: 85, human: 92 },
    cost_savings: 35
  }
}

const REVENUE_CHART_DATA = [
  { month: 'Jan', receita: 145000, despesas: 89000, lucro: 56000 },
  { month: 'Fev', receita: 158000, despesas: 92000, lucro: 66000 },
  { month: 'Mar', receita: 162000, despesas: 88000, lucro: 74000 },
  { month: 'Abr', receita: 175000, despesas: 95000, lucro: 80000 },
  { month: 'Mai', receita: 165000, despesas: 90000, lucro: 75000 },
  { month: 'Jun', receita: 180000, despesas: 94000, lucro: 86000 }
]

const CASE_DISTRIBUTION = [
  { name: 'Trabalhista', value: 45, color: '#6B46C1' },
  { name: 'Civil', value: 30, color: '#9333EA' },
  { name: 'Empresarial', value: 20, color: '#C084FC' },
  { name: 'Outros', value: 5, color: '#E9D5FF' }
]

const TEAM_STATS = [
  {
    name: "Dr. João Silva",
    role: "Sócio",
    cases: 23,
    success_rate: 95,
    avg_time: "32 dias",
    satisfaction: 4.9,
    revenue_generated: 85000
  },
  {
    name: "Dra. Maria Santos", 
    role: "Advogada Sênior",
    cases: 18,
    success_rate: 89,
    avg_time: "28 dias", 
    satisfaction: 4.8,
    revenue_generated: 72000
  },
  {
    name: "Dr. Carlos Oliveira",
    role: "Advogado Júnior",
    cases: 15,
    success_rate: 87,
    avg_time: "35 dias",
    satisfaction: 4.6,
    revenue_generated: 58000
  }
]

const AI_METRICS = {
  documents_processed: 1247,
  time_saved_hours: 324,
  accuracy_rate: 94,
  cost_reduction: 42000
}

const STYLE_ANALYSIS = {
  writing_style: "Formal e técnico",
  avg_document_length: "3.2 páginas",
  most_used_terms: ["fundamentação", "jurisprudência", "precedente"],
  consistency_score: 88
}

export default function OfficePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('last_6_months')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Carregar dados de analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/analytics/dashboard')
        if (response.ok) {
          const data = await response.json()
          setAnalyticsData(data.data)
        } else {
          console.error('Failed to load analytics data')
        }
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [selectedPeriod])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getGrowthPercentage = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1)
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
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">
                      Perfil do Escritório
                    </h1>
                    <p className="mt-1 text-freelaw-purple-light/90">
                      Dashboard executivo, equipe, estilo e performance
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-48 bg-white text-freelaw-purple">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
                      <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                      <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
                      <SelectItem value="last_year">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="bg-white text-freelaw-purple border-white hover:bg-white/90">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard">Dashboard Executivo</TabsTrigger>
              <TabsTrigger value="team">Equipe</TabsTrigger>
              <TabsTrigger value="style">Estilo & IA</TabsTrigger>
              <TabsTrigger value="clients">Clientes</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            {/* Dashboard Executivo */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* KPIs Principais */}
              {loading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
              ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Serviços Totais</p>
                          <p className="text-2xl font-bold">
                            {analyticsData?.serviceQuality?.totalServices || 0}
                          </p>
                          <div className="flex items-center mt-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600">
                              {analyticsData?.serviceQuality?.completedServices || 0} concluídos
                            </span>
                          </div>
                        </div>
                        <FileText className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Qualidade Média</p>
                          <p className="text-2xl font-bold">
                            {analyticsData?.serviceQuality?.averageRating || 0}/5
                          </p>
                          <div className="flex items-center mt-1">
                            <Award className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-600">
                              Avaliação dos serviços
                            </span>
                          </div>
                        </div>
                        <Scale className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Prazo Médio</p>
                          <p className="text-2xl font-bold">
                            {analyticsData?.serviceQuality?.averageCompletionTime || 0} dias
                          </p>
                          <div className="flex items-center mt-1">
                            <Clock className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-purple-600">
                              Tempo de conclusão
                            </span>
                          </div>
                        </div>
                        <Clock className="w-8 h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Satisfação Cliente</p>
                          <p className="text-2xl font-bold">
                            {analyticsData?.clientSatisfaction?.averageSatisfaction || 0}/5
                          </p>
                          <div className="flex items-center mt-1">
                            <Heart className="w-4 h-4 text-pink-600" />
                            <span className="text-sm text-pink-600">
                              {analyticsData?.clientSatisfaction?.totalClients || 0} clientes
                            </span>
                          </div>
                        </div>
                        <Users className="w-8 h-8 text-pink-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Gráficos de Revenue e Casos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Receita vs Despesas</CardTitle>
                    <CardDescription>Últimos 6 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={REVENUE_CHART_DATA}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Area type="monotone" dataKey="receita" stackId="1" stroke="#6B46C1" fill="#6B46C1" opacity={0.8} />
                        <Area type="monotone" dataKey="despesas" stackId="2" stroke="#EF4444" fill="#EF4444" opacity={0.8} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Casos</CardTitle>
                    <CardDescription>Por área do direito</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={CASE_DISTRIBUTION}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {CASE_DISTRIBUTION.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Métricas de Produtividade */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Tempo Médio por Caso</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {BUSINESS_METRICS.productivity.avg_case_duration} dias
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      15% melhor que a média do mercado
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Petições Geradas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {BUSINESS_METRICS.productivity.petitions_generated}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Este mês
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5" />
                      <span>Taxa de Sucesso</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {Math.round(BUSINESS_METRICS.cases.won / (BUSINESS_METRICS.cases.won + BUSINESS_METRICS.cases.lost) * 100)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {BUSINESS_METRICS.cases.won} ganhos de {BUSINESS_METRICS.cases.won + BUSINESS_METRICS.cases.lost} finalizados
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Equipe */}
            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance da Equipe</CardTitle>
                  <CardDescription>Métricas individuais dos advogados</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 border rounded-lg animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
                          <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((j) => (
                              <div key={j} className="h-6 bg-gray-200 rounded"></div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analyticsData?.servicesByLawyer?.map((lawyer: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{lawyer.providerName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {lawyer.providerType === 'internal' ? 'Advogado Interno' :
                                 lawyer.providerType === 'external' ? 'Advogado Externo' : 'IA'}
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={lawyer.providerType === 'internal' ? 'border-blue-300 text-blue-700' :
                                        lawyer.providerType === 'external' ? 'border-green-300 text-green-700' :
                                        'border-purple-300 text-purple-700'}
                            >
                              {lawyer.totalServices} serviços
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Avaliação Média</p>
                              <p className="font-medium">{lawyer.averageRating}/5.0</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Taxa de Conclusão</p>
                              <p className="font-medium">{lawyer.completionRate}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Tempo Médio</p>
                              <p className="font-medium">{lawyer.averageCompletionTime} dias</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Tipo</p>
                              <p className="font-medium capitalize">
                                {lawyer.providerType === 'internal' ? 'Interno' :
                                 lawyer.providerType === 'external' ? 'Externo' : 'IA'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhum dado de equipe disponível
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Estilo & IA */}
            <TabsContent value="style" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Estilo do Escritório</CardTitle>
                    <CardDescription>Padrões identificados pela IA</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Estilo de Redação</p>
                      <p className="font-medium">{STYLE_ANALYSIS.writing_style}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tamanho Médio de Documentos</p>
                      <p className="font-medium">{STYLE_ANALYSIS.avg_document_length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Consistência do Estilo</p>
                      <div className="flex items-center space-x-2">
                        <Progress value={STYLE_ANALYSIS.consistency_score} className="flex-1" />
                        <span className="text-sm font-medium">{STYLE_ANALYSIS.consistency_score}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Termos Mais Utilizados</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {STYLE_ANALYSIS.most_used_terms.map((term, index) => (
                          <Badge key={index} variant="secondary">{term}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Métricas de IA</CardTitle>
                    <CardDescription>Impacto da inteligência artificial</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Documentos Processados</p>
                        <p className="text-2xl font-bold text-blue-600">{AI_METRICS.documents_processed}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Horas Economizadas</p>
                        <p className="text-2xl font-bold text-green-600">{AI_METRICS.time_saved_hours}h</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa de Precisão</p>
                        <p className="text-2xl font-bold text-purple-600">{AI_METRICS.accuracy_rate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Economia de Custos</p>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(AI_METRICS.cost_reduction)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Clientes */}
            <TabsContent value="clients" className="space-y-6">
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="animate-pulse">
                          <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Métricas Gerais de Clientes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Métricas de Clientes</CardTitle>
                      <CardDescription>Análise de satisfação e retenção</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total de Clientes</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {analyticsData?.clientSatisfaction?.totalClients || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                          <p className="text-2xl font-bold text-green-600">
                            {analyticsData?.clientSatisfaction?.activeClients || 0}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Satisfação Média</p>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={(analyticsData?.clientSatisfaction?.averageSatisfaction || 0) * 20} 
                            className="flex-1" 
                          />
                          <span className="text-sm font-medium">
                            {analyticsData?.clientSatisfaction?.averageSatisfaction || 0}/5.0
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Taxa de Retenção</p>
                        <p className="text-lg font-semibold">
                          {analyticsData?.clientSatisfaction?.activeClients && analyticsData?.clientSatisfaction?.totalClients
                            ? Math.round((analyticsData.clientSatisfaction.activeClients / analyticsData.clientSatisfaction.totalClients) * 100)
                            : 0}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Áreas por Satisfação */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Áreas com Melhor Satisfação</CardTitle>
                      <CardDescription>Ranking por avaliação dos clientes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analyticsData?.clientSatisfaction?.topAreas?.map((area: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{area.legalArea}</h4>
                              <p className="text-sm text-muted-foreground">
                                {area.clientCount} clientes
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-sm ${
                                      star <= Math.round(area.satisfaction)
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <p className="text-sm font-medium">{area.satisfaction}/5.0</p>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-4 text-muted-foreground">
                            Nenhum dado de satisfação disponível
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Análise de Serviços por Área */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Serviços por Área do Direito</CardTitle>
                      <CardDescription>Volume e qualidade por especialização</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData?.servicesByArea?.map((area: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold">{area.legalArea}</h3>
                              <Badge variant="outline">{area.totalServices} serviços</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Avaliação Média</p>
                                <p className="font-medium">{area.averageRating}/5.0</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Prazo Médio</p>
                                <p className="font-medium">{area.averageCompletionTime} dias</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Tipos de Serviço</p>
                                <p className="font-medium">{area.serviceTypes?.length || 0} diferentes</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Principal Serviço</p>
                                <p className="font-medium">
                                  {area.serviceTypes?.[0]?.serviceType || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-8 text-muted-foreground">
                            Nenhum dado de serviços por área disponível
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Configurações */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Escritório</CardTitle>
                  <CardDescription>Configurações e dados do escritório</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome do Escritório</p>
                      <p className="font-medium">{OFFICE_PROFILE.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fundado em</p>
                      <p className="font-medium">{OFFICE_PROFILE.founded}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Registro OAB</p>
                      <p className="font-medium">{OFFICE_PROFILE.oab_registration}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium">{OFFICE_PROFILE.address}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Especialidades</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {OFFICE_PROFILE.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline">{specialty}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button>
                      <Settings className="w-4 h-4 mr-2" />
                      Editar Configurações
                    </Button>
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
