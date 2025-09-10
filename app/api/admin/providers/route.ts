import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Simular verificação de admin auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json({
        error: 'Acesso negado - Admin necessário'
      }, { status: 401 })
    }
    
    // Simular lista de prestadores para admin
    const providers = [
      {
        id: 'provider-1',
        name: 'João Silva',
        email: 'joao@provider.com',
        status: 'approved',
        oab: 'SP123456',
        specialties: ['civil', 'trabalhista'],
        registeredAt: new Date().toISOString()
      },
      {
        id: 'provider-2', 
        name: 'Maria Santos',
        email: 'maria@provider.com',
        status: 'pending',
        oab: 'RJ789012',
        specialties: ['criminal', 'familia'],
        registeredAt: new Date().toISOString()
      }
    ]
    
    return NextResponse.json({
      providers,
      total: providers.length,
      page: 1,
      totalPages: 1
    })

  } catch (error: any) {
    console.error('Erro ao listar prestadores:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}




