import { NextRequest, NextResponse } from 'next/server'
import { isUniversityRecommended } from '@/lib/data/oab-recommended-universities'

export async function POST(request: NextRequest) {
  try {
    const { university } = await request.json()

    if (!university) {
      return NextResponse.json(
        { error: 'Nome da universidade é obrigatório' },
        { status: 400 }
      )
    }

    const isRecommended = isUniversityRecommended(university)

    return NextResponse.json({
      university,
      isRecommended,
      message: isRecommended 
        ? 'Universidade recomendada pela OAB' 
        : 'Universidade não está na lista de recomendadas pela OAB'
    })

  } catch (error) {
    console.error('Erro ao validar universidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
