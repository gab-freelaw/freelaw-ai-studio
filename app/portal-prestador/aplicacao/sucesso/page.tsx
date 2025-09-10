'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  Mail,
  Clock,
  BookOpen,
  Brain,
  Trophy,
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp
} from 'lucide-react'
import confetti from 'canvas-confetti'

export default function SuccessPage() {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const [providerId, setProviderId] = useState<string | null>(null)

  useEffect(() => {
    // Trigger confetti animation
    if (!showConfetti) {
      setShowConfetti(true)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB612', '#00C4B4', '#FF006E']
      })
    }
    
    // Get provider ID from localStorage if available
    const storedId = localStorage.getItem('providerId')
    if (storedId) {
      setProviderId(storedId)
    }
  }, [showConfetti])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-product-teal/10">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-olympic-gold to-product-pink mb-6">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4">
            Aplicação Enviada com Sucesso!
          </h1>
          
          <p className="text-xl text-muted-foreground mb-2">
            Parabéns por dar o primeiro passo para transformar sua carreira
          </p>
          
          <p className="text-lg text-olympic-gold font-medium">
            Você está a caminho de se juntar a mais de 11.000 advogados de sucesso
          </p>
          
          {providerId && (
            <div className="mt-4">
              <span className="inline-flex items-center rounded-full bg-olympic-gold/10 px-3 py-1 text-sm font-medium text-olympic-gold">
                ID da Aplicação: {providerId}
              </span>
            </div>
          )}
        </div>

        {/* What Happens Next */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-product-teal" />
              O Que Acontece Agora?
            </CardTitle>
            <CardDescription>
              Seu processo de seleção já começou. Veja os próximos passos:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-olympic-gold/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-olympic-gold">1</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Análise da Aplicação (24-48h)</h3>
                  <p className="text-sm text-muted-foreground">
                    Nossa equipe analisará suas respostas para entender seu perfil e verificar o fit com a FreeLaw.
                    Você receberá um e-mail com o resultado.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-product-teal/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-product-teal">2</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Teste Prático com IA (5 peças)</h3>
                  <p className="text-sm text-muted-foreground">
                    Se aprovado, você receberá 5 casos reais para elaborar peças jurídicas. 
                    Nossa IA avaliará sua capacidade técnica, argumentação e qualidade.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-product-pink/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-product-pink">3</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Onboarding e Primeiras Peças</h3>
                  <p className="text-sm text-muted-foreground">
                    Aprovado no teste, você passará por um onboarding completo e começará com 30 peças/mês,
                    com potencial de crescimento rápido baseado em seu desempenho.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Notification */}
        <Card className="mb-6 border-olympic-gold/20 bg-olympic-gold/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-olympic-gold" />
              Verifique seu E-mail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Enviamos um e-mail de confirmação com todos os detalhes da sua aplicação.
              Se não receber em alguns minutos, verifique sua pasta de spam.
            </p>
          </CardContent>
        </Card>

        {/* Tips for Success */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-product-pink" />
              Dicas para o Sucesso no Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <BookOpen className="h-4 w-4 text-product-teal mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Qualidade sobre Velocidade</p>
                  <p className="text-xs text-muted-foreground">
                    Foque em entregar peças bem fundamentadas e sem erros
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Brain className="h-4 w-4 text-olympic-gold mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Argumentação Sólida</p>
                  <p className="text-xs text-muted-foreground">
                    Nossa IA valoriza argumentação jurídica clara e bem estruturada
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Trophy className="h-4 w-4 text-product-pink mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Formatação Profissional</p>
                  <p className="text-xs text-muted-foreground">
                    Atenção aos detalhes de formatação e organização das peças
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Growth Path Reminder */}
        <Card className="mb-8 bg-gradient-to-br from-olympic-gold/5 to-product-pink/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Seu Potencial de Crescimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-olympic-gold">30</p>
                <p className="text-xs text-muted-foreground">peças/mês</p>
                <p className="text-sm font-medium">Iniciante</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-product-teal">50</p>
                <p className="text-xs text-muted-foreground">peças/mês</p>
                <p className="text-sm font-medium">Júnior</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-product-pink">100</p>
                <p className="text-xs text-muted-foreground">peças/mês</p>
                <p className="text-sm font-medium">Pleno</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold bg-gradient-to-r from-olympic-gold to-product-teal text-transparent bg-clip-text">150</p>
                <p className="text-xs text-muted-foreground">peças/mês</p>
                <p className="text-sm font-medium">Sênior</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold bg-gradient-to-r from-olympic-gold to-product-pink text-transparent bg-clip-text">200+</p>
                <p className="text-xs text-muted-foreground">peças/mês</p>
                <p className="text-sm font-medium">Expert</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-background/50">
              <p className="text-sm text-center">
                <span className="font-medium">Média de crescimento:</span> Advogados dedicados alcançam 
                o nível Pleno (100 peças/mês = R$ 4.000+) em <span className="font-bold text-olympic-gold">3-4 meses</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/portal-prestador')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Conhecer Mais Sobre a FreeLaw
          </Button>
          
          <Button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-olympic-gold to-product-pink hover:from-olympic-gold/90 hover:to-product-pink/90 flex items-center gap-2"
          >
            Voltar ao Início
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Contact Support */}
        <div className="text-center mt-8 p-4 rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground">
            Dúvidas sobre o processo? Entre em contato:{' '}
            <a href="mailto:talentos@freelaw.com.br" className="text-olympic-gold hover:underline">
              talentos@freelaw.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}