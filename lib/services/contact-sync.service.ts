import type { Contact, ContactFormData } from '@/lib/types/contact'

interface ProcessoParte {
  nome: string
  tipo: 'autor' | 'reu' | 'advogado' | 'terceiro'
  cpf_cnpj?: string
  oab?: string
}

interface Processo {
  numero_cnj?: string
  numero_processo?: string
  partes?: {
    autor?: ProcessoParte[]
    reu?: ProcessoParte[]
    advogados?: ProcessoParte[]
    terceiros?: ProcessoParte[]
  } | Array<{
    tipo?: 'AUTOR' | 'REU' | 'TERCEIRO'
    nome?: string
    cpf_cnpj?: string
    advogados?: { oab?: string; nome?: string }[]
  }>
  valor_causa?: number
  tribunal?: string
  comarca?: string
}

class ContactSyncService {
  /**
   * Extrai contatos de um processo e retorna lista de contatos para criar
   */
  extractContactsFromProcess(processo: Processo): ContactFormData[] {
    const contacts: ContactFormData[] = []
    
    if (!processo.partes) return contacts
    
    // Extrair autores (clientes)
    if ((processo.partes as any).autor) {
      (processo.partes as any).autor.forEach((parte: any) => {
        contacts.push(this.createContactFromParte(parte, 'CLIENTE', processo))
      })
    }
    
    // Extrair réus (partes contrárias)
    if ((processo.partes as any).reu) {
      (processo.partes as any).reu.forEach((parte: any) => {
        contacts.push(this.createContactFromParte(parte, 'PARTE_CONTRARIA', processo))
      })
    }
    
    // Extrair advogados
    if ((processo.partes as any).advogados) {
      (processo.partes as any).advogados.forEach((parte: any) => {
        contacts.push(this.createContactFromParte(parte, 'ADVOGADO', processo))
      })
    }
    
    // Extrair terceiros
    if ((processo.partes as any).terceiros) {
      (processo.partes as any).terceiros.forEach((parte: any) => {
        contacts.push(this.createContactFromParte(parte, 'OUTRO', processo))
      })
    }
    
    return contacts
  }
  
  /**
   * Cria um contato a partir de uma parte do processo
   */
  private createContactFromParte(
    parte: ProcessoParte,
    tipo: Contact['tipo'],
    processo: Processo
  ): ContactFormData {
    const contact: ContactFormData = {
      tipo,
      nome: this.normalizeName(parte.nome),
      cpf_cnpj: parte.cpf_cnpj ? this.normalizeCpfCnpj(parte.cpf_cnpj) : undefined,
      oab: parte.oab || undefined,
      tags: [],
      observacoes: `Importado do processo ${processo.numero_cnj || processo.numero_processo || ''}`
    }
    
    // Adicionar tags baseadas no processo
    if (processo.tribunal) {
      contact.tags?.push(processo.tribunal)
    }
    
    if (processo.comarca) {
      contact.tags?.push(processo.comarca)
    }
    
    if (processo.valor_causa && processo.valor_causa > 100000) {
      contact.tags?.push('Alto Valor')
    }
    
    return contact
  }
  
  /**
   * Normaliza o nome removendo caracteres especiais e formatando
   */
  private normalizeName(nome: string): string {
    return nome
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-\.]/g, '')
      .split(' ')
      .map(word => 
        word.length > 2 
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : word.toLowerCase()
      )
      .join(' ')
  }
  
  /**
   * Normaliza CPF/CNPJ para formato padrão
   */
  private normalizeCpfCnpj(cpfCnpj: string): string {
    const numbers = cpfCnpj.replace(/\D/g, '')
    
    if (numbers.length === 11) {
      // CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (numbers.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    
    return cpfCnpj
  }
  
  /**
   * Verifica se um contato já existe baseado em CPF/CNPJ ou nome
   */
  async checkContactExists(
    contact: ContactFormData,
    existingContacts: Contact[]
  ): Promise<boolean> {
    // Verificar por CPF/CNPJ se disponível
    if (contact.cpf_cnpj) {
      const cpfCnpjNormalized = contact.cpf_cnpj.replace(/\D/g, '')
      return existingContacts.some(c => 
        c.cpf_cnpj?.replace(/\D/g, '') === cpfCnpjNormalized
      )
    }
    
    // Verificar por OAB para advogados
    if (contact.tipo === 'ADVOGADO' && contact.oab) {
      return existingContacts.some(c => 
        c.tipo === 'ADVOGADO' && c.oab === contact.oab
      )
    }
    
    // Verificar por nome similar
    const normalizedName = contact.nome.toLowerCase().replace(/\s+/g, '')
    return existingContacts.some(c => {
      const existingName = c.nome.toLowerCase().replace(/\s+/g, '')
      return existingName === normalizedName && c.tipo === contact.tipo
    })
  }
  
  /**
   * Sincroniza contatos de um processo, criando apenas os que não existem
   */
  async syncContactsFromProcess(
    processo: Processo,
    existingContacts: Contact[] = []
  ): Promise<{
    created: ContactFormData[]
    skipped: ContactFormData[]
    errors: string[]
  }> {
    const result = {
      created: [] as ContactFormData[],
      skipped: [] as ContactFormData[],
      errors: [] as string[]
    }
    
    try {
      const contactsToCreate = this.extractContactsFromProcess(processo)
      
      for (const contact of contactsToCreate) {
        try {
          const exists = await this.checkContactExists(contact, existingContacts)
          
          if (exists) {
            result.skipped.push(contact)
          } else {
            result.created.push(contact)
          }
        } catch (error) {
          result.errors.push(
            `Erro ao processar contato ${contact.nome}: ${error}`
          )
        }
      }
    } catch (error) {
      result.errors.push(`Erro geral na sincronização: ${error}`)
    }
    
    return result
  }
}

export const contactSyncService = new ContactSyncService()