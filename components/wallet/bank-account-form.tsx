'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, Plus } from 'lucide-react';
import { freelawAPI, type CreateBankAccountRequest } from '@/lib/sdk/freelaw-api';

// Funções de máscara
const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
    .substring(0, 14);
};

interface BankAccountFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BankAccountForm({ onSuccess, onCancel }: BankAccountFormProps) {
  const [formData, setFormData] = useState({
    bankCode: '',
    agency: '',
    accountNumber: '',
    accountDigit: '',
    accountType: 'checking' as 'checking' | 'savings',
    holderName: '',
    holderDocument: '',
    documentType: 'cpf' as 'cpf' | 'cnpj',
    pixKey: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentChange = (value: string) => {
    const masked = formData.documentType === 'cpf' ? maskCPF(value) : maskCNPJ(value);
    updateFormData('holderDocument', masked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bankCode || !formData.agency || !formData.accountNumber || 
        !formData.accountDigit || !formData.holderName || !formData.holderDocument) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const bankAccount: CreateBankAccountRequest = {
        bankCode: formData.bankCode,
        agency: formData.agency,
        accountNumber: formData.accountNumber,
        accountDigit: formData.accountDigit,
        accountType: formData.accountType,
        holderName: formData.holderName,
        holderDocument: formData.holderDocument.replace(/\D/g, ''),
        pixKey: formData.pixKey || undefined,
      };

      await freelawAPI.createBankAccount(bankAccount);
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar conta bancária');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Cadastrar Conta Bancária
        </CardTitle>
        <CardDescription>
          Adicione uma conta para receber seus pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">🔒 Dados Seguros</h4>
              <p className="text-sm text-yellow-700">
                Seus dados bancários são criptografados e usados apenas para pagamentos. 
                Você pode cadastrar múltiplas contas e escolher qual usar em cada saque.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados do Banco */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankCode">Código do Banco *</Label>
              <Input
                id="bankCode"
                value={formData.bankCode}
                onChange={(e) => updateFormData('bankCode', e.target.value)}
                placeholder="341 (Itaú), 001 (BB), 237 (Bradesco)"
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency">Agência *</Label>
              <Input
                id="agency"
                value={formData.agency}
                onChange={(e) => updateFormData('agency', e.target.value)}
                placeholder="1234"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="accountNumber">Número da Conta *</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => updateFormData('accountNumber', e.target.value)}
                placeholder="12345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountDigit">Dígito *</Label>
              <Input
                id="accountDigit"
                value={formData.accountDigit}
                onChange={(e) => updateFormData('accountDigit', e.target.value)}
                placeholder="9"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo da Conta *</Label>
            <Select
              value={formData.accountType}
              onValueChange={(value) => updateFormData('accountType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Conta Corrente</SelectItem>
                <SelectItem value="savings">Conta Poupança</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dados do Titular */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Dados do Titular</h4>
            
            <div className="space-y-2">
              <Label htmlFor="holderName">Nome Completo do Titular *</Label>
              <Input
                id="holderName"
                value={formData.holderName}
                onChange={(e) => updateFormData('holderName', e.target.value)}
                placeholder="Nome conforme documento"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo de Documento *</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => updateFormData('documentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="holderDocument">
                  {formData.documentType === 'cpf' ? 'CPF' : 'CNPJ'} *
                </Label>
                <Input
                  id="holderDocument"
                  value={formData.holderDocument}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  placeholder={formData.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                />
              </div>
            </div>
          </div>

          {/* PIX (Opcional) */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave PIX (opcional)</Label>
              <Input
                id="pixKey"
                value={formData.pixKey}
                onChange={(e) => updateFormData('pixKey', e.target.value)}
                placeholder="CPF, email, telefone ou chave aleatória"
              />
              <p className="text-xs text-gray-500">
                PIX é o método mais rápido para receber pagamentos (taxa R$ 1,75)
              </p>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Salvando...' : 'Cadastrar Conta'}
              <Plus className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
