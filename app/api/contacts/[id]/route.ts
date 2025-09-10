import { NextRequest, NextResponse } from 'next/server'
import type { Contact, ContactFormData } from '@/lib/types/contact'

// This should match the mock data from the main route
// In production, use a shared database connection
let mockContacts: Contact[] = []

// Helper to get current contacts
async function getContacts(): Promise<Contact[]> {
  // In production, fetch from Supabase
  // For now, we'll use a simple in-memory store
  if (mockContacts.length === 0) {
    // Initialize with same data as main route
    mockContacts = [
      {
        id: '1',
        tipo: 'CLIENTE',
        nome: 'João Silva',
        email: 'joao.silva@email.com',
        telefone: '(11) 3456-7890',
        celular: '(11) 98765-4321',
        cpf_cnpj: '123.456.789-00',
        endereco: {
          logradouro: 'Rua das Flores',
          numero: '123',
          complemento: 'Apto 45',
          bairro: 'Jardim Paulista',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567'
        },
        observacoes: 'Cliente VIP - Prioridade alta',
        tags: ['VIP', 'Empresarial'],
        processos: ['1002345-67.2024.8.26.0100'],
        created_at: new Date('2024-01-15').toISOString(),
        updated_at: new Date('2024-01-15').toISOString()
      },
      {
        id: '2',
        tipo: 'ADVOGADO',
        nome: 'Dra. Maria Santos',
        email: 'maria.santos@advocacia.com',
        celular: '(11) 99876-5432',
        oab: 'OAB/SP 234.567',
        tags: ['Parceiro'],
        created_at: new Date('2024-01-20').toISOString(),
        updated_at: new Date('2024-01-20').toISOString()
      },
      {
        id: '3',
        tipo: 'PARTE_CONTRARIA',
        nome: 'Empresa XYZ Ltda',
        email: 'juridico@empresaxyz.com',
        telefone: '(11) 3333-4444',
        cpf_cnpj: '12.345.678/0001-90',
        endereco: {
          logradouro: 'Av. Brigadeiro Faria Lima',
          numero: '1000',
          complemento: '10º andar',
          bairro: 'Pinheiros',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '05426-100'
        },
        processos: ['1002345-67.2024.8.26.0100', '1003456-78.2024.8.26.0100'],
        created_at: new Date('2024-02-01').toISOString(),
        updated_at: new Date('2024-02-01').toISOString()
      },
      {
        id: '4',
        tipo: 'PERITO',
        nome: 'Dr. Carlos Pereira',
        email: 'carlos.perito@email.com',
        celular: '(11) 97654-3210',
        tags: ['Engenharia', 'Construção Civil'],
        created_at: new Date('2024-02-10').toISOString(),
        updated_at: new Date('2024-02-10').toISOString()
      },
      {
        id: '5',
        tipo: 'TESTEMUNHA',
        nome: 'Ana Costa',
        celular: '(11) 96543-2109',
        processos: ['1003456-78.2024.8.26.0100'],
        created_at: new Date('2024-02-15').toISOString(),
        updated_at: new Date('2024-02-15').toISOString()
      }
    ]
  }
  return mockContacts
}

type Params = { id: string }

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params
    const contacts = await getContacts()
    const contact = contacts.find(c => c.id === id)

    if (!contact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Erro ao buscar contato:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contato' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params
    const data: ContactFormData = await request.json()
    const contacts = await getContacts()
    const index = contacts.findIndex(c => c.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }

    const updatedContact: Contact = {
      ...contacts[index],
      ...data,
      id: contacts[index].id,
      processos: contacts[index].processos,
      created_at: contacts[index].created_at,
      updated_at: new Date().toISOString()
    }

    mockContacts[index] = updatedContact

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Erro ao atualizar contato:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar contato' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params
    const contacts = await getContacts()
    const index = contacts.findIndex(c => c.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }

    mockContacts.splice(index, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar contato:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar contato' },
      { status: 500 }
    )
  }
}