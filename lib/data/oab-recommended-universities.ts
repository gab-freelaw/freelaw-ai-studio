/**
 * Lista oficial das universidades recomendadas pela OAB
 * Fonte: https://www.oab.org.br/servicos/oabrecomenda
 * Atualizada em: Janeiro 2025
 */

export interface OABUniversity {
  id: string
  name: string
  city: string
  state: string
  uf: string
  category: 'federal' | 'estadual' | 'particular' | 'municipal'
  isRecommended: boolean
}

export const OAB_RECOMMENDED_UNIVERSITIES: OABUniversity[] = [
  // ACRE (AC)
  {
    id: 'ufac-rio-branco',
    name: 'Universidade Federal do Acre',
    city: 'Rio Branco',
    state: 'Acre',
    uf: 'AC',
    category: 'federal',
    isRecommended: true
  },

  // ALAGOAS (AL)
  {
    id: 'uneal-arapiraca',
    name: 'Universidade Estadual de Alagoas',
    city: 'Arapiraca',
    state: 'Alagoas',
    uf: 'AL',
    category: 'estadual',
    isRecommended: true
  },
  {
    id: 'ufal-maceio',
    name: 'Universidade Federal de Alagoas',
    city: 'Maceió',
    state: 'Alagoas',
    uf: 'AL',
    category: 'federal',
    isRecommended: true
  },

  // AMAZONAS (AM)
  {
    id: 'uea-manaus',
    name: 'Universidade do Estado do Amazonas',
    city: 'Manaus',
    state: 'Amazonas',
    uf: 'AM',
    category: 'estadual',
    isRecommended: true
  },
  {
    id: 'ufam-manaus',
    name: 'Universidade Federal do Amazonas',
    city: 'Manaus',
    state: 'Amazonas',
    uf: 'AM',
    category: 'federal',
    isRecommended: true
  },

  // AMAPÁ (AP)
  {
    id: 'unifap-macapa',
    name: 'Universidade Federal do Amapá',
    city: 'Macapá',
    state: 'Amapá',
    uf: 'AP',
    category: 'federal',
    isRecommended: true
  },

  // BAHIA (BA)
  {
    id: 'nobre-feira-santana',
    name: 'Centro Universitário Nobre de Feira de Santana',
    city: 'Feira de Santana',
    state: 'Bahia',
    uf: 'BA',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'baiana-salvador',
    name: 'Faculdade Baiana de Direito e Gestão',
    city: 'Salvador',
    state: 'Bahia',
    uf: 'BA',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'fesf-feira-santana',
    name: 'Faculdade de Ensino Superior da Cidade de Feira de Santana',
    city: 'Feira de Santana',
    state: 'Bahia',
    uf: 'BA',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'uneb-brumado',
    name: 'Universidade do Estado da Bahia',
    city: 'Brumado',
    state: 'Bahia',
    uf: 'BA',
    category: 'estadual',
    isRecommended: true
  },
  {
    id: 'uneb-camacari',
    name: 'Universidade do Estado da Bahia',
    city: 'Camaçari',
    state: 'Bahia',
    uf: 'BA',
    category: 'estadual',
    isRecommended: true
  },
  {
    id: 'uneb-itaberaba',
    name: 'Universidade do Estado da Bahia',
    city: 'Itaberaba',
    state: 'Bahia',
    uf: 'BA',
    category: 'estadual',
    isRecommended: true
  },
  {
    id: 'uneb-jacobina',
    name: 'Universidade do Estado da Bahia',
    city: 'Jacobina',
    state: 'Bahia',
    uf: 'BA',
    category: 'estadual',
    isRecommended: true
  },
  {
    id: 'ufba-salvador',
    name: 'Universidade Federal da Bahia',
    city: 'Salvador',
    state: 'Bahia',
    uf: 'BA',
    category: 'federal',
    isRecommended: true
  },

  // CEARÁ (CE)
  {
    id: 'ufc-fortaleza',
    name: 'Universidade Federal do Ceará',
    city: 'Fortaleza',
    state: 'Ceará',
    uf: 'CE',
    category: 'federal',
    isRecommended: true
  },

  // DISTRITO FEDERAL (DF)
  {
    id: 'ceub-brasilia',
    name: 'Centro de Ensino Unificado de Brasília',
    city: 'Brasília',
    state: 'Distrito Federal',
    uf: 'DF',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'unb-brasilia',
    name: 'Universidade de Brasília',
    city: 'Brasília',
    state: 'Distrito Federal',
    uf: 'DF',
    category: 'federal',
    isRecommended: true
  },

  // ESPÍRITO SANTO (ES)
  {
    id: 'ufes-vitoria',
    name: 'Universidade Federal do Espírito Santo',
    city: 'Vitória',
    state: 'Espírito Santo',
    uf: 'ES',
    category: 'federal',
    isRecommended: true
  },

  // MARANHÃO (MA)
  {
    id: 'ufma-sao-luis',
    name: 'Universidade Federal do Maranhão',
    city: 'São Luís',
    state: 'Maranhão',
    uf: 'MA',
    category: 'federal',
    isRecommended: true
  },

  // MINAS GERAIS (MG)
  {
    id: 'ufmg-belo-horizonte',
    name: 'Universidade Federal de Minas Gerais',
    city: 'Belo Horizonte',
    state: 'Minas Gerais',
    uf: 'MG',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'ufjf-juiz-fora',
    name: 'Universidade Federal de Juiz de Fora',
    city: 'Juiz de Fora',
    state: 'Minas Gerais',
    uf: 'MG',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'ufu-uberlandia',
    name: 'Universidade Federal de Uberlândia',
    city: 'Uberlândia',
    state: 'Minas Gerais',
    uf: 'MG',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'ufv-vicosa',
    name: 'Universidade Federal de Viçosa',
    city: 'Viçosa',
    state: 'Minas Gerais',
    uf: 'MG',
    category: 'federal',
    isRecommended: true
  },

  // MATO GROSSO DO SUL (MS)
  {
    id: 'ucdb-campo-grande',
    name: 'Universidade Católica Dom Bosco',
    city: 'Campo Grande',
    state: 'Mato Grosso do Sul',
    uf: 'MS',
    category: 'particular',
    isRecommended: true
  },

  // MATO GROSSO (MT)
  {
    id: 'ufmt-cuiaba',
    name: 'Universidade Federal de Mato Grosso',
    city: 'Cuiabá',
    state: 'Mato Grosso',
    uf: 'MT',
    category: 'federal',
    isRecommended: true
  },

  // PARÁ (PA)
  {
    id: 'ufpa-belem',
    name: 'Universidade Federal do Pará',
    city: 'Belém',
    state: 'Pará',
    uf: 'PA',
    category: 'federal',
    isRecommended: true
  },

  // PARAÍBA (PB)
  {
    id: 'unipe-joao-pessoa',
    name: 'Centro Universitário de João Pessoa',
    city: 'João Pessoa',
    state: 'Paraíba',
    uf: 'PB',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'ufpb-joao-pessoa',
    name: 'Universidade Federal da Paraíba',
    city: 'João Pessoa',
    state: 'Paraíba',
    uf: 'PB',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'ufpb-campina-grande',
    name: 'Universidade Federal da Paraíba',
    city: 'Campina Grande',
    state: 'Paraíba',
    uf: 'PB',
    category: 'federal',
    isRecommended: true
  },

  // PERNAMBUCO (PE)
  {
    id: 'ufpe-recife',
    name: 'Universidade Federal de Pernambuco',
    city: 'Recife',
    state: 'Pernambuco',
    uf: 'PE',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'unicap-recife',
    name: 'Universidade Católica de Pernambuco',
    city: 'Recife',
    state: 'Pernambuco',
    uf: 'PE',
    category: 'particular',
    isRecommended: true
  },

  // PIAUÍ (PI)
  {
    id: 'ufpi-teresina',
    name: 'Universidade Federal do Piauí',
    city: 'Teresina',
    state: 'Piauí',
    uf: 'PI',
    category: 'federal',
    isRecommended: true
  },

  // PARANÁ (PR)
  {
    id: 'ufpr-curitiba',
    name: 'Universidade Federal do Paraná',
    city: 'Curitiba',
    state: 'Paraná',
    uf: 'PR',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'fdc-curitiba',
    name: 'Faculdade de Direito de Curitiba',
    city: 'Curitiba',
    state: 'Paraná',
    uf: 'PR',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'puc-curitiba',
    name: 'Pontifícia Universidade Católica de Curitiba',
    city: 'Curitiba',
    state: 'Paraná',
    uf: 'PR',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'uem-maringa',
    name: 'Universidade Estadual de Maringá',
    city: 'Maringá',
    state: 'Paraná',
    uf: 'PR',
    category: 'estadual',
    isRecommended: true
  },
  {
    id: 'uel-londrina',
    name: 'Universidade Estadual de Londrina',
    city: 'Londrina',
    state: 'Paraná',
    uf: 'PR',
    category: 'estadual',
    isRecommended: true
  },
  {
    id: 'fedr-jacarezinho',
    name: 'Faculdade Estadual de Direito do Norte Pioneiro',
    city: 'Jacarezinho',
    state: 'Paraná',
    uf: 'PR',
    category: 'estadual',
    isRecommended: true
  },

  // RIO DE JANEIRO (RJ)
  {
    id: 'unirio-rio-janeiro',
    name: 'Universidade do Rio de Janeiro',
    city: 'Rio de Janeiro',
    state: 'Rio de Janeiro',
    uf: 'RJ',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'uerj-rio-janeiro',
    name: 'Universidade Estadual do Rio de Janeiro',
    city: 'Rio de Janeiro',
    state: 'Rio de Janeiro',
    uf: 'RJ',
    category: 'estadual',
    isRecommended: true
  },
  {
    id: 'ufrj-rio-janeiro',
    name: 'Universidade Federal do Rio de Janeiro',
    city: 'Rio de Janeiro',
    state: 'Rio de Janeiro',
    uf: 'RJ',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'puc-rio-janeiro',
    name: 'Pontifícia Universidade Católica do Rio de Janeiro',
    city: 'Rio de Janeiro',
    state: 'Rio de Janeiro',
    uf: 'RJ',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'uff-niteroi',
    name: 'Universidade Federal Fluminense',
    city: 'Niterói',
    state: 'Rio de Janeiro',
    uf: 'RJ',
    category: 'federal',
    isRecommended: true
  },

  // RIO GRANDE DO NORTE (RN)
  {
    id: 'ufrn-natal',
    name: 'Universidade Federal do Rio Grande do Norte',
    city: 'Natal',
    state: 'Rio Grande do Norte',
    uf: 'RN',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'unp-natal',
    name: 'Universidade Potiguar',
    city: 'Natal',
    state: 'Rio Grande do Norte',
    uf: 'RN',
    category: 'particular',
    isRecommended: true
  },

  // RONDÔNIA (RO)
  {
    id: 'unir-porto-velho',
    name: 'Universidade Federal de Rondônia',
    city: 'Porto Velho',
    state: 'Rondônia',
    uf: 'RO',
    category: 'federal',
    isRecommended: true
  },

  // RIO GRANDE DO SUL (RS)
  {
    id: 'ufrgs-porto-alegre',
    name: 'Universidade Federal do Rio Grande do Sul',
    city: 'Porto Alegre',
    state: 'Rio Grande do Sul',
    uf: 'RS',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'ufsm-santa-maria',
    name: 'Universidade Federal de Santa Maria',
    city: 'Santa Maria',
    state: 'Rio Grande do Sul',
    uf: 'RS',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'ufpel-pelotas',
    name: 'Fundação Universidade Federal de Pelotas',
    city: 'Pelotas',
    state: 'Rio Grande do Sul',
    uf: 'RS',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'puc-porto-alegre',
    name: 'Pontifícia Universidade Católica de Porto Alegre',
    city: 'Porto Alegre',
    state: 'Rio Grande do Sul',
    uf: 'RS',
    category: 'particular',
    isRecommended: true
  },

  // SANTA CATARINA (SC)
  {
    id: 'ufsc-florianopolis',
    name: 'Universidade Federal de Santa Catarina',
    city: 'Florianópolis',
    state: 'Santa Catarina',
    uf: 'SC',
    category: 'federal',
    isRecommended: true
  },
  {
    id: 'unoesc-videira',
    name: 'Universidade do Oeste de Santa Catarina',
    city: 'Videira',
    state: 'Santa Catarina',
    uf: 'SC',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'uniplac-lages',
    name: 'Universidade do Planalto Catarinense',
    city: 'Lages',
    state: 'Santa Catarina',
    uf: 'SC',
    category: 'particular',
    isRecommended: true
  },

  // SERGIPE (SE)
  {
    id: 'ufs-sao-cristovao',
    name: 'Universidade Federal de Sergipe',
    city: 'São Cristóvão',
    state: 'Sergipe',
    uf: 'SE',
    category: 'federal',
    isRecommended: true
  },

  // SÃO PAULO (SP)
  {
    id: 'unisal-lorena',
    name: 'Centro Universitário Salesiano de Lorena',
    city: 'Lorena',
    state: 'São Paulo',
    uf: 'SP',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'fdf-franca',
    name: 'Faculdade de Direito de Franca',
    city: 'Franca',
    state: 'São Paulo',
    uf: 'SP',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'fdm-marilia',
    name: 'Faculdade de Direito de Marília',
    city: 'Marília',
    state: 'São Paulo',
    uf: 'SP',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'fdsbc-sao-bernardo',
    name: 'Faculdade de Direito de São Bernardo do Campo',
    city: 'São Bernardo do Campo',
    state: 'São Paulo',
    uf: 'SP',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'fds-sorocaba',
    name: 'Faculdade de Direito de Sorocaba',
    city: 'Sorocaba',
    state: 'São Paulo',
    uf: 'SP',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'toledo-presidente-prudente',
    name: 'Faculdades Integradas Antonio Eufrásio de Toledo de Presidente Prudente',
    city: 'Presidente Prudente',
    state: 'São Paulo',
    uf: 'SP',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'puc-campinas',
    name: 'Pontifícia Universidade Católica de Campinas',
    city: 'Campinas',
    state: 'São Paulo',
    uf: 'SP',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'puc-sao-paulo',
    name: 'Pontifícia Universidade Católica de São Paulo',
    city: 'São Paulo',
    state: 'São Paulo',
    uf: 'SP',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'unisantos-santos',
    name: 'Universidade Católica de Santos',
    city: 'Santos',
    state: 'São Paulo',
    uf: 'SP',
    category: 'particular',
    isRecommended: true
  },
  {
    id: 'usp-sao-paulo',
    name: 'Universidade de São Paulo',
    city: 'São Paulo',
    state: 'São Paulo',
    uf: 'SP',
    category: 'estadual',
    isRecommended: true
  },
  {
    id: 'unesp-franca',
    name: 'Universidade Estadual Paulista Júlio de Mesquita Filho',
    city: 'Franca',
    state: 'São Paulo',
    uf: 'SP',
    category: 'estadual',
    isRecommended: true
  },
  {
    id: 'mackenzie-sao-paulo',
    name: 'Universidade Presbiteriana Mackenzie',
    city: 'São Paulo',
    state: 'São Paulo',
    uf: 'SP',
    category: 'particular',
    isRecommended: true
  }
]

