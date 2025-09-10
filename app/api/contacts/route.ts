import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import type { Contact, ContactFormData } from '@/lib/types/contact'

// Mock database - in production, use Supabase
let mockContacts: Contact[] = [
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')

    let filtered = [...mockContacts]

    // Filter by tipo
    if (tipo && tipo !== 'TODOS') {
      filtered = filtered.filter(c => c.tipo === tipo)
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(c => 
        c.nome.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.cpf_cnpj?.includes(search) ||
        c.oab?.toLowerCase().includes(searchLower) ||
        c.telefone?.includes(search) ||
        c.celular?.includes(search)
      )
    }

    // Tag filter
    if (tag) {
      filtered = filtered.filter(c => c.tags?.includes(tag))
    }

    // Sort by updated_at desc
    filtered.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Erro ao buscar contatos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contatos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json()

    const newContact: Contact = {
      id: uuidv4(),
      ...data,
      processos: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockContacts.push(newContact)

    return NextResponse.json(newContact, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar contato:', error)
    return NextResponse.json(
      { error: 'Erro ao criar contato' },
      { status: 500 }
    )
  }
}