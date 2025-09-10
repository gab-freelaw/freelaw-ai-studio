import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const advogado = await request.json()

    // Aqui você salvaria no banco de dados
    // Por enquanto, vamos apenas simular o salvamento
    console.log('Salvando advogado:', advogado)

    // Simular delay de salvamento
    await new Promise(resolve => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      message: 'Advogado salvo com sucesso',
      data: advogado
    })

  } catch (error) {
    console.error('Erro ao salvar advogado:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar advogado' },
      { status: 500 }
    )
  }
}