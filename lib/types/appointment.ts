export interface Appointment {
  id: string
  titulo: string
  descricao?: string
  tipo: 'AUDIENCIA' | 'REUNIAO' | 'PRAZO' | 'COMPROMISSO' | 'LEMBRETE'
  data_inicio: string
  data_fim?: string
  horario_inicio?: string
  horario_fim?: string
  local?: string
  participantes?: string[]
  processo_id?: string
  contato_id?: string
  recorrencia?: {
    tipo: 'DIARIA' | 'SEMANAL' | 'MENSAL' | 'ANUAL'
    intervalo: number
    fim?: string
  }
  lembrete?: {
    tipo: 'EMAIL' | 'NOTIFICACAO'
    minutos_antes: number
  }
  status: 'AGENDADO' | 'CONFIRMADO' | 'CANCELADO' | 'CONCLUIDO'
  cor?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface AppointmentFormData {
  titulo: string
  descricao?: string
  tipo: Appointment['tipo']
  data_inicio: string
  data_fim?: string
  horario_inicio?: string
  horario_fim?: string
  local?: string
  participantes?: string[]
  processo_id?: string
  contato_id?: string
  recorrencia?: Appointment['recorrencia']
  lembrete?: Appointment['lembrete']
  status: Appointment['status']
  cor?: string
  observacoes?: string
}