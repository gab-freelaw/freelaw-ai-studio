/**
 * Mock Legal Data Service
 * Provides simulated data for testing and demo purposes
 * This allows the application to work without external APIs
 */

export interface MockAdvogado {
  nome: string
  oab: string
  uf: string
  tipo: string
  email?: string
  telefone?: string
}

export interface MockProcesso {
  numero_cnj: string
  titulo: string
  cliente: string
  tipo_cliente: 'AUTOR' | 'REU'
  valor_causa?: number
  data_inicio: string
  tribunal: string
  classe: string
  assunto: string
  status: string
  ultima_movimentacao?: string
  partes?: {
    autores: Array<{ nome: string; cpf_cnpj?: string; tipo_pessoa?: string }>
    reus: Array<{ nome: string; cpf_cnpj?: string; tipo_pessoa?: string }>
    advogados: Array<{ nome: string; oab?: string }>
  }
}

export interface MockCliente {
  nome: string
  cpf_cnpj?: string
  tipo_pessoa: 'FISICA' | 'JURIDICA'
  processos: string[]
  email?: string
  telefone?: string
}

// Banco de dados simulado de advogados
const mockAdvogados: { [key: string]: MockAdvogado } = {
  '123456-SP': {
    nome: 'Dr. João Silva Santos',
    oab: '123456',
    uf: 'SP',
    tipo: 'Advogado',
    email: 'joao.silva@exemplo.com',
    telefone: '(11) 99999-9999'
  },
  '234567-RJ': {
    nome: 'Dra. Maria Oliveira',
    oab: '234567',
    uf: 'RJ',
    tipo: 'Advogada',
    email: 'maria.oliveira@exemplo.com',
    telefone: '(21) 98888-8888'
  },
  '345678-MG': {
    nome: 'Dr. Carlos Pereira',
    oab: '345678',
    uf: 'MG',
    tipo: 'Advogado',
    email: 'carlos.pereira@exemplo.com',
    telefone: '(31) 97777-7777'
  }
}

