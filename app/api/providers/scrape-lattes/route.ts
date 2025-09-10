import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { playwrightScraper } from '@/lib/scraping/playwright-scraper'
import { lattesRateLimiter, generateRateLimitKey } from '@/lib/scraping/rate-limiter'

const lattesSchema = z.object({
  url: z.string().url('URL inválida')
})

interface LattesProfile {
  name?: string
  summary?: string
  education?: Array<{
    degree: string
    institution: string
    year?: string
    area?: string
  }>
  professionalExperience?: Array<{
    position: string
    institution: string
    period: string
    description?: string
  }>
  publications?: Array<{
    title: string
    year: string
    type: 'article' | 'book' | 'chapter' | 'conference'
    venue?: string
  }>
  awards?: Array<{
    title: string
    year: string
    institution: string
  }>
  languages?: string[]
  researchAreas?: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientKey = generateRateLimitKey(request)
    const rateLimitResult = lattesRateLimiter.checkLimit(clientKey)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitResult.error,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
          }
        }
      )
    }

    const body = await request.json()
    const { url } = lattesSchema.parse(body)

    // Validar se é uma URL do Lattes
    if (!url.includes('lattes.cnpq.br')) {
      return NextResponse.json(
        { error: 'URL deve ser do Currículo Lattes' },
        { status: 400 }
      )
    }

    // Extrair ID do Lattes da URL
    const lattesId = extractLattesId(url)
    if (!lattesId) {
      return NextResponse.json(
        { error: 'URL do Lattes inválida' },
        { status: 400 }
      )
    }

    // Scraping do Lattes usando Playwright MCP
    const scrapingResult = await playwrightScraper.scrapeLattes(url)

    if (!scrapingResult.success) {
      return NextResponse.json(
        { error: scrapingResult.error || 'Não foi possível extrair informações do currículo' },
        { status: 404 }
      )
    }

    // Processar e estruturar os dados
    const processedProfile = processLattesData(scrapingResult.data)

    return NextResponse.json({
      success: true,
      source: 'lattes',
      url,
      lattesId,
      profile: processedProfile,
      extractedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erro ao processar Lattes:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function extractLattesId(url: string): string | null {
  try {
    // Padrões comuns do Lattes: 
    // http://lattes.cnpq.br/1234567890123456
    // http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=K1234567H8
    
    const lattesIdMatch = url.match(/lattes\.cnpq\.br\/(\d{16})/)
    if (lattesIdMatch) {
      return lattesIdMatch[1]
    }
    
    const buscaMatch = url.match(/id=([A-Z0-9]+)/)
    if (buscaMatch) {
      return buscaMatch[1]
    }
    
    return null
  } catch {
    return null
  }
}

async function scrapeLattesProfile(url: string): Promise<LattesProfile | null> {
  try {
    // IMPORTANTE: Em produção, implementar com:
    // 1. Puppeteer/Playwright para scraping real do Lattes
    // 2. Parser específico para HTML do Lattes
    // 3. Tratamento de captcha se necessário
    
    // Simulação de dados extraídos (substituir por scraping real)
    const mockProfile: LattesProfile = {
      name: "Dr. Nome do Pesquisador",
      summary: "Doutor em Direito pela USP, com experiência em pesquisa acadêmica e prática jurídica. Especialista em Direito Civil e Direito Digital.",
      education: [
        {
          degree: "Doutorado em Direito",
          institution: "Universidade de São Paulo",
          year: "2020",
          area: "Direito Civil"
        },
        {
          degree: "Mestrado em Direito",
          institution: "Universidade de São Paulo", 
          year: "2016",
          area: "Direito Privado"
        },
        {
          degree: "Bacharelado em Direito",
          institution: "Universidade de São Paulo",
          year: "2014",
          area: "Direito"
        }
      ],
      professionalExperience: [
        {
          position: "Professor Adjunto",
          institution: "Universidade Federal de São Paulo",
          period: "2020 - Atual",
          description: "Docência em Direito Civil e orientação de pesquisas"
        },
        {
          position: "Advogado",
          institution: "Escritório Próprio",
          period: "2015 - Atual", 
          description: "Consultoria jurídica e representação em processos cíveis"
        }
      ],
      publications: [
        {
          title: "Contratos Digitais no Direito Brasileiro",
          year: "2023",
          type: "article",
          venue: "Revista de Direito Civil"
        },
        {
          title: "Responsabilidade Civil na Era Digital",
          year: "2022",
          type: "book",
          venue: "Editora Saraiva"
        }
      ],
      awards: [
        {
          title: "Prêmio Jovem Pesquisador",
          year: "2021",
          institution: "CNPq"
        }
      ],
      languages: ["Português", "Inglês", "Espanhol"],
      researchAreas: ["Direito Civil", "Direito Digital", "Contratos", "Responsabilidade Civil"]
    }

    // Em produção, aqui seria o scraping real
    return mockProfile

  } catch (error) {
    console.error('Erro no scraping do Lattes:', error)
    return null
  }
}

function processLattesData(profile: LattesProfile) {
  // Calcular nível acadêmico
  const academicLevel = determineAcademicLevel(profile.education || [])
  
  // Extrair especialidades das áreas de pesquisa
  const specialties = extractLegalSpecialties(profile.researchAreas || [])
  
  // Calcular experiência profissional
  const professionalExperience = calculateProfessionalExperience(profile.professionalExperience || [])
  
  // Processar publicações por tipo
  const publicationsByType = groupPublicationsByType(profile.publications || [])

  return {
    personalInfo: {
      name: profile.name,
      summary: profile.summary,
      academicLevel
    },
    academic: {
      education: profile.education?.map(edu => ({
        degree: edu.degree,
        institution: edu.institution,
        year: edu.year,
        area: edu.area
      })) || [],
      publications: {
        total: profile.publications?.length || 0,
        byType: publicationsByType,
        recent: profile.publications?.filter(pub => 
          parseInt(pub.year) >= new Date().getFullYear() - 5
        ).length || 0
      },
      awards: profile.awards || [],
      researchAreas: profile.researchAreas || []
    },
    professional: {
      experience: profile.professionalExperience || [],
      totalExperience: professionalExperience,
      specialties,
      languages: profile.languages || []
    },
    validation: {
      source: 'lattes',
      profileUrl: 'verified',
      academicCredibility: calculateAcademicCredibility(profile),
      lastUpdated: new Date().toISOString()
    }
  }
}

function determineAcademicLevel(education: any[]): string {
  const degrees = education.map(edu => edu.degree.toLowerCase())
  
  if (degrees.some(d => d.includes('doutorado') || d.includes('phd'))) {
    return 'Doutor'
  }
  if (degrees.some(d => d.includes('mestrado') || d.includes('master'))) {
    return 'Mestre'
  }
  if (degrees.some(d => d.includes('especialização') || d.includes('pós'))) {
    return 'Especialista'
  }
  if (degrees.some(d => d.includes('bacharelado') || d.includes('graduação'))) {
    return 'Bacharel'
  }
  
  return 'Não informado'
}

function extractLegalSpecialties(researchAreas: string[]): string[] {
  const legalSpecialties = [
    'Direito Civil', 'Direito Penal', 'Direito Trabalhista', 'Direito Tributário',
    'Direito Empresarial', 'Direito do Consumidor', 'Direito de Família',
    'Direito Imobiliário', 'Direito Previdenciário', 'Direito Ambiental',
    'Direito Digital', 'Direito Administrativo', 'Direito Constitucional',
    'Direito Internacional', 'Direito Processual'
  ]
  
  const foundSpecialties = new Set<string>()
  
  researchAreas.forEach(area => {
    legalSpecialties.forEach(specialty => {
      if (area.toLowerCase().includes(specialty.toLowerCase()) ||
          specialty.toLowerCase().includes(area.toLowerCase())) {
        foundSpecialties.add(specialty)
      }
    })
  })
  
  return Array.from(foundSpecialties)
}

function calculateProfessionalExperience(experiences: any[]): number {
  // Calcular anos de experiência profissional (não acadêmica)
  const professionalExp = experiences.filter(exp => 
    !exp.position.toLowerCase().includes('professor') &&
    !exp.position.toLowerCase().includes('pesquisador')
  )
  
  let totalYears = 0
  professionalExp.forEach(exp => {
    const period = exp.period.toLowerCase()
    if (period.includes('atual') || period.includes('presente')) {
      const startYear = extractStartYear(period)
      if (startYear) {
        totalYears += new Date().getFullYear() - startYear
      }
    } else {
      const years = extractYearRange(period)
      if (years) {
        totalYears += years.end - years.start
      }
    }
  })
  
  return totalYears
}

function extractStartYear(period: string): number | null {
  const match = period.match(/(\d{4})/)
  return match ? parseInt(match[1]) : null
}

function extractYearRange(period: string): { start: number, end: number } | null {
  const matches = period.match(/(\d{4}).*?(\d{4})/)
  if (matches) {
    return {
      start: parseInt(matches[1]),
      end: parseInt(matches[2])
    }
  }
  return null
}

function groupPublicationsByType(publications: any[]) {
  const grouped = {
    articles: 0,
    books: 0,
    chapters: 0,
    conferences: 0
  }
  
  publications.forEach(pub => {
    if (pub.type in grouped) {
      grouped[pub.type as keyof typeof grouped]++
    }
  })
  
  return grouped
}

function calculateAcademicCredibility(profile: LattesProfile): 'high' | 'medium' | 'low' {
  let score = 0
  
  // Pontuação por formação
  const education = profile.education || []
  if (education.some(edu => edu.degree.toLowerCase().includes('doutorado'))) score += 3
  if (education.some(edu => edu.degree.toLowerCase().includes('mestrado'))) score += 2
  if (education.some(edu => edu.degree.toLowerCase().includes('especialização'))) score += 1
  
  // Pontuação por publicações
  const publications = profile.publications?.length || 0
  if (publications >= 10) score += 3
  else if (publications >= 5) score += 2
  else if (publications >= 1) score += 1
  
  // Pontuação por prêmios
  if ((profile.awards?.length || 0) > 0) score += 1
  
  if (score >= 6) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}
