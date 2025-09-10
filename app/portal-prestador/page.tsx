'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowRight, Award, BookOpen, Briefcase, CheckCircle, Clock, DollarSign, 
  FileText, GraduationCap, Shield, Star, TrendingUp, Users, MapPin, 
  Target, Zap, Heart, Trophy, Rocket, Calendar, Home, Coffee, LineChart,
  UserCheck, Gift, Medal, Sparkles, ChevronRight, Play, Brain
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import CountUp from 'react-countup'

// Dados reais de advogados de sucesso
const SUCCESS_STORIES = [
  {
    name: "Dra. Marina Santos",
    photo: "/avatar-1.jpg",
    role: "Especialista em Direito Trabalhista",
    quote: "Larguei o escritório tradicional e hoje ganho 3x mais trabalhando de casa. A Freelaw mudou minha vida!",
    earnings: "R$ 12.000/mês",
    pieces: "180 peças/mês",
    rating: 4.9,
    level: "Expert"
  },
  {
    name: "Dr. Carlos Oliveira", 
    photo: "/avatar-2.jpg",
    role: "Especialista em Direito Civil",
    quote: "Trabalho de qualquer lugar do Brasil. Já atendi clientes de 15 estados diferentes!",
    earnings: "R$ 8.500/mês",
    pieces: "120 peças/mês",
    rating: 4.8,
    level: "Sênior"
  },
  {
    name: "Dra. Ana Paula Costa",
    photo: "/avatar-3.jpg",
    role: "Especialista em Direito do Consumidor",
    quote: "Comecei fazendo 30 peças por mês, hoje faço 200. O crescimento é real!",
    earnings: "R$ 15.000/mês",
    pieces: "200 peças/mês",
    rating: 5.0,
    level: "Super Jurista"
  }
]

// Sistema de gamificação
const GAMIFICATION_LEVELS = [
  { level: "Iniciante", pieces: "30", earnings: "R$ 1.200", color: "bg-gray-500" },
  { level: "Júnior", pieces: "60", earnings: "R$ 2.400", color: "bg-blue-500" },
  { level: "Pleno", pieces: "100", earnings: "R$ 4.000", color: "bg-green-500" },
  { level: "Sênior", pieces: "150", earnings: "R$ 6.000", color: "bg-purple-500" },
  { level: "Expert", pieces: "200+", earnings: "R$ 8.000+", color: "bg-yellow-500" },
  { level: "Super Jurista", pieces: "Elite", earnings: "R$ 12.000+", color: "bg-gradient-to-r from-purple-500 to-pink-500" }
]

// Benefícios e vantagens
const BENEFITS = [
  {
    icon: Home,
    title: "Trabalhe de Onde Quiser",
    description: "Home office, café, praia... você escolhe!"
  },
  {
    icon: Clock,
    title: "Horários Flexíveis",
    description: "Defina sua própria rotina de trabalho"
  },
  {
    icon: DollarSign,
    title: "Ganhe por Produtividade",
    description: "Quanto mais produzir, mais você ganha"
  },
  {
    icon: TrendingUp,
    title: "Crescimento Garantido",
    description: "Sistema de níveis com aumentos progressivos"
  },
  {
    icon: Users,
    title: "Clientes de Todo Brasil",
    description: "Atenda escritórios de todos os estados"
  },
  {
    icon: Award,
    title: "Meritocracia Real",
    description: "Seu esforço é recompensado com bonificações"
  }
]

