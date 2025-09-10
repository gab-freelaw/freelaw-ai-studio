import { Metadata } from 'next';
import { SmartLayout } from '@/components/layouts/smart-layout';
import { WalletBalanceCard } from '@/components/wallet/wallet-balance';
import { PricingCalculator } from '@/components/wallet/pricing-calculator';
import { WithdrawalForm } from '@/components/wallet/withdrawal-form';

export const metadata: Metadata = {
  title: 'Carteira Digital | Freelaw AI Studio',
  description: 'Gerencie seus ganhos, calcule preços e solicite saques',
};

export default function CarteiraPage() {
  return (
    <SmartLayout 
      title="Carteira Digital"
      description="Acompanhe seus ganhos, calcule preços de serviços e gerencie seus saques"
    >
      <div className="space-y-8">

      {/* Saldo da Carteira */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Resumo Financeiro</h2>
        <WalletBalanceCard />
      </section>

      {/* Grid com Calculadora e Saque */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Calculadora de Preços */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Calculadora de Preços</h2>
          <PricingCalculator />
        </section>

        {/* Formulário de Saque */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Solicitar Saque</h2>
          <WithdrawalForm />
        </section>
      </div>

      {/* Informações Importantes */}
      <section className="bg-blue-50 p-6 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Como funciona</h3>
        <div className="grid gap-4 md:grid-cols-2 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-1">Pagamentos</h4>
            <p>Você recebe 100% do valor calculado para cada serviço aprovado. A plataforma não desconta comissão.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Saques</h4>
            <p>Solicite saques a qualquer momento. PIX e Boleto: R$ 1,75. Cartão: 2,30% do valor.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Preços Dinâmicos</h4>
            <p>Valores variam conforme tipo, área, urgência e seu perfil. Prestadores Elite ganham 20% a mais.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Processamento</h4>
            <p>Saques são processados em até 24h. PIX é mais rápido, boleto pode levar até 3 dias úteis.</p>
          </div>
        </div>
      </section>
      </div>
    </SmartLayout>
  );
}
