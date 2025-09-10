'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, AlertCircle, Briefcase } from 'lucide-react'
import { notification } from '@/lib/notifications'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        notification.error('Erro ao fazer login', { description: error.message })
        return
      }

      if (data.user) {
        notification.success('Login realizado com sucesso!', {})
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Ocorreu um erro ao fazer login')
      notification.error('Erro inesperado', {})
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        notification.error('Erro ao fazer login com Google', { description: error.message })
      }
    } catch (err) {
      setError('Ocorreu um erro ao fazer login com Google')
      notification.error('Erro inesperado', {})
    }
  }

  const handleDemoLogin = async () => {
    setError(null)

    try {
      // Demo credentials for testing
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@freelaw.ai',
        password: 'demo12345',
      })

      if (error) {
        // If demo user doesn't exist, create it
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: 'demo@freelaw.ai',
          password: 'demo12345',
          options: {
            data: {
              full_name: 'Usuário Demo',
              role: 'lawyer',
            },
          },
        })

        if (signUpError) {
          setError('Demo não disponível no momento')
          notification.error('Erro ao acessar demo', {})
          return
        }

        if (signUpData.user) {
          notification.success('Conta demo criada! Fazendo login...', {})
          router.push('/dashboard')
        }
      } else if (data.user) {
        notification.success('Login demo realizado!', {})
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Ocorreu um erro ao acessar a demo')
      notification.error('Erro inesperado', {})
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Briefcase className="h-12 w-12 text-primary" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-primary rounded-full animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Freelaw AI</h1>
          <p className="text-muted-foreground">
            Plataforma jurídica inteligente para advogados
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/forgot-password"
                  className="text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <LoadingButton 
                onClick={handleSignIn}
                className="w-full" 
                disabled={!email || !password}
                loadingText="Entrando..."
                loadingKey="login-submit"
              >
                Entrar
              </LoadingButton>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <LoadingButton
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full"
                loadingText="Conectando com Google..."
                loadingKey="google-login"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </LoadingButton>

              <LoadingButton
                onClick={handleDemoLogin}
                variant="outline"
                className="w-full"
                loadingText="Acessando demo..."
                loadingKey="demo-login"
              >
                <span className="mr-2">🎮</span>
                Acessar Demo
              </LoadingButton>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Cadastre-se
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos{' '}
          <Link href="/terms" className="underline hover:text-primary">
            Termos de Serviço
          </Link>{' '}
          e{' '}
          <Link href="/privacy" className="underline hover:text-primary">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  )
}