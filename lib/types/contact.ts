export interface Contact {
  id: string
  tipo: 'CLIENTE' | 'PARTE_CONTRARIA' | 'ADVOGADO' | 'PERITO' | 'TESTEMUNHA' | 'OUTRO'
  nome: string
  email?: string
  telefone?: string
  celular?: string
  cpf_cnpj?: string
  oab?: string
  endereco?: {
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
    cep: string
  }
  observacoes?: string
  tags?: string[]
  processos?: string[] // IDs dos processos relacionados
  created_at: string
  updated_at: string
}

export interface ContactFormData {
  tipo: Contact['tipo']
  nome: string
  email?: string
  telefone?: string
  celular?: string
  cpf_cnpj?: string
  oab?: string
  endereco?: Contact['endereco']
  observacoes?: string
  tags?: string[]
}