import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calendarService } from '@/lib/services/CalendarIntegrationService'
import { z } from 'zod'

const syncSchema = z.object({
  provider: z.enum(['google', 'outlook']),
  access_token: z.string(),
  calendar_id: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = syncSchema.parse(body)

    let events = []
    
    if (validatedData.provider === 'google') {
      events = await calendarService.syncWithGoogleCalendar(user.id, {
        provider: 'google',
        accessToken: validatedData.access_token,
        calendarId: validatedData.calendar_id,
        syncEnabled: true
      })
    } else if (validatedData.provider === 'outlook') {
      events = await calendarService.syncWithOutlook(user.id, {
        provider: 'outlook',
        accessToken: validatedData.access_token,
        syncEnabled: true
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        events_synced: events.length,
        events: events.slice(0, 10) // Primeiros 10 para preview
      },
      message: `${events.length} eventos sincronizados do ${validatedData.provider}`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro na sincronização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = new Date(searchParams.get('start_date') || new Date().toISOString())
    const endDate = new Date(searchParams.get('end_date') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())

    const events = await calendarService.getIntegratedEvents(user.id, startDate, endDate)

    return NextResponse.json({
      success: true,
      data: events,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
