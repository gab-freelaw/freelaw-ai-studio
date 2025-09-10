import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const oab = searchParams.get('oab') || '183619'
  const uf = searchParams.get('uf') || 'MG'
  
  const ESCAVADOR_TOKEN = process.env.ESCAVADOR_API_TOKEN
  
  // Tentar buscar processos por diferentes nomes possíveis
  const nomesParaTeste = [
    'Gabriel Magalhães',
    'Gabriel Ribeiro',
    'Gabriel França',
    'Magalhães'
  ]
  
  const resultados = []
  
  for (const nome of nomesParaTeste) {
    try {
      const response = await fetch(
        `https://api.escavador.com/api/v2/envolvido/processos?nome=${encodeURIComponent(nome)}&limite=5`,
        {
          headers: {
            'Authorization': `Bearer ${ESCAVADOR_TOKEN}`,
            'Accept': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        const total = data.paginator?.total || 0
        
        // Se encontrou processos, verificar se há advogados com a OAB correspondente
        if (total > 0 && data.items) {
          for (const processo of data.items) {
            const advogados = processo.fontes?.[0]?.envolvidos?.filter(
              (e: any) => (e.tipo === 'Advogado' || e.tipo === 'ADVOGADO')
            ) || []
            
            for (const adv of advogados) {
              if (adv.nome && adv.nome.toLowerCase().includes(nome.toLowerCase())) {
                resultados.push({
                  nomeBuscado: nome,
                  nomeEncontrado: adv.nome,
                  totalProcessos: total,
                  processo: processo.numero_cnj
                })
              }
            }
          }
        }
        
        resultados.push({
          nomeBuscado: nome,
          totalProcessos: total,
          sucesso: total > 0
        })
      }
    } catch (error) {
      resultados.push({
        nomeBuscado: nome,
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }
  
  return NextResponse.json({
    oab,
    uf,
    resultados,
    recomendacao: resultados.find(r => r.totalProcessos > 0)?.nomeBuscado || 'Não encontrado'
  })
}