// Função para gerar processos simulados
function gerarProcessosMock(oab: string, uf: string): MockProcesso[] {
  const processos: MockProcesso[] = [
    {
      numero_cnj: '0001234-56.2024.8.26.0100',
      titulo: 'Ação de Cobrança - Contrato de Prestação de Serviços',
      cliente: 'Tech Solutions Ltda',
      tipo_cliente: 'AUTOR',
      valor_causa: 150000,
      data_inicio: '2024-03-15',
      tribunal: 'TJSP - Tribunal de Justiça de São Paulo',
      classe: 'Procedimento Comum Cível',
      assunto: 'Inadimplemento',
      status: 'Em andamento',
      ultima_movimentacao: 'Audiência de conciliação designada para 15/10/2024',
      partes: {
        autores: [{ 
          nome: 'Tech Solutions Ltda', 
          cpf_cnpj: '12.345.678/0001-90',
          tipo_pessoa: 'JURIDICA'
        }],
        reus: [{ 
          nome: 'Empresa Devedora S.A.', 
          cpf_cnpj: '98.765.432/0001-10',
          tipo_pessoa: 'JURIDICA'
        }],
        advogados: [{ 
          nome: mockAdvogados[`${oab}-${uf}`]?.nome || 'Advogado',
          oab: `${oab}/${uf}`
        }]
      }
    },
    {
      numero_cnj: '0002345-67.2024.8.26.0001',
      titulo: 'Reclamação Trabalhista - Verbas Rescisórias',
      cliente: 'José da Silva',
      tipo_cliente: 'AUTOR',
      valor_causa: 45000,
      data_inicio: '2024-04-10',
      tribunal: 'TRT 2ª Região - São Paulo',
      classe: 'Reclamação Trabalhista',
      assunto: 'Verbas Rescisórias',
      status: 'Em andamento',
      ultima_movimentacao: 'Contestação protocolada. Aguardando réplica.',
      partes: {
        autores: [{ 
          nome: 'José da Silva', 
          cpf_cnpj: '123.456.789-00',
          tipo_pessoa: 'FISICA'
        }],
        reus: [{ 
          nome: 'Empresa Empregadora Ltda', 
          cpf_cnpj: '11.222.333/0001-44',
          tipo_pessoa: 'JURIDICA'
        }],
        advogados: [{ 
          nome: mockAdvogados[`${oab}-${uf}`]?.nome || 'Advogado',
          oab: `${oab}/${uf}`
        }]
      }
    },
    {
      numero_cnj: '0003456-78.2023.8.26.0100',
      titulo: 'Mandado de Segurança - Questão Tributária',
      cliente: 'Importadora ABC Ltda',
      tipo_cliente: 'AUTOR',
      valor_causa: 500000,
      data_inicio: '2023-11-20',
      tribunal: 'TJSP - Tribunal de Justiça de São Paulo',
      classe: 'Mandado de Segurança Cível',
      assunto: 'ICMS - Imposto sobre Circulação de Mercadorias',
      status: 'Sentença favorável',
      ultima_movimentacao: 'Sentença publicada. Prazo para recurso.',
      partes: {
        autores: [{ 
          nome: 'Importadora ABC Ltda', 
          cpf_cnpj: '55.666.777/0001-88',
          tipo_pessoa: 'JURIDICA'
        }],
        reus: [{ 
          nome: 'Fazenda Pública do Estado de São Paulo', 
          tipo_pessoa: 'JURIDICA'
        }],
        advogados: [{ 
          nome: mockAdvogados[`${oab}-${uf}`]?.nome || 'Advogado',
          oab: `${oab}/${uf}`
        }]
      }
    },
    {
      numero_cnj: '0004567-89.2024.8.26.0002',
      titulo: 'Divórcio Consensual',
      cliente: 'Maria Aparecida Santos',
      tipo_cliente: 'AUTOR',
      valor_causa: 10000,
      data_inicio: '2024-06-01',
      tribunal: 'TJSP - Tribunal de Justiça de São Paulo',
      classe: 'Divórcio Consensual',
      assunto: 'Dissolução de União',
      status: 'Aguardando homologação',
      ultima_movimentacao: 'Acordo juntado aos autos. Aguardando sentença.',
      partes: {
        autores: [{ 
          nome: 'Maria Aparecida Santos', 
          cpf_cnpj: '987.654.321-00',
          tipo_pessoa: 'FISICA'
        }],
        reus: [{ 
          nome: 'João Carlos Santos', 
          cpf_cnpj: '876.543.210-00',
          tipo_pessoa: 'FISICA'
        }],
        advogados: [{ 
          nome: mockAdvogados[`${oab}-${uf}`]?.nome || 'Advogado',
          oab: `${oab}/${uf}`
        }]
      }
    },
    {
      numero_cnj: '0005678-90.2024.8.26.0003',
      titulo: 'Ação de Despejo por Falta de Pagamento',
      cliente: 'Imobiliária Central Ltda',
      tipo_cliente: 'AUTOR',
      valor_causa: 24000,
      data_inicio: '2024-05-15',
      tribunal: 'TJSP - Tribunal de Justiça de São Paulo',
      classe: 'Despejo por Falta de Pagamento',
      assunto: 'Locação de Imóvel',
      status: 'Em andamento',
      ultima_movimentacao: 'Citação realizada. Prazo para defesa.',
      partes: {
        autores: [{ 
          nome: 'Imobiliária Central Ltda', 
          cpf_cnpj: '99.888.777/0001-66',
          tipo_pessoa: 'JURIDICA'
        }],
        reus: [{ 
          nome: 'Pedro Henrique Alves', 
          cpf_cnpj: '111.222.333-44',
          tipo_pessoa: 'FISICA'
        }],
        advogados: [{ 
          nome: mockAdvogados[`${oab}-${uf}`]?.nome || 'Advogado',
          oab: `${oab}/${uf}`
        }]
      }
    }
  ]

  // Retorna entre 3 e 5 processos aleatoriamente
  const numProcessos = Math.floor(Math.random() * 3) + 3
  return processos.slice(0, numProcessos)
}

