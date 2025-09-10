import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertLawyer } from '@/lib/services/legal-data.service'

type Status = 'ATIVO' | 'SUSPENSO' | 'CANCELADO' | 'INEXISTENTE' | 'DESCONHECIDO'

export async function POST(req: Request) {
  try {
    const { oab, uf, persist } = await req.json()

    if (!oab || !uf) {
      return NextResponse.json({ error: 'OAB e UF são obrigatórios' }, { status: 400 })
    }

    const cleanOab = String(oab).replace(/\D/g, '')
    const cleanUf = String(uf).toUpperCase()
    if (!/^\d{3,8}$/.test(cleanOab)) {
      return NextResponse.json({
        valid: false,
        status: 'INEXISTENTE' as Status,
        message: 'Número de OAB inválido. Digite apenas números (3-8 dígitos).'
      }, { status: 200 })
    }

    // 1) GET homepage to capture cookies + anti-CSRF tokens
    const homeUrl = 'https://cna.oab.org.br/'
    const homeRes = await fetch(homeUrl, {
      method: 'GET',
      headers: {
        'User-Agent': defaultUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      // Avoid Next.js caching
      cache: 'no-store',
    })
    const setCookieRaw = homeRes.headers.get('set-cookie') || ''
    const html = await homeRes.text()

    // Extract the form token and header token from HTML
    const formToken = (html.match(/name=\"__RequestVerificationToken\"[^>]*value=\"([^\"]+)\"/i) || [])[1]
    const headerToken = (html.match(/var\s+TOKENHEADERVALUE\s*=\s*'([^']+)'/i) || [])[1]

    if (!formToken || !headerToken) {
      return NextResponse.json({ error: 'Não foi possível obter tokens de validação do CNA.' }, { status: 500 })
    }

    // 2) POST to /Home/Search like the site does via AJAX
    const postBody = new URLSearchParams()
    postBody.set('__RequestVerificationToken', formToken)
    postBody.set('IsMobile', 'false')
    postBody.set('NomeAdvo', '')
    postBody.set('Insc', cleanOab)
    postBody.set('Uf', cleanUf)
    postBody.set('TipoInsc', '1') // Advogado

    // Build Cookie header with name=value only
    const cookieHeader = setCookieRaw ? setCookieRaw.split(';')[0] : ''
    const searchRes = await fetch('https://cna.oab.org.br/Home/Search', {
      method: 'POST',
      headers: {
        'User-Agent': defaultUA(),
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://cna.oab.org.br',
        'Referer': 'https://cna.oab.org.br/',
        'RequestVerificationToken': headerToken,
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
      },
      body: postBody,
    })

    if (!searchRes.ok) {
      const txt = await searchRes.text().catch(() => '')
      console.error('CNA search failed:', searchRes.status, searchRes.statusText, txt.slice(0, 500))
      return NextResponse.json({ 
        error: 'Falha na consulta ao CNA.', 
        details: `Status: ${searchRes.status} - ${txt.slice(0, 500)}` 
      }, { status: 502 })
    }

    const json: any = await searchRes.json().catch(async () => {
      const txt = await searchRes.text().catch(() => '')
      console.error('Invalid JSON response from CNA:', txt.slice(0, 400))
      throw new Error(`Resposta inválida do CNA: ${txt.slice(0, 400)}`)
    })

    if (!json?.Success) {
      return NextResponse.json({ 
        error: json?.Message || 'Consulta não retornou sucesso.',
        debug: json
      }, { status: 404 })
    }

    const results: any[] = Array.isArray(json.Data) ? json.Data : []
    
    if (results.length === 0) {
      return NextResponse.json({ valid: false, status: 'INEXISTENTE' as Status })
    }

    // Prefer exact match by UF and inscription when available
    const match = results.find(r =>
      String((r.UF ?? r.SiglUf ?? '')).toUpperCase() === cleanUf &&
      (String(r.Inscricao ?? r.Insc ?? r.InscricaoStr ?? '').replace(/\D/g, '') === cleanOab)
    ) || results[0]

    const nome = match?.Nome || match?.NomeAdvo || 'Nome não informado'

    // Try to extract status from the main result first
    let status: Status = 'DESCONHECIDO'
    
    // Check various status fields that might be present
    const statusFields = [
      match?.Status,
      match?.Situacao,
      match?.StatusInscricao,
      match?.SituacaoInscricao,
      match?.Ativo,
      match?.Active
    ]
    
    for (const statusField of statusFields) {
      if (statusField) {
        const normalizedStatus = normalizeStatus(String(statusField))
        if (normalizedStatus !== 'DESCONHECIDO') {
          status = normalizedStatus
          break
        }
      }
    }
    
    // If still unknown, try to fetch detail page
    let detailRenderUrl: string | null = null
    if (status === 'DESCONHECIDO') {
      try {
        const detailLink = match?.DetailUrl || match?.Link || match?.Url || null
      if (detailLink) {
        const detailRes = await fetch(detailLink, {
          method: 'GET',
          headers: {
            'User-Agent': defaultUA(),
            ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
          }
        })
        if (detailRes.ok) {
          const detailJson: any = await detailRes.json().catch(() => null)
          // Some implementations might include a "Situacao" or "Status" field in the detail JSON
          const rawStatus: string | undefined = detailJson?.Data?.Situacao || detailJson?.Data?.Status || detailJson?.Situacao || detailJson?.Status
          if (rawStatus) {
            status = normalizeStatus(rawStatus)
          }
          // RenderDetail image URL
          const renderUrl = detailJson?.Data?.DetailUrl
          if (typeof renderUrl === 'string' && renderUrl.includes('/RenderDetail')) {
            detailRenderUrl = renderUrl
          }
        }
      }
      } catch (_) { /* ignore */ }
    }

    // If we still don't know the status, try OCR on the RenderDetail image (if OpenAI key is configured)
    if (status === 'DESCONHECIDO' && detailRenderUrl) {
      const apiKey = process.env.OPENAI_API_KEY || ''
      if (apiKey) {
        try {
          const imgRes = await fetch(`https://cna.oab.org.br${detailRenderUrl}`, {
            method: 'GET',
            headers: {
              'User-Agent': defaultUA(),
              ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
            }
          })
          if (imgRes.ok) {
            const arrayBuf = await imgRes.arrayBuffer()
            const imgBytes = new Uint8Array(arrayBuf)
            const ocrStatus = await extractStatusViaOCR(imgBytes, apiKey)
            if (ocrStatus) {
              status = ocrStatus
            }
          }
        } catch (e) {
          console.warn('Falha no OCR da ficha CNA:', e)
        }
      }
    }

    const isActive = status === 'ATIVO'

    // Optionally persist to DB for the authenticated user
    if (persist) {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await upsertLawyer({
            userId: user.id,
            name: nome,
            oab: cleanOab,
            state: cleanUf,
            active: isActive,
          })
        }
      } catch (persistErr) {
        console.warn('Falha ao persistir validação de OAB (scrape):', persistErr)
      }
    }

    return NextResponse.json({
      valid: true,
      status,
      lawyer: {
        nome,
        oab: cleanOab,
        uf: cleanUf,
        tipo: 'Principal'
      }
    })
  } catch (err: any) {
    console.error('Erro no scraping do CNA:', err)
    return NextResponse.json({ error: 'Falha ao consultar o CNA.' }, { status: 500 })
  }
}

function defaultUA(): string {
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
}

function normalizeStatus(s?: string): Status {
  if (!s) return 'DESCONHECIDO'
  const v = s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().trim()
  
  // Variações para ATIVO
  if (v.includes('ATIV') || v.includes('REGULAR') || v === 'TRUE' || v === '1' || v === 'SIM') return 'ATIVO'
  
  // Variações para SUSPENSO
  if (v.includes('SUSP') || v.includes('SUSPEND')) return 'SUSPENSO'
  
  // Variações para CANCELADO
  if (v.includes('CANCEL') || v.includes('EXCLU') || v.includes('BAIXA')) return 'CANCELADO'
  
  // Variações para INEXISTENTE
  if (v.includes('INEXIST') || v.includes('NAO ENCONTR') || v.includes('INVALID')) return 'INEXISTENTE'
  
  return 'DESCONHECIDO'
}

async function extractStatusViaOCR(imgBytes: Uint8Array, openaiKey: string): Promise<Status | null> {
  try {
    // Convert to base64 data URL
    const b64 = Buffer.from(imgBytes).toString('base64')
    const imageUrl = `data:image/png;base64,${b64}`

    const body = {
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Leia a imagem de uma ficha do CNA (OAB). Extraia apenas a situação da inscrição do advogado, respondendo exatamente uma das palavras: ATIVO, SUSPENSO, CANCELADO. Se não conseguir identificar, responda DESCONHECIDO. Não adicione outros textos.'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ]
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.warn('OpenAI OCR falhou:', res.status, txt.slice(0, 300))
      return null
    }
    const data: any = await res.json()
    const text: string = data?.choices?.[0]?.message?.content?.trim?.() || ''
    const status = normalizeStatus(text)
    return status
  } catch (e) {
    console.warn('Erro no OCR:', e)
    return null
  }
}
