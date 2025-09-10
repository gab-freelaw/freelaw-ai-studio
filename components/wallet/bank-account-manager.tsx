'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Trash2, Shield, Smartphone } from 'lucide-react';
import { freelawAPI, type BankAccount } from '@/lib/sdk/freelaw-api';
import { BankAccountForm } from './bank-account-form';

export function BankAccountManager() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await freelawAPI.getBankAccounts();
      setBankAccounts(accounts);
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    loadBankAccounts();
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta bancária?')) {
      return;
    }

    try {
      setDeletingId(accountId);
      await freelawAPI.deleteBankAccount(accountId);
      await loadBankAccounts();
    } catch (err) {
      console.error('Erro ao excluir conta:', err);
      alert('Erro ao excluir conta bancária');
    } finally {
      setDeletingId(null);
    }
  };

  if (showForm) {
    return (
      <BankAccountForm 
        onSuccess={handleSuccess}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas Bancárias</h1>
          <p className="text-gray-600">Gerencie suas contas para receber pagamentos</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Informações Importantes */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Segurança dos Dados</h3>
              <p className="text-sm text-blue-800">
                Todas as informações bancárias são criptografadas e armazenadas com segurança. 
                Você pode cadastrar múltiplas contas e escolher qual usar em cada saque.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contas */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Carregando contas...</p>
        </div>
      ) : bankAccounts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma conta cadastrada
            </h3>
            <p className="text-gray-600 mb-6">
              Cadastre sua primeira conta bancária para começar a receber pagamentos.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeira Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bankAccounts.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium text-lg">
                        {account.bankName || `Banco ${account.bankCode}`}
                      </h3>
                      <Badge variant={account.accountType === 'checking' ? 'default' : 'secondary'}>
                        {account.accountType === 'checking' ? 'Conta Corrente' : 'Poupança'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span>
                          <strong>Agência:</strong> {account.agency}
                        </span>
                        <span>
                          <strong>Conta:</strong> {account.maskedAccount}
                        </span>
                      </div>
                      
                      <div>
                        <strong>Titular:</strong> {account.holderName}
                      </div>
                      
                      {account.pixKey && (
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-green-600" />
                          <span>PIX cadastrado</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(account.id)}
                    disabled={deletingId === account.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingId === account.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Informações sobre Saques */}
      {bankAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Como Funciona</CardTitle>
            <CardDescription>
              Informações importantes sobre saques e pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Métodos de Saque</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• PIX: Taxa R$ 1,75 - Até 24h</li>
                  <li>• Boleto: Taxa R$ 1,75 - Até 3 dias úteis</li>
                  <li>• Cartão: Taxa 2,30% - Até 24h</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Segurança</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Dados criptografados</li>
                  <li>• Verificação de identidade</li>
                  <li>• Histórico de transações</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