/**
 * Função para buscar universidades por texto
 */
export function searchUniversities(query: string): OABUniversity[] {
  if (!query || query.length < 2) return []
  
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  return OAB_RECOMMENDED_UNIVERSITIES.filter(university => {
    const normalizedName = university.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const normalizedCity = university.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const normalizedState = university.state.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    
    return normalizedName.includes(normalizedQuery) ||
           normalizedCity.includes(normalizedQuery) ||
           normalizedState.includes(normalizedQuery) ||
           university.uf.toLowerCase().includes(normalizedQuery)
  }).slice(0, 10) // Limitar a 10 resultados
}

/**
 * Função para verificar se uma universidade é recomendada pela OAB
 */
export function isUniversityRecommended(universityName: string): boolean {
  const normalizedQuery = universityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  return OAB_RECOMMENDED_UNIVERSITIES.some(university => {
    const normalizedName = university.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)
  })
}

/**
 * Função para obter universidade por ID
 */
export function getUniversityById(id: string): OABUniversity | undefined {
  return OAB_RECOMMENDED_UNIVERSITIES.find(university => university.id === id)
}

/**
 * Função para formatar nome completo da universidade
 */
export function formatUniversityFullName(university: OABUniversity): string {
  return `${university.name} - ${university.city}/${university.uf}`
}
