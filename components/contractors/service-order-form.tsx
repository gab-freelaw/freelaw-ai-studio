'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calculator, Clock } from 'lucide-react';
import { freelawAPI, type CreateServiceOrderRequest, type PricingResult } from '@/lib/sdk/freelaw-api';

export function ServiceOrderForm() {
  const [formData, setFormData] = useState<Partial<CreateServiceOrderRequest>>({
    urgency: 'normal',
    contractorPlan: 'professional',
  });
  
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = async () => {
    if (!formData.type || !formData.legalArea) return;

    try {
      const result = await freelawAPI.calculatePrice({
        serviceType: formData.type,
        legalArea: formData.legalArea,
        urgencyLevel: formData.urgency || 'normal',
        contractorPlan: formData.contractorPlan || 'professional',
        providerProfile: 'adjustment', // Perfil médio para estimativa
        complexityMultiplier: formData.complexityMultiplier,
      });
      setPricing(result);
    } catch (err) {
      console.error('Erro ao calcular preço:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.type || !formData.legalArea) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await freelawAPI.createServiceOrder(formData as CreateServiceOrderRequest);
      
      setSuccess(true);
      setFormData({
        urgency: 'normal',
        contractorPlan: 'professional',
      });
      setPricing(null);
      
      // Reset success message
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar ordem de serviço');
    } finally {
      setLoading(false);
    }
  };

  // Auto-calcular preço quando campos mudam
  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    if (newData.type && newData.legalArea) {
      calculatePrice();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Formulário */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Ordem de Serviço
          </CardTitle>
          <CardDescription>
            Crie uma nova delegação para prestadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título do Serviço *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Ex: Petição inicial de divórcio consensual"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição Detalhada *</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Descreva detalhadamente o que precisa ser feito..."
                rows={4}
              />
            </div>

            {/* Tipo e Área */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Serviço *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleFieldChange('type', value)}
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

              <div className="space-y-2">
                <Label>Área do Direito *</Label>
                <Select 
                  value={formData.legalArea} 
                  onValueChange={(value) => handleFieldChange('legalArea', value)}
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
            </div>

            {/* Urgência e Complexidade */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Urgência</Label>
                <Select 
                  value={formData.urgency} 
                  onValueChange={(value) => handleFieldChange('urgency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal (7 dias)</SelectItem>
                    <SelectItem value="urgent">Urgente (3 dias) +50%</SelectItem>
                    <SelectItem value="super_urgent">Super Urgente (24h) +100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Complexidade</Label>
                <Select 
                  value={formData.complexityMultiplier?.toString() || '1.0'} 
                  onValueChange={(value) => handleFieldChange('complexityMultiplier', parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.8">Simples (-20%)</SelectItem>
                    <SelectItem value="1.0">Normal</SelectItem>
                    <SelectItem value="1.3">Complexa (+30%)</SelectItem>
                    <SelectItem value="1.5">Muito Complexa (+50%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mensagens */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                ✅ Ordem de serviço criada com sucesso! Um prestador será atribuído em breve.
              </div>
            )}

            {/* Botão */}
            <Button 
              type="submit" 
              disabled={loading || !formData.title || !formData.type}
              className="w-full"
            >
              {loading ? 'Criando...' : 'Criar Ordem de Serviço'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preview do Preço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Estimativa de Custo
          </CardTitle>
          <CardDescription>
            Valor que será pago ao prestador
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pricing ? (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {freelawAPI.formatCurrency(pricing.providerAmount)}
                </div>
                <p className="text-sm text-green-700">
                  Prestador recebe 100%
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Preço base:</span>
                  <span>{freelawAPI.formatCurrency(pricing.basePrice)}</span>
                </div>
                
                {pricing.breakdown.urgencyMultiplier !== 1 && (
                  <div className="flex justify-between">
                    <span>Urgência:</span>
                    <Badge variant="secondary">{pricing.breakdown.urgencyMultiplier}x</Badge>
                  </div>
                )}
                
                {pricing.breakdown.complexityMultiplier !== 1 && (
                  <div className="flex justify-between">
                    <span>Complexidade:</span>
                    <Badge variant="secondary">{pricing.breakdown.complexityMultiplier}x</Badge>
                  </div>
                )}

                <hr />
                
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{freelawAPI.formatCurrency(pricing.finalPrice)}</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                Regra: {pricing.appliedRule.name}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Preencha tipo e área para ver o preço</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

