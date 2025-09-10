import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: z.enum(['user', 'admin', 'provider']).optional().default('user')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userData = registerSchema.parse(body)
    
    // Simular criação de usuário para testes
    const user = {
      id: 'test-user-' + Date.now(),
      ...userData,
      created_at: new Date().toISOString(),
      email_verified: false
    }
    
    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      access_token: 'mock-jwt-token-' + Date.now()
    }, { status: 201 })

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




