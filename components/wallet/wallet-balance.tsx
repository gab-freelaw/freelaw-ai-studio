'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { freelawAPI, type WalletBalance } from '@/lib/sdk/freelaw-api';

export function WalletBalanceCard() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await freelawAPI.getWalletBalance();
      setBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar saldo');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Erro</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadBalance} variant="outline" size="sm">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Saldo Disponível */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {freelawAPI.formatCurrency(balance?.balance || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Disponível para saque
          </p>
        </CardContent>
      </Card>

      {/* Saldo Pendente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Pendente</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {freelawAPI.formatCurrency(balance?.pendingBalance || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Aguardando liberação
          </p>
        </CardContent>
      </Card>

      {/* Total Ganho */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Ganho</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {freelawAPI.formatCurrency(balance?.totalEarned || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Receita total na plataforma
          </p>
        </CardContent>
      </Card>

      {/* Total Sacado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sacado</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {freelawAPI.formatCurrency(balance?.totalWithdrawn || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Já transferido para conta
          </p>
        </CardContent>
      </Card>

      {/* Saldo Bloqueado */}
      {balance && balance.blockedBalance > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Valor em Processamento
              <Badge variant="secondary">
                {freelawAPI.formatCurrency(balance.blockedBalance)}
              </Badge>
            </CardTitle>
            <CardDescription>
              Saques em andamento que serão processados em até 24h
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

