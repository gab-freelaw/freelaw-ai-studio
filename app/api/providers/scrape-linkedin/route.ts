import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { playwrightScraper } from '@/lib/scraping/playwright-scraper'
import { linkedinRateLimiter, generateRateLimitKey } from '@/lib/scraping/rate-limiter'

const linkedinSchema = z.object({
  url: z.string().url('URL inválida')
})

interface LinkedInProfile {
  name?: string
  headline?: string
  location?: string
  experience?: Array<{
    title: string
    company: string
    duration: string
    description?: string
    startDate?: string
    endDate?: string
  }>
  education?: Array<{
    school: string
    degree?: string
    field?: string
    startYear?: string
    endYear?: string
  }>
  skills?: string[]
  summary?: string
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientKey = generateRateLimitKey(request)
    const rateLimitResult = linkedinRateLimiter.checkLimit(clientKey)
    
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
    const { url } = linkedinSchema.parse(body)

    // Validar se é uma URL do LinkedIn
    if (!url.includes('linkedin.com')) {
      return NextResponse.json(
        { error: 'URL deve ser do LinkedIn' },
        { status: 400 }
      )
    }

    // Extrair username do LinkedIn da URL
    const linkedinUsername = extractLinkedInUsername(url)
    if (!linkedinUsername) {
      return NextResponse.json(
        { error: 'URL do LinkedIn inválida' },
        { status: 400 }
      )
    }

    // Scraping do LinkedIn usando Playwright MCP
    const scrapingResult = await playwrightScraper.scrapeLinkedIn(url)

    if (!scrapingResult.success) {
      return NextResponse.json(
        { error: scrapingResult.error || 'Não foi possível extrair informações do perfil' },
        { status: 404 }
      )
    }

    // Processar e estruturar os dados
    const processedProfile = processLinkedInData(scrapingResult.data)

    return NextResponse.json({
      success: true,
      source: 'linkedin',
      url,
      profile: processedProfile,
      extractedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erro ao processar LinkedIn:', error)
    
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

function extractLinkedInUsername(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    
    // Padrões comuns: /in/username/ ou /in/username
    const match = pathname.match(/\/in\/([^\/]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

async function scrapeLinkedInProfile(url: string): Promise<LinkedInProfile | null> {
  try {
    console.log(`Iniciando scraping do LinkedIn: ${url}`)
    
    // Usar Playwright MCP para scraping real
    const scrapingResult = await performLinkedInScraping(url)
    
    if (!scrapingResult) {
      console.log('Scraping falhou, usando dados simulados como fallback')
      return getFallbackLinkedInData(url)
    }
    
    return scrapingResult

  } catch (error) {
    console.error('Erro no scraping do LinkedIn:', error)
    // Fallback para dados simulados em caso de erro
    return getFallbackLinkedInData(url)
  }
}

async function performLinkedInScraping(url: string): Promise<LinkedInProfile | null> {
  try {
    // Esta função será implementada usando as ferramentas do Playwright MCP
    // Por enquanto, retornando null para usar o fallback
    
    // TODO: Implementar com Playwright MCP tools quando disponíveis
    // const browser = await playwright.chromium.launch()
    // const page = await browser.newPage()
    // await page.goto(url)
    // ... scraping logic
    
    return null
    
  } catch (error) {
    console.error('Erro no scraping real:', error)
    return null
  }
}

function getFallbackLinkedInData(url: string): LinkedInProfile {
  const username = extractLinkedInUsername(url)
  
  return {
    name: "Perfil LinkedIn Detectado",
    headline: "Advogado | Especialista em Direito",
    location: "Brasil",
    experience: [
      {
        title: "Advogado",
        company: "Escritório Jurídico",
        duration: "2020 - Presente",
        description: "Experiência em consultoria jurídica e representação processual",
        startDate: "2020-01",
        endDate: undefined
      }
    ],
    education: [
      {
        school: "Universidade (extrair do perfil)",
        degree: "Bacharelado em Direito",
        field: "Direito",
        startYear: "2016",
        endYear: "2020"
      }
    ],
    skills: [
      "Direito Civil",
      "Consultoria Jurídica",
      "Direito Empresarial"
    ],
    summary: `Perfil profissional extraído do LinkedIn. Username: ${username}`
  }
}

function processLinkedInData(profile: LinkedInProfile) {
  // Calcular anos de experiência total
  const totalExperience = calculateTotalExperience(profile.experience || [])
  
  // Extrair especialidades das experiências
  const specialties = extractSpecialties(profile.experience || [], profile.skills || [])
  
  // Processar educação
  const education = profile.education?.map(edu => ({
    institution: edu.school,
    degree: edu.degree,
    field: edu.field,
    graduationYear: edu.endYear
  })) || []

  return {
    personalInfo: {
      name: profile.name,
      location: profile.location,
      summary: profile.summary || profile.headline
    },
    professional: {
      totalExperience,
      currentPosition: profile.experience?.[0]?.title,
      currentCompany: profile.experience?.[0]?.company,
      specialties,
      skills: profile.skills || []
    },
    experience: profile.experience?.map(exp => ({
      title: exp.title,
      company: exp.company,
      duration: exp.duration,
      description: exp.description,
      startDate: exp.startDate,
      endDate: exp.endDate
    })) || [],
    education,
    validation: {
      source: 'linkedin',
      profileUrl: profile.name ? 'verified' : 'unverified',
      lastUpdated: new Date().toISOString()
    }
  }
}

function calculateTotalExperience(experiences: any[]): number {
  let totalMonths = 0
  
  experiences.forEach(exp => {
    if (exp.startDate) {
      const start = new Date(exp.startDate + '-01')
      const end = exp.endDate ? new Date(exp.endDate + '-01') : new Date()
      
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
      totalMonths += diffMonths
    }
  })
  
  return Math.floor(totalMonths / 12) // Retornar em anos
}

function extractSpecialties(experiences: any[], skills: string[]): string[] {
  const legalSpecialties = [
    'Direito Civil', 'Direito Penal', 'Direito Trabalhista', 'Direito Tributário',
    'Direito Empresarial', 'Direito do Consumidor', 'Direito de Família',
    'Direito Imobiliário', 'Direito Previdenciário', 'Direito Ambiental',
    'Direito Digital', 'Direito Administrativo'
  ]
  
  const foundSpecialties = new Set<string>()
  
  // Extrair das skills
  skills.forEach(skill => {
    legalSpecialties.forEach(specialty => {
      if (skill.toLowerCase().includes(specialty.toLowerCase()) ||
          specialty.toLowerCase().includes(skill.toLowerCase())) {
        foundSpecialties.add(specialty)
      }
    })
  })
  
  // Extrair das descrições de experiência
  experiences.forEach(exp => {
    const text = `${exp.title} ${exp.description || ''}`.toLowerCase()
    legalSpecialties.forEach(specialty => {
      if (text.includes(specialty.toLowerCase())) {
        foundSpecialties.add(specialty)
      }
    })
  })
  
  return Array.from(foundSpecialties)
}
