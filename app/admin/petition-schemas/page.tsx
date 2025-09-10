'use client'

import { useState, useEffect } from 'react'
import { petitionSchemaService } from '@/lib/services/petition-schema.service'
import { petitionCacheService } from '@/lib/services/petition-cache.service'
import type { PetitionSchema } from '@/lib/types/petition.types'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  FileText, 
  Plus, 
  Settings, 
  Database, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function PetitionSchemasPage() {
  const [schemas, setSchemas] = useState<PetitionSchema[]>([])
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load schemas
      const allSchemas = await petitionSchemaService.getAllSchemas()
      setSchemas(allSchemas)

      // Load cache stats
      const stats = await petitionCacheService.getCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaultSchemas = async () => {
    try {
      const defaults = petitionSchemaService.getDefaultSchemas()
      
      for (const schema of defaults) {
        await petitionSchemaService.upsertSchema(schema)
      }
      
      await loadData()
    } catch (error) {
      console.error('Error initializing schemas:', error)
    }
  }

  const clearCache = async () => {
    try {
      const cleared = await petitionCacheService.clearExpiredCache()
      console.log(`Cleared ${cleared} expired cache entries`)
      await loadData()
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Petições</h1>
          <p className="text-muted-foreground mt-2">
            Configure schemas, templates e cache do sistema de petições
          </p>
        </div>
        <Button onClick={initializeDefaultSchemas} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Inicializar Schemas Padrão
        </Button>
      </div>

      <Tabs defaultValue="schemas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schemas">
            <FileText className="w-4 h-4 mr-2" />
            Schemas
          </TabsTrigger>
          <TabsTrigger value="cache">
            <Database className="w-4 h-4 mr-2" />
            Cache
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="w-4 h-4 mr-2" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schemas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schemas de Petições</CardTitle>
              <CardDescription>
                Configurações de validação e estrutura para cada tipo de petição
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : schemas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Nenhum schema configurado
                  </p>
                  <Button onClick={initializeDefaultSchemas}>
                    Criar Schemas Padrão
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Campos</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schemas.map((schema) => (
                      <TableRow key={schema.id}>
                        <TableCell className="font-medium">
                          {schema.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {schema.service_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {schema.legal_area}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {Object.keys(schema.fields).length} campos
                        </TableCell>
                        <TableCell>v{schema.version}</TableCell>
                        <TableCell>
                          {schema.active ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache de Petições</CardTitle>
              <CardDescription>
                Gerenciar cache para otimizar performance e reduzir custos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cacheStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total de Entradas</p>
                    <p className="text-2xl font-bold">{cacheStats.totalEntries}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total de Hits</p>
                    <p className="text-2xl font-bold">{cacheStats.totalHits}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Taxa de Hit</p>
                    <p className="text-2xl font-bold">
                      {(cacheStats.cacheHitRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-2xl font-bold">
                      {cacheStats.avgProcessingTime.toFixed(0)}ms
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Cache expira em 72 horas</span>
                </div>
                <Button onClick={clearCache} variant="outline" size="sm">
                  Limpar Cache Expirado
                </Button>
              </div>

              {cacheStats?.topTemplates?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Templates Mais Usados</h4>
                  <div className="space-y-2">
                    {cacheStats.topTemplates.map((template: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-medium">{template.type}</span>
                          <Badge variant="outline" className="ml-2">
                            {template.area}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {template.hits} hits
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Processamento em Chunks</span>
                    <Badge className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cache Inteligente</span>
                    <Badge className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Validação de Schemas</span>
                    <Badge className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Integração Office Style</span>
                    <Badge className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tamanho do Chunk</span>
                    <span className="font-mono text-sm">50.000 chars</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Chunks Paralelos</span>
                    <span className="font-mono text-sm">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">TTL do Cache</span>
                    <span className="font-mono text-sm">72 horas</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Limite Cache/Office</span>
                    <span className="font-mono text-sm">100 entradas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}