// Função para extrair clientes únicos dos processos
function extrairClientesMock(processos: MockProcesso[]): MockCliente[] {
  const clientesMap = new Map<string, MockCliente>()
  
  processos.forEach(processo => {
    const partes = processo.tipo_cliente === 'AUTOR' 
      ? processo.partes?.autores 
      : processo.partes?.reus
    
    if (partes && partes.length > 0) {
      const parte = partes[0]
      if (!clientesMap.has(parte.nome)) {
        clientesMap.set(parte.nome, {
          nome: parte.nome,
          cpf_cnpj: parte.cpf_cnpj,
          tipo_pessoa: (parte.tipo_pessoa as 'FISICA' | 'JURIDICA') || 'FISICA',
          processos: [processo.numero_cnj],
          email: `${parte.nome.toLowerCase().replace(/\s+/g, '.')}@exemplo.com`,
          telefone: parte.tipo_pessoa === 'JURIDICA' ? '(11) 3333-3333' : '(11) 99999-9999'
        })
      } else {
        const cliente = clientesMap.get(parte.nome)!
        cliente.processos.push(processo.numero_cnj)
      }
    }
  })
  
  return Array.from(clientesMap.values())
}

/**
 * Busca dados simulados de advogado e processos
 */
export async function buscarDadosMock(oab: string, uf: string): Promise<{
  advogado: MockAdvogado | null
  processos: MockProcesso[]
  clientes: MockCliente[]
}> {
  // Simula delay de API
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Verifica se o advogado existe no mock
  const chaveAdvogado = `${oab}-${uf}`
  let advogado = mockAdvogados[chaveAdvogado]
  
  // Se não existir, cria um advogado genérico
  if (!advogado) {
    advogado = {
      nome: `Dr(a). Advogado(a) - OAB ${oab}/${uf}`,
      oab: oab,
      uf: uf,
      tipo: 'Advogado',
      email: `advogado.${oab}@exemplo.com`,
      telefone: '(11) 99999-0000'
    }
  }
  
  // Gera processos simulados
  const processos = gerarProcessosMock(oab, uf)
  
  // Extrai clientes dos processos
  const clientes = extrairClientesMock(processos)
  
  return {
    advogado,
    processos,
    clientes
  }
}

/**
 * Simula análise de estilo de escrita do escritório
 */
export async function analisarEstiloEscritorio(processos: MockProcesso[]): Promise<{
  padrao_timbre: string
  estilo_escrita: string
  formatacao_preferida: string
  vocabulario_comum: string[]
}> {
  // Simula delay de processamento
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    padrao_timbre: 'Formal com cabeçalho institucional',
    estilo_escrita: 'Técnico-jurídico com clareza e objetividade',
    formatacao_preferida: 'Parágrafos numerados, citações em itálico, destaques em negrito',
    vocabulario_comum: [
      'Excelentíssimo',
      'Colenda',
      'Data venia',
      'In casu',
      'Ex positis',
      'Nestes termos, pede deferimento'
    ]
  }
}

/**
 * Gera demonstração de peça processual
 */
export async function gerarDemonstracaoPeca(tipo: 'resumo' | 'ia' | 'especialista', processo?: MockProcesso): Promise<string> {
  // Simula delay de geração
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  if (tipo === 'resumo' && processo) {
    return `
## Resumo do Processo ${processo.numero_cnj}

**Título:** ${processo.titulo}
**Cliente:** ${processo.cliente} (${processo.tipo_cliente})
**Valor da Causa:** R$ ${processo.valor_causa?.toLocaleString('pt-BR')}
**Status:** ${processo.status}

### Última Movimentação
${processo.ultima_movimentacao}

### Recomendações
1. Acompanhar prazo processual
2. Preparar documentação complementar
3. Agendar reunião com cliente para alinhamento
    `
  }
  
  if (tipo === 'ia') {
    return `
## Petição Inicial Gerada por IA

**EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA ___ VARA CÍVEL DA COMARCA DE SÃO PAULO/SP**

[CLIENTE], já qualificado nos autos, por seu advogado que esta subscreve, vem respeitosamente à presença de Vossa Excelência propor a presente

**AÇÃO DE COBRANÇA**

Em face de [RÉU], pelos fatos e fundamentos que passa a expor:

### I - DOS FATOS
O autor celebrou com o réu contrato de prestação de serviços...

### II - DO DIREITO
Aplica-se ao caso o disposto no artigo 422 do Código Civil...

### III - DO PEDIDO
Ante o exposto, requer...

Termos em que,
Pede deferimento.
São Paulo, ${new Date().toLocaleDateString('pt-BR')}
    `
  }
  
  return 'Demonstração do tipo especialista será implementada em breve.'
}