'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Star, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Trophy,
  Target
} from 'lucide-react';
import { freelawAPI } from '@/lib/sdk/freelaw-api';

interface ProviderDashboard {
  provider: {
    id: string;
    name: string;
    profile: string;
    averageRating: number;
    isVerified: boolean;
    maxConcurrentServices: number;
  };
  performance: {
    classification: string;
    performanceRate: number;
    isSuperLawyer: boolean;
    needsRecovery: boolean;
    servicesCompleted30d: number;
  } | null;
  currentMonth: {
    servicesActive: number;
    servicesCompleted: number;
    earnings: number;
  };
  wallet: {
    balance: number;
    totalEarned: number;
  } | null;
}

export function ProviderDashboard() {
  const [dashboard, setDashboard] = useState<ProviderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await freelawAPI.getProviderDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Erro no Dashboard</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadDashboard} variant="outline">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!dashboard) return null;

  const getProfileColor = (profile: string) => {
    switch (profile) {
      case 'elite': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'adjustment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'restricted': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'calibration': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProfileLabel = (profile: string) => {
    switch (profile) {
      case 'elite': return 'Elite';
      case 'adjustment': return 'Fase de Ajuste';
      case 'restricted': return 'Acesso Restrito';
      case 'calibration': return 'Calibração';
      default: return profile;
    }
  };

  const getPerformanceEmoji = (classification: string) => {
    switch (classification) {
      case 'super_lawyer': return '🟣';
      case 'good': return '🟡';
      case 'regular': return '🟠';
      case 'bad_experience': return '🔴';
      default: return '⚪';
    }
  };

  const utilizationPercentage = (dashboard.currentMonth.servicesActive / dashboard.provider.maxConcurrentServices) * 100;

  return (
    <div className="space-y-6">
      {/* Header do Prestador */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{dashboard.provider.name}</CardTitle>
                <CardDescription>Prestador Freelaw AI Studio</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {dashboard.provider.isVerified && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  ✓ Verificado
                </Badge>
              )}
              <Badge className={getProfileColor(dashboard.provider.profile)}>
                {getProfileLabel(dashboard.provider.profile)}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {dashboard.performance ? (
                <>
                  {getPerformanceEmoji(dashboard.performance.classification)}
                  {dashboard.performance.performanceRate.toFixed(1)}%
                </>
              ) : (
                '⚪ N/A'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.performance?.isSuperLawyer ? 'Super Jurista!' : 'Taxa de intercorrências'}
            </p>
          </CardContent>
        </Card>

        {/* Avaliação Média */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {dashboard.provider.averageRating.toFixed(1)} ⭐
            </div>
            <p className="text-xs text-muted-foreground">
              Média das avaliações
            </p>
          </CardContent>
        </Card>

        {/* Serviços Ativos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.currentMonth.servicesActive}/{dashboard.provider.maxConcurrentServices}
            </div>
            <Progress value={utilizationPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground">
              {utilizationPercentage.toFixed(0)}% da capacidade
            </p>
          </CardContent>
        </Card>

        {/* Ganhos do Mês */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {freelawAPI.formatCurrency(dashboard.currentMonth.earnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.currentMonth.servicesCompleted} serviços completos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Detalhada */}
      {dashboard.performance && (
        <Card>
          <CardHeader>
            <CardTitle>Análise de Performance (Últimos 30 dias)</CardTitle>
            <CardDescription>
              Baseada em {dashboard.performance.servicesCompleted30d} serviços completados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">
                  {getPerformanceEmoji(dashboard.performance.classification)}
                </div>
                <p className="text-sm font-medium">
                  {dashboard.performance.classification === 'super_lawyer' ? 'Super Jurista' :
                   dashboard.performance.classification === 'good' ? 'Bom' :
                   dashboard.performance.classification === 'regular' ? 'Regular' : 'Experiência Ruim'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {dashboard.performance.performanceRate.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Taxa de intercorrências</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {dashboard.performance.servicesCompleted30d}
                </div>
                <p className="text-sm text-muted-foreground">Serviços completados</p>
              </div>
            </div>

            {dashboard.performance.isSuperLawyer && (
              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-800">
                  <Trophy className="h-5 w-5" />
                  <span className="font-semibold">Parabéns! Você é um Super Jurista!</span>
                </div>
                <p className="text-sm text-purple-700 mt-1">
                  Mantenha sua excelência para continuar recebendo benefícios exclusivos.
                </p>
              </div>
            )}

            {dashboard.performance.needsRecovery && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Atenção: Performance precisa melhorar</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Sua taxa de intercorrências está alta. Foque em qualidade e prazos para melhorar sua classificação.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Capacidade e Limites */}
      <Card>
        <CardHeader>
          <CardTitle>Capacidade de Trabalho</CardTitle>
          <CardDescription>
            Baseada no seu perfil {getProfileLabel(dashboard.provider.profile)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Serviços simultâneos</span>
              <span className="font-medium">
                {dashboard.currentMonth.servicesActive} / {dashboard.provider.maxConcurrentServices}
              </span>
            </div>
            
            <Progress value={utilizationPercentage} />
            
            <div className="grid gap-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Calibração:</span>
                <span>Até 10 serviços</span>
              </div>
              <div className="flex justify-between">
                <span>Acesso Restrito:</span>
                <span>Até 5 serviços</span>
              </div>
              <div className="flex justify-between">
                <span>Fase de Ajuste:</span>
                <span>Até 20 serviços</span>
              </div>
              <div className="flex justify-between">
                <span>Elite:</span>
                <span>Até 30 serviços</span>
              </div>
            </div>

            {utilizationPercentage >= 90 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Você está próximo do seu limite. Complete alguns serviços antes de aceitar novos.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🎯 Trabalhos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = '/providers/available-work'}>
              <Target className="h-4 w-4 mr-2" />
              Ver Trabalhos Disponíveis
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">💰 Carteira Digital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {dashboard.wallet ? freelawAPI.formatCurrency(dashboard.wallet.balance) : 'R$ 0,00'}
            </div>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/carteira'}>
              Gerenciar Carteira
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

