import { Metadata } from 'next';
import { WalletBalanceCard } from '@/components/wallet/wallet-balance';
import { PricingCalculator } from '@/components/wallet/pricing-calculator';
import { WithdrawalForm } from '@/components/wallet/withdrawal-form';

export const metadata: Metadata = {
  title: 'Sistema Completo | Freelaw AI Studio',
  description: 'Sistema completo com backend NestJS integrado',
};

export default function SistemaCompletoPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sistema Completo NestJS</h1>
        <p className="text-muted-foreground">
          Todas as funcionalidades agora rodam no backend NestJS separado
        </p>
      </div>

      {/* Status do Sistema */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">✅ Backend NestJS</h3>
          <p className="text-sm text-green-700">
            Rodando em <code>localhost:4000</code>
          </p>
          <p className="text-xs text-green-600 mt-1">
            Swagger: <code>/api/docs</code>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">🔗 APIs Implementadas</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Carteira Digital</li>
            <li>• Pricing Dinâmico</li>
            <li>• Prestadores</li>
            <li>• Ordens de Serviço</li>
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-800 mb-2">🎯 Funcionalidades</h3>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• 100% para prestador</li>
            <li>• Pricing algorítmico</li>
            <li>• 8 status simplificados</li>
            <li>• Sistema de correções</li>
          </ul>
        </div>
      </section>

      {/* Demonstração das Funcionalidades */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Demonstração do Sistema</h2>
        
        {/* Saldo da Carteira */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">💰 Carteira Digital</h3>
          <WalletBalanceCard />
        </div>

        {/* Grid com Calculadora e Saque */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Calculadora de Preços */}
          <div>
            <h3 className="text-lg font-medium mb-4">💎 Calculadora de Preços</h3>
            <PricingCalculator />
          </div>

          {/* Formulário de Saque */}
          <div>
            <h3 className="text-lg font-medium mb-4">💸 Solicitar Saque</h3>
            <WithdrawalForm />
          </div>
        </div>
      </section>

      {/* APIs Disponíveis */}
      <section className="bg-slate-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-4">📚 APIs Implementadas no NestJS</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-medium text-sm mb-2">💰 Carteira Digital</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li><code>GET /api/wallet/balance</code></li>
              <li><code>GET /api/wallet/transactions</code></li>
              <li><code>POST /api/wallet/withdraw</code></li>
              <li><code>POST /api/wallet/bank-accounts</code></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">💎 Pricing</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li><code>POST /api/pricing/calculate</code></li>
              <li><code>GET /api/pricing/rules</code></li>
              <li><code>POST /api/pricing/seed-default-rules</code></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">👥 Prestadores</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li><code>POST /api/providers/apply</code></li>
              <li><code>GET /api/providers/profile</code></li>
              <li><code>GET /api/providers/dashboard</code></li>
              <li><code>GET /api/providers/available-work</code></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">📋 Ordens</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li><code>POST /api/service-orders</code></li>
              <li><code>GET /api/service-orders</code></li>
              <li><code>PUT /api/service-orders/:id/approve</code></li>
              <li><code>POST /api/service-orders/:id/request-revision</code></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Próximos Passos */}
      <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-800 mb-2">🚀 Próximos Passos</h3>
        <div className="grid gap-4 md:grid-cols-2 text-sm text-yellow-700">
          <div>
            <h4 className="font-medium mb-1">Backend</h4>
            <ul className="space-y-1">
              <li>• Implementar autenticação JWT</li>
              <li>• Configurar WebSockets</li>
              <li>• Deploy em produção</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Frontend</h4>
            <ul className="space-y-1">
              <li>• Remover API Routes antigas</li>
              <li>• Migrar para SDK NestJS</li>
              <li>• Testar integração completa</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

