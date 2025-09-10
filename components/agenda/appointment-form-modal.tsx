'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Calendar, Clock, MapPin, Users, Bell, Repeat } from 'lucide-react'
import type { Appointment, AppointmentFormData } from '@/lib/types/appointment'

interface AppointmentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: Appointment
  onSubmit: (data: AppointmentFormData) => Promise<void>
  selectedDate?: Date
}

const TIPOS_COMPROMISSO = [
  { value: 'AUDIENCIA', label: 'Audiência', color: 'text-red-600' },
  { value: 'REUNIAO', label: 'Reunião', color: 'text-blue-600' },
  { value: 'PRAZO', label: 'Prazo', color: 'text-yellow-600' },
  { value: 'COMPROMISSO', label: 'Compromisso', color: 'text-purple-600' },
  { value: 'LEMBRETE', label: 'Lembrete', color: 'text-gray-600' }
] as const

const RECORRENCIA_OPTIONS = [
  { value: 'none', label: 'Não repetir' },
  { value: 'DIARIA', label: 'Diariamente' },
  { value: 'SEMANAL', label: 'Semanalmente' },
  { value: 'MENSAL', label: 'Mensalmente' },
  { value: 'ANUAL', label: 'Anualmente' }
]

const LEMBRETE_OPTIONS = [
  { value: 'none', label: 'Sem lembrete' },
  { value: '15', label: '15 minutos antes' },
  { value: '30', label: '30 minutos antes' },
  { value: '60', label: '1 hora antes' },
  { value: '120', label: '2 horas antes' },
  { value: '1440', label: '1 dia antes' },
  { value: '2880', label: '2 dias antes' }
]

export function AppointmentFormModal({
  open,
  onOpenChange,
  appointment,
  onSubmit,
  selectedDate
}: AppointmentFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<AppointmentFormData>({
    titulo: appointment?.titulo || '',
    descricao: appointment?.descricao || '',
    tipo: appointment?.tipo || 'COMPROMISSO',
    data_inicio: appointment?.data_inicio || (selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
    data_fim: appointment?.data_fim || '',
    horario_inicio: appointment?.horario_inicio || '',
    horario_fim: appointment?.horario_fim || '',
    local: appointment?.local || '',
    participantes: appointment?.participantes || [],
    processo_id: appointment?.processo_id || '',
    contato_id: appointment?.contato_id || '',
    status: appointment?.status || 'AGENDADO',
    observacoes: appointment?.observacoes || ''
  })
  const [recorrencia, setRecorrencia] = useState(appointment?.recorrencia ? appointment.recorrencia.tipo : 'none')
  const [lembrete, setLembrete] = useState(
    appointment?.lembrete ? appointment.lembrete.minutos_antes.toString() : 'none'
  )
  const [participante, setParticipante] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const submitData: AppointmentFormData = {
        ...formData,
        recorrencia: recorrencia !== 'none' 
          ? { tipo: recorrencia as any, intervalo: 1 }
          : undefined,
        lembrete: lembrete !== 'none'
          ? { tipo: 'NOTIFICACAO', minutos_antes: parseInt(lembrete) }
          : undefined
      }
      
      await onSubmit(submitData)
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar compromisso:', error)
    } finally {
      setLoading(false)
    }
  }

  const addParticipante = () => {
    if (participante.trim() && !formData.participantes?.includes(participante.trim())) {
      setFormData(prev => ({
        ...prev,
        participantes: [...(prev.participantes || []), participante.trim()]
      }))
      setParticipante('')
    }
  }

  const removeParticipante = (p: string) => {
    setFormData(prev => ({
      ...prev,
      participantes: prev.participantes?.filter(part => part !== p) || []
    }))
  }

  const tipoColor = TIPOS_COMPROMISSO.find(t => t.value === formData.tipo)?.color || 'text-gray-600'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Editar Compromisso' : 'Novo Compromisso'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: Appointment['tipo']) =>
                  setFormData(prev => ({ ...prev, tipo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_COMPROMISSO.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <span className={tipo.color}>{tipo.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Appointment['status']) =>
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGENDADO">Agendado</SelectItem>
                  <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ex: Audiência de Conciliação"
              required
              className={tipoColor}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data *
              </Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={e => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data Fim
              </Label>
              <Input
                id="data_fim"
                type="date"
                value={formData.data_fim}
                onChange={e => setFormData(prev => ({ ...prev, data_fim: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horario_inicio">
                <Clock className="w-4 h-4 inline mr-1" />
                Horário Início
              </Label>
              <Input
                id="horario_inicio"
                type="time"
                value={formData.horario_inicio}
                onChange={e => setFormData(prev => ({ ...prev, horario_inicio: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario_fim">
                <Clock className="w-4 h-4 inline mr-1" />
                Horário Fim
              </Label>
              <Input
                id="horario_fim"
                type="time"
                value={formData.horario_fim}
                onChange={e => setFormData(prev => ({ ...prev, horario_fim: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="local">
              <MapPin className="w-4 h-4 inline mr-1" />
              Local
            </Label>
            <Input
              id="local"
              value={formData.local}
              onChange={e => setFormData(prev => ({ ...prev, local: e.target.value }))}
              placeholder="Ex: Fórum Central, Sala 301"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recorrencia">
                <Repeat className="w-4 h-4 inline mr-1" />
                Recorrência
              </Label>
              <Select value={recorrencia} onValueChange={setRecorrencia}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORRENCIA_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lembrete">
                <Bell className="w-4 h-4 inline mr-1" />
                Lembrete
              </Label>
              <Select value={lembrete} onValueChange={setLembrete}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEMBRETE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="participantes">
              <Users className="w-4 h-4 inline mr-1" />
              Participantes
            </Label>
            <div className="flex gap-2">
              <Input
                id="participantes"
                value={participante}
                onChange={e => setParticipante(e.target.value)}
                placeholder="Adicionar participante..."
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addParticipante())}
              />
              <Button type="button" onClick={addParticipante} variant="outline">
                Adicionar
              </Button>
            </div>
            {formData.participantes && formData.participantes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.participantes.map(p => (
                  <span
                    key={p}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {p}
                    <button
                      type="button"
                      onClick={() => removeParticipante(p)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="processo_id">Processo Relacionado</Label>
              <Input
                id="processo_id"
                value={formData.processo_id}
                onChange={e => setFormData(prev => ({ ...prev, processo_id: e.target.value }))}
                placeholder="Número do processo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contato_id">Contato Relacionado</Label>
              <Input
                id="contato_id"
                value={formData.contato_id}
                onChange={e => setFormData(prev => ({ ...prev, contato_id: e.target.value }))}
                placeholder="ID do contato"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : appointment ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}