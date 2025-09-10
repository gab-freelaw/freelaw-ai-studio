import { createClient } from '@/lib/supabase/client'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  attendees?: string[]
  source: 'google' | 'outlook' | 'freelaw'
  externalId?: string
  relatedProcessId?: string
  relatedDelegationId?: string
}

export interface CalendarIntegrationConfig {
  provider: 'google' | 'outlook'
  accessToken: string
  refreshToken?: string
  calendarId?: string
  syncEnabled: boolean
}

export class CalendarIntegrationService {
  private supabase = createClient()

  async syncWithGoogleCalendar(userId: string, config: CalendarIntegrationConfig): Promise<CalendarEvent[]> {
    try {
      // Buscar eventos do Google Calendar
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${config.calendarId || 'primary'}/events?timeMin=${new Date().toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.status}`)
      }

      const data = await response.json()
      const events: CalendarEvent[] = (data.items || []).map((item: any) => ({
        id: `google_${item.id}`,
        title: item.summary || 'Sem título',
        description: item.description,
        startTime: item.start?.dateTime || item.start?.date,
        endTime: item.end?.dateTime || item.end?.date,
        location: item.location,
        attendees: item.attendees?.map((a: any) => a.email) || [],
        source: 'google',
        externalId: item.id
      }))

      // Salvar eventos sincronizados
      await this.saveExternalEvents(userId, events)
      
      return events
    } catch (error) {
      console.error('Erro na sincronização Google Calendar:', error)
      throw error
    }
  }

  async syncWithOutlook(userId: string, config: CalendarIntegrationConfig): Promise<CalendarEvent[]> {
    try {
      // Buscar eventos do Outlook
      const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Outlook API error: ${response.status}`)
      }

      const data = await response.json()
      const events: CalendarEvent[] = (data.value || []).map((item: any) => ({
        id: `outlook_${item.id}`,
        title: item.subject || 'Sem título',
        description: item.body?.content,
        startTime: item.start?.dateTime,
        endTime: item.end?.dateTime,
        location: item.location?.displayName,
        attendees: item.attendees?.map((a: any) => a.emailAddress?.address) || [],
        source: 'outlook',
        externalId: item.id
      }))

      // Salvar eventos sincronizados
      await this.saveExternalEvents(userId, events)
      
      return events
    } catch (error) {
      console.error('Erro na sincronização Outlook:', error)
      throw error
    }
  }

  async createEventInExternalCalendar(
    userId: string,
    event: Omit<CalendarEvent, 'id' | 'source'>,
    provider: 'google' | 'outlook',
    accessToken: string
  ): Promise<string> {
    try {
      if (provider === 'google') {
        return await this.createGoogleEvent(event, accessToken)
      } else {
        return await this.createOutlookEvent(event, accessToken)
      }
    } catch (error) {
      console.error('Erro ao criar evento externo:', error)
      throw error
    }
  }

  private async createGoogleEvent(event: Omit<CalendarEvent, 'id' | 'source'>, accessToken: string): Promise<string> {
    const googleEvent = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startTime,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: event.endTime,
        timeZone: 'America/Sao_Paulo'
      },
      location: event.location,
      attendees: event.attendees?.map(email => ({ email }))
    }

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(googleEvent)
    })

    if (!response.ok) {
      throw new Error(`Erro ao criar evento Google: ${response.status}`)
    }

    const data = await response.json()
    return data.id
  }

  private async createOutlookEvent(event: Omit<CalendarEvent, 'id' | 'source'>, accessToken: string): Promise<string> {
    const outlookEvent = {
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description || ''
      },
      start: {
        dateTime: event.startTime,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: event.endTime,
        timeZone: 'America/Sao_Paulo'
      },
      location: {
        displayName: event.location || ''
      },
      attendees: event.attendees?.map(email => ({
        emailAddress: { address: email, name: email }
      }))
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(outlookEvent)
    })

    if (!response.ok) {
      throw new Error(`Erro ao criar evento Outlook: ${response.status}`)
    }

    const data = await response.json()
    return data.id
  }

  private async saveExternalEvents(userId: string, events: CalendarEvent[]): Promise<void> {
    if (events.length === 0) return

    const eventsToSave = events.map(event => ({
      id: event.id,
      user_id: userId,
      title: event.title,
      description: event.description,
      start_time: event.startTime,
      end_time: event.endTime,
      location: event.location,
      attendees: event.attendees || [],
      source: event.source,
      external_id: event.externalId,
      related_process_id: event.relatedProcessId,
      related_delegation_id: event.relatedDelegationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { error } = await this.supabase
      .from('calendar_events')
      .upsert(eventsToSave, { onConflict: 'id' })

    if (error) throw error
  }

  async getIntegratedEvents(userId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const { data, error } = await this.supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .order('start_time')

    if (error) throw error

    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      startTime: item.start_time,
      endTime: item.end_time,
      location: item.location,
      attendees: item.attendees || [],
      source: item.source,
      externalId: item.external_id,
      relatedProcessId: item.related_process_id,
      relatedDelegationId: item.related_delegation_id
    }))
  }

  // Criar evento de prazo automático
  async createDeadlineEvent(
    userId: string,
    processo: any,
    deadline: Date,
    syncToExternal = true
  ): Promise<CalendarEvent> {
    const event: Omit<CalendarEvent, 'id'> = {
      title: `Prazo: ${processo.classe || 'Processo'}`,
      description: `Processo: ${processo.numero_cnj || processo.numero_processo}\nCliente: ${processo.client_name || 'N/A'}\nTribunal: ${processo.court || 'N/A'}`,
      startTime: new Date(deadline.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2h antes
      endTime: deadline.toISOString(),
      location: processo.court,
      source: 'freelaw',
      relatedProcessId: processo.id
    }

    // Salvar no banco local
    const { data, error } = await this.supabase
      .from('calendar_events')
      .insert([{
        ...event,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error

    return {
      ...event,
      id: data.id
    }
  }
}

export const calendarService = new CalendarIntegrationService()




