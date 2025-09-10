import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Users, 
  FileText, 
  TrendingUp, 
  Clock, 
  DollarSign,
  MessageSquare,
  FileSignature,
  Calendar,
  Target,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard Escritório | Freelaw AI Studio',
  description: 'Painel de controle do escritório',
};

export default function EscritorioDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard do Escritório</h1>
          <p className="text-gray-600 mt-1">
            Visão geral das atividades e performance do seu escritório
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          Plano Professional
        </Badge>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Delegados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              15 concluídos, 8 em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia com IA</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ 12.5k</div>
            <p className="text-xs text-muted-foreground">
              85 horas economizadas este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação Cliente</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">94%</div>
            <p className="text-xs text-muted-foreground">
              Baseado em 156 avaliações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
              Chat Jurídico
            </CardTitle>
            <CardDescription>
              Tire dúvidas com nossa IA especializada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/chat">
              <Button className="w-full" variant="outline">
                Iniciar Chat
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <FileSignature className="h-5 w-5 mr-2 text-purple-600" />
              Gerar Petição
            </CardTitle>
            <CardDescription>
              Crie peças processuais com IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/petitions">
              <Button className="w-full" variant="outline">
                Nova Petição
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              Delegar Serviço
            </CardTitle>
            <CardDescription>
              Envie trabalho para prestadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/escritorio/delegacoes">
              <Button className="w-full" variant="outline">
                Nova Delegação
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas ações no escritório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Petição aprovada</p>
                <p className="text-xs text-gray-500">Processo 1234567 - há 2 horas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Serviço delegado</p>
                <p className="text-xs text-gray-500">Contrato empresarial - há 4 horas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Chat com IA</p>
                <p className="text-xs text-gray-500">Dúvida sobre prazos - há 6 horas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prazos Próximos</CardTitle>
            <CardDescription>
              Atenção necessária nos próximos dias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Contestação</p>
                  <p className="text-xs text-gray-500">Processo 9876543</p>
                </div>
              </div>
              <Badge className="bg-red-100 text-red-800">
                Amanhã
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Audiência</p>
                  <p className="text-xs text-gray-500">Processo 5555555</p>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                3 dias
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Recurso</p>
                  <p className="text-xs text-gray-500">Processo 7777777</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                5 dias
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <CardTitle>Uso do Plano Professional</CardTitle>
          <CardDescription>
            Acompanhe o uso dos seus serviços mensais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="text-2xl font-bold text-blue-600">32/50</div>
              <p className="text-sm text-gray-600">Serviços usados</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '64%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-green-600">18</div>
              <p className="text-sm text-gray-600">Serviços restantes</p>
              <p className="text-xs text-gray-500 mt-1">Renova em 12 dias</p>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-purple-600">R$ 699</div>
              <p className="text-sm text-gray-600">Valor mensal</p>
              <p className="text-xs text-gray-500 mt-1">R$ 13,98 por serviço</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
