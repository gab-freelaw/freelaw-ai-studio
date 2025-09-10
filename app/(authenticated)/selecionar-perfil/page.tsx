import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, UserCheck, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Selecionar Perfil | Freelaw AI Studio',
  description: 'Escolha como deseja usar a plataforma',
};

export default function SelecionarPerfilPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Como deseja usar o Freelaw AI Studio?
          </h1>
          <p className="text-xl text-gray-600">
            Escolha seu perfil para ter a melhor experiência
          </p>
        </div>

        {/* Opções de Perfil */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Escritório/Contratante */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Escritório</CardTitle>
              <CardDescription>
                Gerencie seu escritório, delegue serviços e use IA para otimizar processos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <h4 className="font-medium mb-2">Funcionalidades:</h4>
                <ul className="space-y-1">
                  <li>• Chat jurídico com IA</li>
                  <li>• Geração de petições</li>
                  <li>• Gestão de processos</li>
                  <li>• Delegação de serviços</li>
                  <li>• Análise de documentos</li>
                  <li>• Agenda e prazos</li>
                </ul>
              </div>
              <Link href="/dashboard" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Acessar como Escritório
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Prestador */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-green-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Prestador</CardTitle>
              <CardDescription>
                Trabalhe como prestador, aceite serviços e gerencie seus ganhos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <h4 className="font-medium mb-2">Funcionalidades:</h4>
                <ul className="space-y-1">
                  <li>• Dashboard de performance</li>
                  <li>• Carteira digital</li>
                  <li>• Trabalhos disponíveis</li>
                  <li>• Sistema de níveis</li>
                  <li>• Calculadora de preços</li>
                  <li>• Saques automatizados</li>
                </ul>
              </div>
              <Link href="/prestador" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Acessar como Prestador
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Administrador</CardTitle>
              <CardDescription>
                Gerencie a plataforma, configure preços e monitore prestadores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <h4 className="font-medium mb-2">Funcionalidades:</h4>
                <ul className="space-y-1">
                  <li>• Regras de precificação</li>
                  <li>• Gestão de prestadores</li>
                  <li>• Monitoramento de ordens</li>
                  <li>• Análise do sistema</li>
                  <li>• Configurações globais</li>
                  <li>• Documentação técnica</li>
                </ul>
              </div>
              <Link href="/sistema-completo" className="block">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Acessar como Admin
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Sistema */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🚀 Sistema Integrado</h3>
          <div className="grid gap-4 md:grid-cols-2 text-sm text-gray-600">
            <div>
              <h4 className="font-medium mb-1">Backend NestJS</h4>
              <p>APIs completas para carteira, pricing, prestadores e ordens de serviço</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Frontend Next.js</h4>
              <p>Interface moderna com componentes específicos por tipo de usuário</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">IA Integrada</h4>
              <p>Tarefas automáticas, pricing dinâmico e insights inteligentes</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Sistema Financeiro</h4>
              <p>Prestadores recebem 100% do valor, plataforma lucra com assinatura</p>
            </div>
          </div>
        </div>

        {/* Links de Teste */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Ou acesse diretamente:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">Dashboard Escritório</Link>
            <Link href="/prestador" className="text-green-600 hover:underline text-sm">Dashboard Prestador</Link>
            <Link href="/carteira" className="text-yellow-600 hover:underline text-sm">Carteira Digital</Link>
            <Link href="/sistema-completo" className="text-purple-600 hover:underline text-sm">Sistema Completo</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

