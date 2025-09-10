import { Metadata } from 'next';
import { ServiceOrderForm } from '@/components/contractors/service-order-form';

export const metadata: Metadata = {
  title: 'Delegações | Freelaw AI Studio',
  description: 'Gerencie delegações de serviços para prestadores',
};

export default function DelegacoesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Delegações de Serviços</h1>
        <p className="text-gray-600">
          Delegue serviços para nossa rede qualificada de prestadores
        </p>
      </div>

      {/* Formulário de Nova Delegação */}
      <ServiceOrderForm />
    </div>
  );
}
