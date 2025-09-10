'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Loader2, Shield } from 'lucide-react'
import Link from 'next/link'

export default function ProviderLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    oab: '',
    password: '',
    rememberMe: false
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate login
    setTimeout(() => {
      toast.success('Login realizado com sucesso!')
      router.push('/portal-prestador/dashboard')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950/20 dark:via-background dark:to-blue-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/portal-prestador">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Portal do Prestador</h1>
          <p className="text-muted-foreground">
            Acesse sua conta para ver trabalhos disponíveis
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Login Seguro</CardTitle>
            </div>
            <CardDescription>
              Use suas credenciais cadastradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="oab">Número da OAB</Label>
                <Input
                  id="oab"
                  placeholder="Ex: SP123456"
                  value={formData.oab}
                  onChange={(e) => setFormData(prev => ({ ...prev, oab: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                    }
                  />
                  <label 
                    htmlFor="remember" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Lembrar de mim
                  </label>
                </div>
                <Link href="/portal-prestador/recuperar-senha" className="text-sm text-primary hover:underline">
                  Esqueci a senha
                </Link>
              </div>

              <Button 
                type="submit"
                disabled={loading || !formData.oab || !formData.password}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Ainda não tem conta?{' '}
                <Link href="/portal-prestador/cadastro" className="text-primary font-medium hover:underline">
                  Cadastre-se agora
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Ao fazer login, você concorda com nossos</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Link href="/termos" className="text-primary hover:underline">
              Termos de Uso
            </Link>
            <span>e</span>
            <Link href="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}