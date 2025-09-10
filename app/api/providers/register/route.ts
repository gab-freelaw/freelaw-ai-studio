import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  oab: z.string().min(5, 'OAB deve ter pelo menos 5 caracteres'),
  state: z.string().min(2, 'Estado é obrigatório'),
  experience: z.enum(['junior', 'pleno', 'senior', 'especialista']),
  specialties: z.array(z.string()).min(1, 'Pelo menos uma especialidade é obrigatória'),
  bio: z.string().optional(),
  availability: z.enum(['part_time', 'full_time', 'specific_projects']),
  workload: z.enum(['light', 'medium', 'heavy']),
  motivation: z.string().min(50, 'Motivação deve ter pelo menos 50 caracteres')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)
    
    // Simular criação de prestador para testes
    const provider = {
      id: 'test-provider-' + Date.now(),
      ...validatedData,
      status: 'pending',
      registration_step: 1,
      created_at: new Date().toISOString()
    }
    
    return NextResponse.json({
      message: 'Aplicação enviada com sucesso! Você receberá um email com os próximos passos.',
      provider,
      nextStep: '/portal-prestador/documentos'
    }, { status: 201 })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 })
    }
    
    console.error('Erro no registro de prestador:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const oab = searchParams.get('oab')
    
    if (!email && !oab) {
      return NextResponse.json({
        error: 'Email ou OAB são obrigatórios'
      }, { status: 400 })
    }
    
    // Simular consulta para testes
    const provider = {
      id: 'test-provider-123',
      email: email || 'test@example.com',
      oab_number: oab || 'OAB123456',
      status: 'approved',
      registration_step: 3
    }
    
    return NextResponse.json({
      provider,
      exists: true,
      status: provider.status,
      registrationStep: provider.registration_step
    })

  } catch (error: any) {
    console.error('Erro na consulta de prestador:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}




