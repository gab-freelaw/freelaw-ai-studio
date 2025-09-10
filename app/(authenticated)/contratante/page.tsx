import { Metadata } from 'next';
import { ServiceOrderForm } from '@/components/contractors/service-order-form';

export const metadata: Metadata = {
  title: 'Dashboard Contratante | Freelaw AI Studio',
  description: 'Dashboard do contratante com backend NestJS',
};

export default function ContratantePage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard do Contratante</h1>
        <p className="text-muted-foreground">
          Delegue serviços jurídicos para nossa rede de prestadores qualificados
        </p>
      </div>

      {/* Formulário de Criação */}
      <ServiceOrderForm />

      {/* Informações do Sistema */}
      <section className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="font-semibold text-purple-900 mb-2">💡 Como funciona o sistema</h3>
        <div className="grid gap-4 md:grid-cols-2 text-sm text-purple-800">
          <div>
            <h4 className="font-medium mb-1">Pricing Inteligente</h4>
            <p>O valor é calculado automaticamente baseado em tipo, área, urgência e complexidade. Prestadores Elite recebem 20% a mais.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Qualidade Garantida</h4>
            <p>Apenas prestadores aprovados podem aceitar trabalhos. Sistema de performance garante alta qualidade.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Controle Total</h4>
            <p>Você pode solicitar até 3 correções por serviço. Pagamento só é liberado após sua aprovação final.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Transparência</h4>
            <p>Acompanhe todo o processo em tempo real. Chat integrado para comunicação direta.</p>
          </div>
        </div>
      </section>

      {/* APIs Utilizadas */}
      <section className="bg-slate-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-4">🔗 APIs Backend Utilizadas</h3>
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <h4 className="font-medium mb-2">Criação de Ordens</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <code>POST /api/service-orders</code></li>
              <li>• <code>POST /api/pricing/calculate</code></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Gestão de Ordens</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <code>GET /api/service-orders</code></li>
              <li>• <code>PUT /api/service-orders/:id/approve</code></li>
              <li>• <code>POST /api/service-orders/:id/request-revision</code></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

