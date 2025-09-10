import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const approveSchema = z.object({
  providerId: z.string(),
  approved: z.boolean(),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Simular verificação de admin auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json({
        error: 'Acesso negado - Admin necessário'
      }, { status: 403 })
    }
    
    const body = await request.json()
    const { providerId, approved, notes } = approveSchema.parse(body)
    
    // Simular aprovação para testes
    const result = {
      providerId,
      status: approved ? 'approved' : 'rejected',
      approvedAt: new Date().toISOString(),
      notes,
      approvedBy: 'admin-test-123'
    }
    
    return NextResponse.json({
      message: `Prestador ${approved ? 'aprovado' : 'rejeitado'} com sucesso`,
      result
    }, { status: 200 })

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




