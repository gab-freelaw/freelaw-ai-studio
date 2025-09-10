'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, Info } from 'lucide-react';
import { freelawAPI, type PricingFactors, type PricingResult } from '@/lib/sdk/freelaw-api';

export function PricingCalculator() {
  const [factors, setFactors] = useState<Partial<PricingFactors>>({
    urgencyLevel: 'normal',
    contractorPlan: 'professional',
    providerProfile: 'adjustment',
    complexityMultiplier: 1.0,
  });
  
  const [result, setResult] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!factors.serviceType || !factors.legalArea) {
      setError('Selecione o tipo de serviço e área do direito');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const pricing = await freelawAPI.calculatePrice(factors as PricingFactors);
      setResult(pricing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao calcular preço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Preços
          </CardTitle>
          <CardDescription>
            Calcule quanto você receberá por um serviço
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo de Serviço */}
          <div className="space-y-2">
            <Label>Tipo de Serviço</Label>
            <Select 
              value={factors.serviceType} 
              onValueChange={(value) => setFactors({ ...factors, serviceType: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="petition">Petição</SelectItem>
                <SelectItem value="contract">Contrato</SelectItem>
                <SelectItem value="opinion">Parecer</SelectItem>
                <SelectItem value="hearing">Audiência</SelectItem>
                <SelectItem value="analysis">Análise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Área do Direito */}
          <div className="space-y-2">
            <Label>Área do Direito</Label>
            <Select 
              value={factors.legalArea} 
              onValueChange={(value) => setFactors({ ...factors, legalArea: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="civil">Cível</SelectItem>
                <SelectItem value="criminal">Criminal</SelectItem>
                <SelectItem value="labor">Trabalhista</SelectItem>
                <SelectItem value="tax">Tributário</SelectItem>
                <SelectItem value="corporate">Empresarial</SelectItem>
                <SelectItem value="family">Família</SelectItem>
                <SelectItem value="administrative">Administrativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Urgência */}
          <div className="space-y-2">
            <Label>Urgência</Label>
            <Select 
              value={factors.urgencyLevel} 
              onValueChange={(value) => setFactors({ ...factors, urgencyLevel: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (7 dias) - 1.0x</SelectItem>
                <SelectItem value="urgent">Urgente (3 dias) - 1.5x</SelectItem>
                <SelectItem value="super_urgent">Super Urgente (24h) - 2.0x</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Perfil do Prestador */}
          <div className="space-y-2">
            <Label>Seu Perfil</Label>
            <Select 
              value={factors.providerProfile} 
              onValueChange={(value) => setFactors({ ...factors, providerProfile: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calibration">Calibração - 0.8x</SelectItem>
                <SelectItem value="restricted">Restrito - 0.9x</SelectItem>
                <SelectItem value="adjustment">Ajuste - 1.0x</SelectItem>
                <SelectItem value="elite">Elite - 1.2x</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Complexidade */}
          <div className="space-y-2">
            <Label>Complexidade (opcional)</Label>
            <Input
              type="number"
              step="0.1"
              min="0.5"
              max="3.0"
              value={factors.complexityMultiplier || 1.0}
              onChange={(e) => setFactors({ 
                ...factors, 
                complexityMultiplier: parseFloat(e.target.value) || 1.0 
              })}
              placeholder="1.0"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <Button 
            onClick={handleCalculate} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Calculando...' : 'Calcular Preço'}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado */}
      <Card>
        <CardHeader>
          <CardTitle>Resultado do Cálculo</CardTitle>
          <CardDescription>
            Valor que você receberá por este serviço
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              {/* Valor Principal */}
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {freelawAPI.formatCurrency(result.providerAmount)}
                </div>
                <p className="text-sm text-green-700">
                  Você recebe 100% do valor
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Preço base:</span>
                  <span>{freelawAPI.formatCurrency(result.basePrice)}</span>
                </div>
                
                {result.breakdown.urgencyMultiplier !== 1 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Urgência:</span>
                    <Badge variant="secondary">{result.breakdown.urgencyMultiplier}x</Badge>
                  </div>
                )}
                
                {result.breakdown.providerMultiplier !== 1 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Perfil:</span>
                    <Badge variant="secondary">{result.breakdown.providerMultiplier}x</Badge>
                  </div>
                )}
                
                {result.breakdown.complexityMultiplier !== 1 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Complexidade:</span>
                    <Badge variant="secondary">{result.breakdown.complexityMultiplier}x</Badge>
                  </div>
                )}

                <hr className="my-2" />
                
                <div className="flex items-center justify-between font-medium">
                  <span>Total:</span>
                  <span>{freelawAPI.formatCurrency(result.finalPrice)}</span>
                </div>
              </div>

              {/* Regra Aplicada */}
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Regra aplicada: {result.appliedRule.name}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Preencha os campos e clique em calcular</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

