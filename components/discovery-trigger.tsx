'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileSearch, AlertCircle, Loader2, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface DiscoveryTriggerProps {
  processNumbers: string[]
  officeId?: string
  onComplete?: (data: any) => void
}

export function DiscoveryTrigger({ 
  processNumbers, 
  officeId,
  onComplete 
}: DiscoveryTriggerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [topN, setTopN] = useState('10')
  const [searchCode, setSearchCode] = useState<string | null>(null)

  const estimatedCost = Number(topN) * 3.00 // R$ 3,00 per process

  const handleStartDiscovery = async () => {
    if (!officeId) {
      toast.error('Office ID não configurado')
      return
    }

    setLoading(true)
    try {
      // Register the discovery search
      const registerResponse = await fetch('/api/solucionare/discovery/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeId,
          processNumbers,
          topN: Number(topN),
          entregarPublicacoes: true,
          entregarDocIniciais: true,
        })
      })

      if (!registerResponse.ok) {
        throw new Error('Falha ao registrar pesquisa')
      }

      const registerData = await registerResponse.json()
      const code = registerData.data?.codPesquisa || registerData.data?.searchCode
      
      if (!code) {
        throw new Error('Código de pesquisa não retornado')
      }

      setSearchCode(code)
      toast.success('Pesquisa registrada! Buscando documentos...')

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Get results
      const resultsResponse = await fetch('/api/solucionare/discovery/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchCode: code })
      })

      if (!resultsResponse.ok) {
        throw new Error('Falha ao buscar resultados')
      }

      const resultsData = await resultsResponse.json()
      
      toast.success(`Documentos encontrados! ${resultsData.docs?.length || 0} documentos recuperados.`)
      
      if (onComplete) {
        onComplete(resultsData)
      }

      setOpen(false)
    } catch (error) {
      console.error('Discovery error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar documentos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSearch className="h-4 w-4" />
          Buscar Documentos Iniciais
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar Documentos Iniciais (DiscoveryFull)</DialogTitle>
          <DialogDescription>
            Recupere petições iniciais e documentos dos processos selecionados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Quantidade de processos para buscar
            </label>
            <Select value={topN} onValueChange={setTopN}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Primeiros 5 processos</SelectItem>
                <SelectItem value="10">Primeiros 10 processos</SelectItem>
                <SelectItem value="20">Primeiros 20 processos</SelectItem>
                <SelectItem value="50">Primeiros 50 processos</SelectItem>
                <SelectItem value="100">Primeiros 100 processos</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Total disponível: {processNumbers.length} processos
            </p>
          </div>

          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-semibold">Custo estimado: R$ {estimatedCost.toFixed(2)}</p>
                <p className="text-xs">R$ 3,00 por processo (DiscoveryFull API)</p>
              </div>
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta operação irá buscar documentos completos dos processos, incluindo 
              petições iniciais e anexos. O processamento pode levar alguns minutos.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleStartDiscovery}
            disabled={loading || processNumbers.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando documentos...
              </>
            ) : (
              <>
                <FileSearch className="mr-2 h-4 w-4" />
                Iniciar Busca
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}