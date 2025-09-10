import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cliente = await request.json()

    // Aqui você salvaria no banco de dados
    // Por enquanto, vamos apenas simular o salvamento
    console.log('Salvando cliente:', cliente)

    // Simular delay de salvamento
    await new Promise(resolve => setTimeout(resolve, 200))

    return NextResponse.json({
      success: true,
      message: 'Cliente salvo com sucesso',
      data: cliente
    })

  } catch (error) {
    console.error('Erro ao salvar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar cliente' },
      { status: 500 }
    )
  }
}