export default function ProviderPortalPage() {
  const [videoPlaying, setVideoPlaying] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Hero Section Impactante */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-freelaw-purple via-tech-blue to-freelaw-purple overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5),transparent)]" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-freelaw-purple/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-tech-blue/30 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 text-center">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 text-lg px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            Vagas Limitadas - Processo Seletivo Aberto
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-up">
            Advogue do Seu Jeito.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-olympic-gold to-product-pink">
              Ganhe 3x Mais.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 animate-fade-up delay-100">
            Junte-se a <strong>11.000+ advogados</strong> que largaram o modelo tradicional 
            e hoje faturam até <strong>R$ 15.000/mês</strong> trabalhando de casa.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-up delay-200">
            <Link href="/portal-prestador/aplicacao">
              <Button size="lg" className="bg-white text-freelaw-purple hover:bg-white/90 text-lg px-8 py-6">
                Quero Me Candidatar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={() => setVideoPlaying(true)}
            >
              <Play className="mr-2 h-5 w-5" />
              Ver Como Funciona (2 min)
            </Button>
          </div>
          
          {/* Stats em tempo real */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-fade-up delay-300">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-white">
                <CountUp end={11000} duration={2} separator="." />+
              </div>
              <p className="text-white/80">Advogados Ativos</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-white">
                R$ <CountUp end={15} duration={2} />k/mês
              </div>
              <p className="text-white/80">Top Earners</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-white">
                <CountUp end={500} duration={2} />+
              </div>
              <p className="text-white/80">Escritórios Parceiros</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-white">
                <CountUp end={98} duration={2} />%
              </div>
              <p className="text-white/80">Satisfação</p>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Proposta de Valor Clara */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-freelaw-purple/10 text-freelaw-purple">
              Por que escolher a Freelaw?
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              A Advocacia Pode Ser Diferente
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Esqueça o modelo tradicional de escritório. Aqui você trabalha com liberdade total, 
              ganha por produtividade e cresce baseado no seu mérito.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {BENEFITS.map((benefit, i) => (
              <Card key={i} className="border-2 hover:border-freelaw-purple/50 transition-all hover:shadow-xl">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-freelaw-purple to-tech-blue rounded-lg flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cases de Sucesso Reais */}
      <section className="py-24 bg-gradient-to-br from-freelaw-white to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-olympic-gold/10 text-olympic-gold-dark">
              Histórias Reais
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Advogados Que Mudaram de Vida
            </h2>
            <p className="text-xl text-muted-foreground">
              Conheça quem largou o tradicional e hoje vive com mais liberdade e renda
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {SUCCESS_STORIES.map((story, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-2xl transition-all">
                <div className="h-2 bg-gradient-to-r from-freelaw-purple to-tech-blue" />
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <CardTitle>{story.name}</CardTitle>
                      <CardDescription>{story.role}</CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {story.level}
                    </Badge>
                  </div>
                  <p className="text-sm italic text-muted-foreground">
                    "{story.quote}"
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-freelaw-purple">{story.earnings}</p>
                      <p className="text-xs text-muted-foreground">Faturamento</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-tech-blue">{story.pieces}</p>
                      <p className="text-xs text-muted-foreground">Produção</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-2 font-semibold">{story.rating}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sistema de Gamificação e Crescimento */}
      <section className="py-24 bg-gradient-to-br from-freelaw-purple/5 to-tech-blue/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-freelaw-purple/10 text-freelaw-purple">
              Sistema de Crescimento
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Seu Caminho Para o Sucesso é Claro
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comece pequeno, cresça rápido. Nosso sistema de níveis garante que 
              quanto melhor você for, mais você ganha.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {GAMIFICATION_LEVELS.map((level, i) => (
              <Card key={i} className="relative overflow-hidden hover:shadow-xl transition-all">
                <div className={`h-2 ${level.color}`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      {level.level}
                    </CardTitle>
                    {level.level === "Super Jurista" && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        Elite
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Produção:</span>
                      <span className="font-semibold">{level.pieces} peças/mês</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ganhos:</span>
                      <span className="font-semibold text-green-600">{level.earnings}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Sistema de Bonificação */}
          <Card className="bg-gradient-to-r from-olympic-gold/10 to-olympic-gold/5 border-olympic-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Gift className="h-6 w-6 text-olympic-gold" />
                Sistema de Bonificação Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Medal className="h-12 w-12 mx-auto mb-2 text-olympic-gold" />
                  <p className="font-bold text-xl mb-1">1º Lugar</p>
                  <p className="text-3xl font-bold text-olympic-gold">R$ 500</p>
                  <p className="text-sm text-muted-foreground">Prêmio mensal</p>
                </div>
                <div className="text-center">
                  <Medal className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="font-bold text-xl mb-1">2º Lugar</p>
                  <p className="text-3xl font-bold text-gray-600">R$ 200</p>
                  <p className="text-sm text-muted-foreground">Prêmio mensal</p>
                </div>
                <div className="text-center">
                  <Medal className="h-12 w-12 mx-auto mb-2 text-orange-600" />
                  <p className="font-bold text-xl mb-1">3º Lugar</p>
                  <p className="text-3xl font-bold text-orange-600">R$ 100</p>
                  <p className="text-sm text-muted-foreground">Prêmio mensal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Ferramentas de IA */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-tech-blue/10 text-tech-blue">
                Tecnologia de Ponta
              </Badge>
              <h2 className="text-4xl font-bold mb-6">
                IA Como Sua Assistente,<br/>
                Não Como Substituta
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Utilizamos inteligência artificial para facilitar seu trabalho, 
                não para substituí-lo. Nossas ferramentas ajudam você a:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <strong>Resumir documentos complexos</strong>
                    <p className="text-sm text-muted-foreground">Análise inteligente de processos e documentos</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <strong>Buscar jurisprudências atualizadas</strong>
                    <p className="text-sm text-muted-foreground">Base de dados sempre atualizada</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <strong>Fazer cálculos trabalhistas</strong>
                    <p className="text-sm text-muted-foreground">Cálculos precisos e automáticos</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <strong>Validar qualidade antes do envio</strong>
                    <p className="text-sm text-muted-foreground">Score de qualidade em tempo real</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-tech-blue to-freelaw-purple rounded-xl flex items-center justify-center">
                <Zap className="h-24 w-24 text-white/20" />
              </div>
              <Card className="absolute -bottom-6 -left-6 p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Score de Qualidade</p>
                    <p className="text-2xl font-bold text-green-600">95%</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Processo Seletivo */}
      <section className="py-24 bg-gradient-to-br from-freelaw-purple to-tech-blue text-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              Processo Seletivo
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Como Entrar na Freelaw
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Nosso processo é rigoroso porque buscamos os melhores. 
              Mas se você tem talento e dedicação, terá todo nosso apoio.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Aplicação",
                description: "Conte sua história e por que quer mudar de vida",
                icon: FileText
              },
              {
                step: "2",
                title: "Análise de Fit",
                description: "Avaliamos seu perfil e experiência",
                icon: UserCheck
              },
              {
                step: "3",
                title: "Fase de Teste",
                description: "5 peças práticas avaliadas por IA",
                icon: Brain
              },
              {
                step: "4",
                title: "Aprovação",
                description: "Bem-vindo à Freelaw! Comece a trabalhar",
                icon: Trophy
              }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                  <item.icon className="h-10 w-10 text-white" />
                </div>
                <div className="text-3xl font-bold mb-2">{item.step}</div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-white/80">{item.description}</p>
                {i < 3 && (
                  <ChevronRight className="h-6 w-6 mx-auto mt-4 text-white/50" />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/portal-prestador/aplicacao">
              <Button size="lg" className="bg-white text-freelaw-purple hover:bg-white/90 text-lg px-8 py-6">
                Iniciar Minha Aplicação
                <Rocket className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Garantias e Compromissos */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800">
              Nossos Compromissos
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              O Que Garantimos Para Você
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 hover:border-green-500/50 transition-all">
              <CardHeader>
                <Shield className="h-10 w-10 text-green-600 mb-3" />
                <CardTitle>Pagamento Garantido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Trabalhou, recebeu. Pagamentos via PIX em até 3 dias úteis após aprovação.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-green-500/50 transition-all">
              <CardHeader>
                <Heart className="h-10 w-10 text-green-600 mb-3" />
                <CardTitle>Suporte Humanizado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Time dedicado para ajudar você em qualquer dificuldade. Resposta em até 24h.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-green-500/50 transition-all">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-green-600 mb-3" />
                <CardTitle>Crescimento Real</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sistema transparente de níveis. Quanto melhor seu desempenho, mais você ganha.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-green-500/50 transition-all">
              <CardHeader>
                <GraduationCap className="h-10 w-10 text-green-600 mb-3" />
                <CardTitle>Capacitação Contínua</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Treinamentos exclusivos para os melhores prestadores se desenvolverem ainda mais.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Rápido */}
      <section className="py-24 bg-gradient-to-br from-freelaw-white to-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perguntas Frequentes</h2>
          </div>
          
          <div className="space-y-4">
            {[
              {
                q: "Preciso ter CNPJ para trabalhar?",
                a: "Sim, você precisa emitir nota fiscal como PF ou PJ. Mas não se preocupe, te ajudamos com isso!"
              },
              {
                q: "Quanto posso ganhar por mês?",
                a: "Iniciantes ganham em média R$ 1.200. Top performers chegam a R$ 15.000+. Depende do seu esforço!"
              },
              {
                q: "Posso trabalhar de qualquer lugar?",
                a: "Sim! 100% remoto. Trabalhe de casa, do café, da praia. Você escolhe!"
              },
              {
                q: "Como funciona o pagamento?",
                a: "Pagamento via PIX em até 3 dias úteis após aprovação da peça. Sem burocracia!"
              }
            ].map((item, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final Poderoso */}
      <section className="py-32 bg-gradient-to-br from-freelaw-purple via-tech-blue to-freelaw-purple text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 text-lg px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            Últimas Vagas do Mês
          </Badge>
          
          <h2 className="text-5xl font-bold mb-6">
            Sua Nova Vida Começa Aqui
          </h2>
          
          <p className="text-2xl mb-8 text-white/90">
            500 advogados se inscrevem todo mês.<br/>
            Apenas os melhores são aprovados.<br/>
            <strong>Você será um deles?</strong>
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-2xl mx-auto mb-8 border border-white/20">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Coffee className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Trabalhe<br/>de Pijama</p>
              </div>
              <div>
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">De Qualquer<br/>Lugar</p>
              </div>
              <div>
                <LineChart className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Ganhe<br/>3x Mais</p>
              </div>
            </div>
          </div>
          
          <Link href="/portal-prestador/aplicacao">
            <Button size="lg" className="bg-white text-freelaw-purple hover:bg-white/90 text-xl px-12 py-8 shadow-2xl">
              Começar Minha Jornada Agora
              <Rocket className="ml-3 h-6 w-6" />
            </Button>
          </Link>
          
          <p className="mt-6 text-white/70">
            ⏱️ Processo de aplicação leva apenas 10 minutos
          </p>
        </div>
      </section>
    </div>
  )
}