import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    // Simular callback de OAuth
    if (error) {
      return NextResponse.json({
        error: 'Authentication failed',
        details: error
      }, { status: 400 })
    }
    
    if (!code) {
      return NextResponse.json({
        error: 'Missing authorization code'
      }, { status: 400 })
    }
    
    // Simular troca do code por token
    const mockUser = {
      id: 'user-' + Date.now(),
      email: 'callback@test.com',
      name: 'Callback User',
      provider: 'google'
    }
    
    // Em um app real, faria redirect para frontend
    return NextResponse.json({
      success: true,
      user: mockUser,
      access_token: 'mock-callback-token-' + Date.now(),
      expires_in: 3600
    })

  } catch (error: any) {
    console.error('Erro no callback de auth:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}




