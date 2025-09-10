'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowDownToLine, CreditCard, Smartphone, Receipt, Plus } from 'lucide-react';
import { freelawAPI, type BankAccount, type WithdrawalRequest } from '@/lib/sdk/freelaw-api';
import { BankAccountForm } from './bank-account-form';

export function WithdrawalForm() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'bank_slip' | 'credit_card'>('pix');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBankForm, setShowBankForm] = useState(false);

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      const accounts = await freelawAPI.getBankAccounts();
      setBankAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
    }
  };

  const handleBankAccountSuccess = () => {
    setShowBankForm(false);
    loadBankAccounts(); // Recarrega as contas
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Digite um valor válido para saque');
      return;
    }

    if (!selectedAccount && paymentMethod !== 'pix') {
      setError('Selecione uma conta bancária');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const withdrawal: WithdrawalRequest = {
        amount: parseFloat(amount),
        paymentMethod,
        bankAccountId: selectedAccount || undefined,
        notes: notes || undefined,
      };

      await freelawAPI.requestWithdrawal(withdrawal);
      
      setSuccess(true);
      setAmount('');
      setNotes('');
      
      // Reset success message after 3s
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar saque');
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = () => {
    const value = parseFloat(amount) || 0;
    switch (paymentMethod) {
      case 'pix':
      case 'bank_slip':
        return 1.75;
      case 'credit_card':
        return value * 0.023;
      default:
        return 0;
    }
  };

  const netAmount = (parseFloat(amount) || 0) - calculateFees();

  // Se deve mostrar o formulário de cadastro de conta
  if (showBankForm) {
    return (
      <BankAccountForm 
        onSuccess={handleBankAccountSuccess}
        onCancel={() => setShowBankForm(false)}
      />
    );
  }

  // Se não há contas cadastradas, mostra aviso
  if (bankAccounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5" />
            Solicitar Saque
          </CardTitle>
          <CardDescription>
            Para solicitar saques, você precisa cadastrar uma conta bancária
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Nenhuma conta cadastrada</h3>
            <p className="text-gray-600 mb-6">
              Cadastre uma conta bancária para receber seus pagamentos de forma segura.
            </p>
            <Button onClick={() => setShowBankForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeira Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5" />
          Solicitar Saque
        </CardTitle>
        <CardDescription>
          Transfira seu saldo para sua conta bancária
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Saque</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-lg"
            />
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-2">
            <Label>Método de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod as any}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    PIX (Taxa: R$ 1,75)
                  </div>
                </SelectItem>
                <SelectItem value="bank_slip">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Boleto (Taxa: R$ 1,75)
                  </div>
                </SelectItem>
                <SelectItem value="credit_card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cartão de Crédito (Taxa: 2,30%)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conta Bancária */}
          {bankAccounts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conta Bancária</Label>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowBankForm(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Nova Conta
                </Button>
              </div>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bankName} - {account.maskedAccount}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione alguma observação..."
              rows={3}
            />
          </div>

          {/* Resumo do Saque */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Valor solicitado:</span>
                <span>{freelawAPI.formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa ({paymentMethod}):</span>
                <span>-{freelawAPI.formatCurrency(calculateFees())}</span>
              </div>
              <hr />
              <div className="flex justify-between font-medium">
                <span>Valor líquido:</span>
                <span className="text-green-600">
                  {freelawAPI.formatCurrency(netAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Mensagens */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
              ✅ Saque solicitado com sucesso! Será processado em até 24h.
            </div>
          )}

          {/* Botão */}
          <Button 
            type="submit" 
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full"
          >
            {loading ? 'Processando...' : 'Solicitar Saque'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

