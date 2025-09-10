import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)
    
    // Simular autenticação para testes
    if (email === 'test@example.com' && password === 'test123') {
      return NextResponse.json({
        access_token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: 'test-user-123',
          email,
          name: 'Test User',
          role: 'user'
        },
        expires_in: 3600
      }, { status: 200 })
    }
    
    return NextResponse.json({
      error: 'Credenciais inválidas'
    }, { status: 401 })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}




