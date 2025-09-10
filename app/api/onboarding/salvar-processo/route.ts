import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const processo = await request.json()

    // Aqui você salvaria no banco de dados
    // Por enquanto, vamos apenas simular o salvamento
    console.log('Salvando processo:', processo)

    // Simular delay de salvamento
    await new Promise(resolve => setTimeout(resolve, 200))

    return NextResponse.json({
      success: true,
      message: 'Processo salvo com sucesso',
      data: processo
    })

  } catch (error) {
    console.error('Erro ao salvar processo:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar processo' },
      { status: 500 }
    )
  }
}