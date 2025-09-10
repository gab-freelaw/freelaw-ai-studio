import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Building, UserCheck, ArrowRight, Sparkles, CheckCircle, Users, Clock, TrendingUp, Shield, Zap, Target, Star, Quote } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Freelaw AI Studio - Primeira Plataforma Jurídica com IA',
  description: 'Conectamos escritórios com prestadores usando inteligência artificial',
};

export default function HomePage() {
  return (
      <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-purple/5">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-freelaw-purple/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-purple rounded-xl">
              <Image
                  src="/logo-white.png"
                  alt="Freelaw AI Studio"
                  width={28}
                  height={28}
                  className="rounded"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-freelaw-blue">Freelaw AI Studio</h1>
                <p className="text-xs text-freelaw-blue/70">Primeira Plataforma Jurídica com IA</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#para-escritorios" className="text-freelaw-blue/70 hover:text-freelaw-purple transition-colors">Para Escritórios</a>
              <a href="#para-prestadores" className="text-freelaw-blue/70 hover:text-freelaw-purple transition-colors">Para Prestadores</a>
              <a href="#como-funciona" className="text-freelaw-blue/70 hover:text-freelaw-purple transition-colors">Como Funciona</a>
              <a href="#depoimentos" className="text-freelaw-blue/70 hover:text-freelaw-purple transition-colors">Depoimentos</a>
            </nav>
            
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="outline" className="border-freelaw-purple text-freelaw-purple hover:bg-freelaw-purple hover:text-white">
                  Entrar
                </Button>
              </Link>
              <LoadingButton 
                href="/onboarding"
                className="bg-gradient-purple hover:opacity-90 text-white"
                loadingText="Iniciando..."
                loadingKey="header-signup"
              >
                Começar Grátis
              </LoadingButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-freelaw-purple/10 text-freelaw-purple px-6 py-3 rounded-full text-sm font-medium border border-freelaw-purple/20">
              <Sparkles className="h-4 w-4 inline mr-2" />
              Primeira Plataforma Jurídica com IA do Brasil
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-freelaw-blue mb-8 leading-tight">
            Escale seu Escritório
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-freelaw-purple to-freelaw-pink block">
              sem Aumentar Custos
            </span>
          </h1>
          
          <p className="text-2xl text-freelaw-blue/80 mb-12 max-w-4xl mx-auto leading-relaxed">
            Combine <strong className="text-freelaw-purple">IA jurídica avançada</strong> com nossa <strong className="text-freelaw-purple">rede de prestadores Elite</strong> para aumentar sua produtividade em <strong className="text-freelaw-purple">300%</strong> sem contratar funcionários.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <LoadingButton 
              href="/onboarding"
              size="lg" 
              className="bg-gradient-purple hover:opacity-90 text-white px-8 py-4 text-lg"
              loadingText="Iniciando teste..."
              loadingKey="hero-signup"
            >
              <Building className="h-5 w-5 mr-2" />
              Começar Teste Grátis
              <ArrowRight className="h-5 w-5 ml-2" />
            </LoadingButton>
            <Link href="#como-funciona">
              <Button size="lg" variant="outline" className="border-freelaw-purple text-freelaw-purple hover:bg-freelaw-purple hover:text-white px-8 py-4 text-lg">
                Ver Como Funciona
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-freelaw-purple mb-2">500+</div>
              <div className="text-sm text-freelaw-blue/70">Escritórios Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-freelaw-purple mb-2">15k+</div>
              <div className="text-sm text-freelaw-blue/70">Petições Geradas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-freelaw-purple mb-2">300%</div>
              <div className="text-sm text-freelaw-blue/70">Aumento Produtividade</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-freelaw-purple mb-2">24h</div>
              <div className="text-sm text-freelaw-blue/70">Entrega Média</div>
            </div>
          </div>
        </div>
      </section>

      {/* Para Escritórios */}
      <section id="para-escritorios" className="bg-white/80 backdrop-blur-sm border-y border-freelaw-purple/10">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-freelaw-blue mb-6">
              Para Escritórios de Advocacia
            </h2>
            <p className="text-xl text-freelaw-blue/80 max-w-3xl mx-auto">
              Transforme seu escritório com tecnologia que realmente funciona. Aumente sua capacidade sem aumentar seus custos fixos.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-3xl font-bold text-freelaw-blue mb-6">
                O Problema que Você Enfrenta
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-freelaw-pink rounded-full mt-3"></div>
                  <p className="text-freelaw-blue/80">Demanda crescente, mas contratar é caro e arriscado</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-freelaw-pink rounded-full mt-3"></div>
                  <p className="text-freelaw-blue/80">Trabalhos simples consomem tempo dos sócios</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-freelaw-pink rounded-full mt-3"></div>
                  <p className="text-freelaw-blue/80">Dificuldade para encontrar advogados qualificados</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-freelaw-pink rounded-full mt-3"></div>
                  <p className="text-freelaw-blue/80">Custos fixos altos limitam o crescimento</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-3xl font-bold text-freelaw-blue mb-6">
                Nossa Solução Completa
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-freelaw-purple mt-1" />
                  <div>
                    <p className="font-semibold text-freelaw-blue">IA Jurídica 24/7</p>
                    <p className="text-sm text-freelaw-blue/70">Chat especializado, análise de documentos, petições automáticas</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-freelaw-purple mt-1" />
                  <div>
                    <p className="font-semibold text-freelaw-blue">Rede de Prestadores Elite</p>
                    <p className="text-sm text-freelaw-blue/70">Advogados pré-qualificados, avaliados e monitorados</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-freelaw-purple mt-1" />
                  <div>
                    <p className="font-semibold text-freelaw-blue">Matching Inteligente</p>
                    <p className="text-sm text-freelaw-blue/70">IA conecta seu trabalho com o prestador ideal automaticamente</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-freelaw-purple mt-1" />
                  <div>
                    <p className="font-semibold text-freelaw-blue">Preço Fixo Mensal</p>
                    <p className="text-sm text-freelaw-blue/70">Sem surpresas, sem comissão por serviço</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Planos */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 border-freelaw-purple/20 hover:border-freelaw-purple/40 transition-all">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-freelaw-blue">Starter</CardTitle>
                <CardDescription>Ideal para escritórios pequenos</CardDescription>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-freelaw-purple">R$ 299</div>
                  <div className="text-sm text-freelaw-blue/70">/mês</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-freelaw-purple mr-2" />
                    20 serviços/mês inclusos
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-freelaw-purple mr-2" />
                    IA jurídica ilimitada
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-freelaw-purple mr-2" />
                    Suporte por chat
                  </div>
                </div>
                <Link href="/onboarding" className="block">
                  <Button className="w-full bg-gradient-purple hover:opacity-90 text-white">
                    Começar Teste Grátis
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-freelaw-purple bg-freelaw-purple/5 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-freelaw-purple text-white px-4 py-1 rounded-full text-sm font-medium">
                  Mais Popular
                </div>
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-freelaw-blue">Professional</CardTitle>
                <CardDescription>Para escritórios em crescimento</CardDescription>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-freelaw-purple">R$ 599</div>
                  <div className="text-sm text-freelaw-blue/70">/mês</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-freelaw-purple mr-2" />
                    50 serviços/mês inclusos
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-freelaw-purple mr-2" />
                    IA jurídica ilimitada
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-freelaw-purple mr-2" />
                    Prioridade no matching
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-freelaw-purple mr-2" />
                    Suporte prioritário
                  </div>
                </div>
                <Link href="/onboarding" className="block">
                  <Button className="w-full bg-gradient-purple hover:opacity-90 text-white">
                    Começar Teste Grátis
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-freelaw-purple/20 hover:border-freelaw-purple/40 transition-all">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-freelaw-blue">Enterprise</CardTitle>
                <CardDescription>Para grandes escritórios</CardDescription>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-freelaw-purple">R$ 1.499</div>
                  <div className="text-sm text-freelaw-blue/70">/mês</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-freelaw-purple mr-2" />
                    200 serviços/mês inclusos
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-freelaw-purple mr-2" />
                    IA jurídica ilimitada
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-freelaw-purple mr-2" />
                    Gerente de conta dedicado
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-freelaw-purple mr-2" />
                    Integrações personalizadas
                  </div>
                </div>
                <Link href="/onboarding" className="block">
                  <Button className="w-full bg-gradient-purple hover:opacity-90 text-white">
                    Começar Teste Grátis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Para Prestadores */}
      <section id="para-prestadores" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-freelaw-blue mb-6">
            Para Advogados Prestadores
          </h2>
          <p className="text-xl text-freelaw-blue/80 max-w-3xl mx-auto">
            Trabalhe com liberdade total, receba 100% do valor dos serviços e cresça na maior rede jurídica do Brasil.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h3 className="text-3xl font-bold text-freelaw-blue mb-6">
              Por que Escolher a Freelaw?
            </h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-freelaw-pink/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-freelaw-pink" />
                </div>
                <div>
                  <h4 className="font-semibold text-freelaw-blue mb-2">100% do Valor para Você</h4>
                  <p className="text-freelaw-blue/70">Diferente de outras plataformas, você recebe o valor integral. Nossa receita vem da assinatura dos escritórios.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-freelaw-pink/10 rounded-lg">
                  <Shield className="h-6 w-6 text-freelaw-pink" />
                </div>
                <div>
                  <h4 className="font-semibold text-freelaw-blue mb-2">Pagamento Garantido</h4>
                  <p className="text-freelaw-blue/70">Receba em 24h via PIX. Sem risco de inadimplência ou negociação de valores.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-freelaw-pink/10 rounded-lg">
                  <Target className="h-6 w-6 text-freelaw-pink" />
                </div>
                <div>
                  <h4 className="font-semibold text-freelaw-blue mb-2">Sistema de Evolução</h4>
                  <p className="text-freelaw-blue/70">Cresça de Calibração até Elite. Prestadores Elite ganham 20% a mais e têm prioridade.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-freelaw-pink/5 rounded-2xl p-8 border border-freelaw-pink/10">
            <h3 className="text-2xl font-bold text-freelaw-blue mb-6 text-center">
              Potencial de Ganhos
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <div>
                  <div className="font-semibold text-freelaw-blue">Calibração</div>
                  <div className="text-sm text-freelaw-blue/70">Primeiros 30 serviços</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-freelaw-pink">R$ 200-400</div>
                  <div className="text-sm text-freelaw-blue/70">por serviço</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <div>
                  <div className="font-semibold text-freelaw-blue">Ajuste/Restrito</div>
                  <div className="text-sm text-freelaw-blue/70">Nota 3.8-4.1</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-freelaw-pink">R$ 300-500</div>
                  <div className="text-sm text-freelaw-blue/70">por serviço</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-freelaw-purple/10 rounded-lg border-2 border-freelaw-purple/20">
                <div>
                  <div className="font-semibold text-freelaw-purple">Elite</div>
                  <div className="text-sm text-freelaw-purple/70">Nota &gt;4.1 + 20% bônus</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-freelaw-purple">R$ 400-800</div>
                  <div className="text-sm text-freelaw-purple/70">por serviço</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-freelaw-gold/10 rounded-lg border border-freelaw-gold/20">
              <div className="text-center">
                <div className="font-bold text-freelaw-gold text-lg">Potencial Mensal</div>
                <div className="text-2xl font-bold text-freelaw-blue">R$ 2.500 - R$ 8.000+</div>
                <div className="text-sm text-freelaw-blue/70">Baseado em 10-20 serviços/mês</div>
              </div>
            </div>
            
            <Link href="/cadastro/prestador" className="block mt-6">
              <Button className="w-full bg-freelaw-pink hover:bg-freelaw-pink-dark text-white text-lg py-3">
                <UserCheck className="h-5 w-5 mr-2" />
                Aplicar como Prestador
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="bg-white/80 backdrop-blur-sm border-y border-freelaw-purple/10">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-freelaw-blue mb-6">
              Como Funciona o Modelo Híbrido
            </h2>
            <p className="text-xl text-freelaw-blue/80 max-w-3xl mx-auto">
              Combinamos o melhor da IA com expertise humana para entregar resultados excepcionais
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Escritório */}
              <div className="text-center">
                <div className="w-20 h-20 bg-freelaw-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="h-10 w-10 text-freelaw-purple" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-freelaw-blue">Escritório</h3>
                <p className="text-freelaw-blue/70 text-sm">
                  Paga assinatura mensal fixa. Usa IA para tarefas simples e delega serviços complexos para prestadores qualificados.
                </p>
                <div className="mt-4 text-xs text-freelaw-purple bg-freelaw-purple/5 rounded p-2 border border-freelaw-purple/10">
                  💰 R$ 299-1499/mês • Serviços inclusos
                </div>
              </div>

              {/* IA */}
              <div className="text-center">
                <div className="w-20 h-20 bg-freelaw-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-10 w-10 text-freelaw-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-freelaw-blue">IA Jurídica</h3>
                <p className="text-freelaw-blue/70 text-sm">
                  Processa tarefas instantâneas: chat jurídico, análise de documentos, geração de petições simples.
                </p>
                <div className="mt-4 text-xs text-freelaw-gold bg-freelaw-gold/5 rounded p-2 border border-freelaw-gold/10">
                  ⚡ Resposta instantânea • Custo zero
                </div>
              </div>

              {/* Prestador */}
              <div className="text-center">
                <div className="w-20 h-20 bg-freelaw-pink/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="h-10 w-10 text-freelaw-pink" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-freelaw-blue">Prestador</h3>
                <p className="text-freelaw-blue/70 text-sm">
                  Executa serviços complexos com qualidade humana. Recebe 100% do valor calculado automaticamente.
                </p>
                <div className="mt-4 text-xs text-freelaw-pink bg-freelaw-pink/5 rounded p-2 border border-freelaw-pink/10">
                  💎 R$ 200-800/serviço • Pagamento garantido
                </div>
              </div>
                    </div>

            {/* Fluxo */}
            <div className="mt-12 bg-freelaw-white/50 rounded-xl p-8 border border-freelaw-purple/10">
              <h3 className="text-center font-semibold text-freelaw-blue mb-6">Fluxo Inteligente</h3>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="w-8 h-8 bg-freelaw-purple/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-freelaw-purple font-bold">1</span>
                  </div>
                  <p className="text-freelaw-blue/70">Escritório solicita</p>
                </div>
                
                <ArrowRight className="h-4 w-4 text-freelaw-purple/50" />
                
                <div className="text-center">
                  <div className="w-8 h-8 bg-freelaw-gold/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-freelaw-gold font-bold">2</span>
                  </div>
                  <p className="text-freelaw-blue/70">IA analisa</p>
                </div>
                
                <ArrowRight className="h-4 w-4 text-freelaw-purple/50" />
                
                <div className="text-center">
                  <div className="w-8 h-8 bg-freelaw-pink/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-freelaw-pink font-bold">3</span>
                  </div>
                  <p className="text-freelaw-blue/70">Prestador executa</p>
                </div>
                
                <ArrowRight className="h-4 w-4 text-freelaw-purple/50" />
                
                <div className="text-center">
                  <div className="w-8 h-8 bg-freelaw-purple/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-4 w-4 text-freelaw-purple" />
                  </div>
                  <p className="text-freelaw-blue/70">Entrega final</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Por que escolher o Freelaw AI Studio?
            </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Somos a primeira plataforma que combina IA jurídica avançada com uma rede qualificada de prestadores
          </p>
        </div>

        {/* Comparação Lado a Lado */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Para Escritórios */}
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900">Para Escritórios</h3>
              <p className="text-blue-700">Escale seu escritório sem perder qualidade</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-blue-900">IA Jurídica 24/7</div>
                  <div className="text-sm text-blue-700">Chat especializado, geração de petições, análise de documentos</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-blue-900">Delegação Inteligente</div>
                  <div className="text-sm text-blue-700">Matching automático com prestadores qualificados</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-blue-900">Gestão Completa</div>
                  <div className="text-sm text-blue-700">Processos, prazos, publicações, CRM unificado</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-blue-900">Preço Fixo Mensal</div>
                  <div className="text-sm text-blue-700">Sem surpresas, sem comissão por serviço</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg">
              <div className="text-center">
                <div className="text-sm text-blue-700 mb-1">Planos a partir de</div>
                <div className="text-3xl font-bold text-blue-600">R$ 299/mês</div>
                <div className="text-xs text-blue-600">20 serviços inclusos</div>
              </div>
            </div>
          </div>

          {/* Para Prestadores */}
          <div className="bg-green-50 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-900">Para Prestadores</h3>
              <p className="text-green-700">Trabalhe com liberdade e seja bem remunerado</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-green-900">100% do Valor</div>
                  <div className="text-sm text-green-700">Receba integralmente, sem desconto de comissão</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-green-900">Trabalho Remoto</div>
                  <div className="text-sm text-green-700">Flexibilidade total de horário e local</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-green-900">Sistema de Níveis</div>
                  <div className="text-sm text-green-700">Evolua de Calibração até Elite (20% a mais)</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-green-900">Pagamento Rápido</div>
                  <div className="text-sm text-green-700">PIX em 24h, carteira digital integrada</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg">
              <div className="text-center">
                <div className="text-sm text-green-700 mb-1">Ganhe até</div>
                <div className="text-3xl font-bold text-green-600">R$ 2.500+/mês</div>
                <div className="text-xs text-green-600">R$ 200-800 por serviço</div>
              </div>
            </div>
          </div>
        </div>

        {/* Diferencial Único */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">🚀 Diferencial Único no Brasil</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-sm">Prestador recebe valor integral</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">0%</div>
              <div className="text-sm">Comissão sobre serviços</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-sm">IA jurídica disponível</div>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-freelaw-blue mb-6">
            O que Nossos Clientes Dizem
          </h2>
          <p className="text-xl text-freelaw-blue/80 max-w-3xl mx-auto">
            Mais de 500 escritórios e 2.000 prestadores confiam na Freelaw AI Studio
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Depoimento Escritório 1 */}
          <Card className="border border-freelaw-purple/20 hover:border-freelaw-purple/40 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Quote className="h-8 w-8 text-freelaw-purple/30" />
              </div>
              <p className="text-freelaw-blue/80 mb-4 italic">
                "Aumentamos nossa produtividade em 250% sem contratar ninguém. A IA resolve 70% das demandas simples e os prestadores cuidam do resto com qualidade excepcional."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-purple rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DR</span>
                </div>
                <div>
                  <p className="font-semibold text-freelaw-blue text-sm">Dr. Roberto Silva</p>
                  <p className="text-freelaw-blue/70 text-xs">Sócio - Silva & Associados</p>
                </div>
              </div>
              <div className="flex mt-3">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="h-4 w-4 text-freelaw-gold fill-current" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Depoimento Prestador 1 */}
          <Card className="border border-freelaw-pink/20 hover:border-freelaw-pink/40 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Quote className="h-8 w-8 text-freelaw-pink/30" />
              </div>
              <p className="text-freelaw-blue/80 mb-4 italic">
                "Trabalho de casa, escolho meus horários e ganho mais que quando era CLT. O pagamento é sempre em dia e os trabalhos são de qualidade."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-freelaw-pink rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MC</span>
                </div>
                <div>
                  <p className="font-semibold text-freelaw-blue text-sm">Dra. Maria Costa</p>
                  <p className="text-freelaw-blue/70 text-xs">Prestadora Elite</p>
                </div>
              </div>
              <div className="flex mt-3">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="h-4 w-4 text-freelaw-gold fill-current" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Depoimento Escritório 2 */}
          <Card className="border border-freelaw-purple/20 hover:border-freelaw-purple/40 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Quote className="h-8 w-8 text-freelaw-purple/30" />
              </div>
              <p className="text-freelaw-blue/80 mb-4 italic">
                "O ROI foi imediato. Em 3 meses já pagamos o investimento anual. Agora conseguimos atender 3x mais clientes com a mesma equipe."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-purple rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AL</span>
                </div>
                <div>
                  <p className="font-semibold text-freelaw-blue text-sm">Dr. André Lima</p>
                  <p className="text-freelaw-blue/70 text-xs">CEO - Lima Advocacia</p>
                </div>
              </div>
              <div className="flex mt-3">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="h-4 w-4 text-freelaw-gold fill-current" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Final */}
        <div className="text-center mt-16">
          <div className="bg-gradient-purple rounded-2xl p-8 text-white max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">
              Pronto para Transformar seu Escritório?
            </h3>
            <p className="text-xl mb-8 text-white/90">
              Junte-se a centenas de escritórios que já aumentaram sua produtividade em 300%
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/onboarding">
                <Button size="lg" className="bg-white text-freelaw-purple hover:bg-white/90 px-8 py-4 text-lg font-semibold">
                  <Building className="h-5 w-5 mr-2" />
                  Começar Teste Grátis
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/cadastro/prestador">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-freelaw-purple px-8 py-4 text-lg">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Aplicar como Prestador
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-freelaw-blue-dark text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1 bg-gradient-purple rounded">
              <Image
                    src="/logo-white.png"
                    alt="Freelaw AI Studio"
                    width={24}
                    height={24}
                    className="rounded"
                  />
                </div>
                <span className="font-bold text-freelaw-white">Freelaw AI Studio</span>
              </div>
              <p className="text-freelaw-white/70 text-sm">
                A primeira plataforma jurídica com IA do Brasil
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-freelaw-white">Para Escritórios</h4>
              <ul className="space-y-2 text-sm text-freelaw-white/60">
                <li>Chat Jurídico com IA</li>
                <li>Geração de Petições</li>
                <li>Delegação de Serviços</li>
                <li>Gestão de Processos</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-freelaw-white">Para Prestadores</h4>
              <ul className="space-y-2 text-sm text-freelaw-white/60">
                <li>Trabalho Remoto</li>
                <li>Pagamento Garantido</li>
                <li>Sistema de Níveis</li>
                <li>Carteira Digital</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-freelaw-white">Suporte</h4>
              <ul className="space-y-2 text-sm text-freelaw-white/60">
                <li>Central de Ajuda</li>
                <li>Chat de Suporte</li>
                <li>Documentação</li>
                <li>Contato</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-freelaw-purple/20 mt-8 pt-8 text-center text-sm text-freelaw-white/60">
            <p>&copy; 2025 Freelaw AI Studio. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}