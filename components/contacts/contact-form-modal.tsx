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
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import type { Contact, ContactFormData } from '@/lib/types/contact'

interface ContactFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact
  onSubmit: (data: ContactFormData) => Promise<void>
}

const TIPOS_CONTATO = [
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'PARTE_CONTRARIA', label: 'Parte Contrária' },
  { value: 'ADVOGADO', label: 'Advogado' },
  { value: 'PERITO', label: 'Perito' },
  { value: 'TESTEMUNHA', label: 'Testemunha' },
  { value: 'OUTRO', label: 'Outro' }
] as const

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export function ContactFormModal({
  open,
  onOpenChange,
  contact,
  onSubmit
}: ContactFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ContactFormData>({
    tipo: contact?.tipo || 'CLIENTE',
    nome: contact?.nome || '',
    email: contact?.email || '',
    telefone: contact?.telefone || '',
    celular: contact?.celular || '',
    cpf_cnpj: contact?.cpf_cnpj || '',
    oab: contact?.oab || '',
    endereco: contact?.endereco || undefined,
    observacoes: contact?.observacoes || '',
    tags: contact?.tags || []
  })
  const [newTag, setNewTag] = useState('')
  const [hasAddress, setHasAddress] = useState(!!contact?.endereco)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar contato:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }))
  }

  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Editar Contato' : 'Novo Contato'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: Contact['tipo']) =>
                  setFormData(prev => ({ ...prev, tipo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONTATO.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
              <Input
                id="cpf_cnpj"
                value={formData.cpf_cnpj}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  cpf_cnpj: formatCpfCnpj(e.target.value)
                }))}
                maxLength={18}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  telefone: formatPhone(e.target.value)
                }))}
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                value={formData.celular}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  celular: formatPhone(e.target.value)
                }))}
                maxLength={15}
              />
            </div>
          </div>

          {formData.tipo === 'ADVOGADO' && (
            <div className="space-y-2">
              <Label htmlFor="oab">OAB</Label>
              <Input
                id="oab"
                value={formData.oab}
                onChange={e => setFormData(prev => ({ ...prev, oab: e.target.value }))}
                placeholder="Ex: OAB/SP 123.456"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Endereço</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHasAddress(!hasAddress)
                  if (!hasAddress) {
                    setFormData(prev => ({
                      ...prev,
                      endereco: {
                        logradouro: '',
                        numero: '',
                        bairro: '',
                        cidade: '',
                        estado: 'SP',
                        cep: ''
                      }
                    }))
                  } else {
                    setFormData(prev => ({ ...prev, endereco: undefined }))
                  }
                }}
              >
                {hasAddress ? 'Remover' : 'Adicionar'}
              </Button>
            </div>

            {hasAddress && (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input
                      id="logradouro"
                      value={formData.endereco?.logradouro || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        endereco: {
                          ...prev.endereco!,
                          logradouro: e.target.value
                        }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.endereco?.numero || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        endereco: {
                          ...prev.endereco!,
                          numero: e.target.value
                        }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.endereco?.complemento || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        endereco: {
                          ...prev.endereco!,
                          complemento: e.target.value
                        }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.endereco?.bairro || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        endereco: {
                          ...prev.endereco!,
                          bairro: e.target.value
                        }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.endereco?.cidade || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        endereco: {
                          ...prev.endereco!,
                          cidade: e.target.value
                        }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select
                      value={formData.endereco?.estado || 'SP'}
                      onValueChange={value => setFormData(prev => ({
                        ...prev,
                        endereco: {
                          ...prev.endereco!,
                          estado: value
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map(uf => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.endereco?.cep || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        endereco: {
                          ...prev.endereco!,
                          cep: formatCep(e.target.value)
                        }
                      }))}
                      maxLength={9}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Adicionar tag..."
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
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
              {loading ? 'Salvando...' : contact ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}