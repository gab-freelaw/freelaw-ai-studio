'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layouts/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Filter, 
  Download,
  Eye,
  Clock,
  Briefcase,
  Scale,
  BookOpen
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'document' | 'petition' | 'contract' | 'case'
  title: string
  description: string
  date: string
  relevance: number
  tags: string[]
  client?: string
  caseNumber?: string
}

// Mock search results
const mockResults: SearchResult[] = [
  {
    id: '1',
    type: 'petition',
    title: 'Petição Inicial - Ação de Indenização',
    description: 'Petição inicial referente ao processo de indenização por danos morais e materiais...',
    date: '2024-11-15',
    relevance: 95,
    tags: ['Indenização', 'Danos Morais', 'Cível'],
    client: 'João Silva',
    caseNumber: '1234567-89.2024.8.26.0100'
  },
  {
    id: '2',
    type: 'document',
    title: 'Contrato de Prestação de Serviços',
    description: 'Contrato de prestação de serviços advocatícios para acompanhamento processual...',
    date: '2024-10-20',
    relevance: 87,
    tags: ['Contrato', 'Honorários'],
    client: 'Maria Santos'
  },
  {
    id: '3',
    type: 'case',
    title: 'Processo Trabalhista - Rescisão Indireta',
    description: 'Acompanhamento de processo trabalhista com pedido de rescisão indireta...',
    date: '2024-09-10',
    relevance: 78,
    tags: ['Trabalhista', 'Rescisão', 'CLT'],
    caseNumber: '0001234-56.2024.5.02.0001'
  }
]

function SearchContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedType, setSelectedType] = useState('all')

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    // Simulate search delay
    setTimeout(() => {
      const filtered = mockResults.filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setSearchResults(filtered)
      setIsSearching(false)
    }, 500)
  }

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />
      case 'petition': return <Scale className="h-4 w-4" />
      case 'contract': return <Briefcase className="h-4 w-4" />
      case 'case': return <BookOpen className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'document': return 'Documento'
      case 'petition': return 'Petição'
      case 'contract': return 'Contrato'
      case 'case': return 'Processo'
      default: return type
    }
  }

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'document': return 'default'
      case 'petition': return 'secondary'
      case 'contract': return 'outline'
      case 'case': return 'destructive'
      default: return 'default'
    }
  }

  const filteredResults = selectedType === 'all' 
    ? searchResults 
    : searchResults.filter(r => r.type === selectedType)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pesquisa Jurídica</h1>
        <p className="text-muted-foreground">
          Busque em todos os seus documentos, petições, contratos e processos
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Digite sua busca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-12 text-lg"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching}
            className="h-12 px-8"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
          <Button variant="outline" className="h-12">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mt-4">
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
            Últimos 30 dias
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
            Meus documentos
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
            Casos ativos
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
            Contratos vigentes
          </Badge>
        </div>
      </div>

      {/* Results */}
      {searchResults.length > 0 && (
        <>
          {/* Results Stats */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''} para "{searchQuery}"
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Results Tabs */}
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList>
              <TabsTrigger value="all">
                Todos ({searchResults.length})
              </TabsTrigger>
              <TabsTrigger value="petition">
                Petições ({searchResults.filter(r => r.type === 'petition').length})
              </TabsTrigger>
              <TabsTrigger value="document">
                Documentos ({searchResults.filter(r => r.type === 'document').length})
              </TabsTrigger>
              <TabsTrigger value="contract">
                Contratos ({searchResults.filter(r => r.type === 'contract').length})
              </TabsTrigger>
              <TabsTrigger value="case">
                Processos ({searchResults.filter(r => r.type === 'case').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedType} className="mt-6 space-y-4">
              {filteredResults.map((result) => (
                <Card key={result.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getTypeColor(result.type)}>
                            {getTypeIcon(result.type)}
                            <span className="ml-1">{getTypeLabel(result.type)}</span>
                          </Badge>
                          <Badge variant="outline">
                            {result.relevance}% relevante
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
                          {result.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {result.client && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {result.client}
                            </span>
                          )}
                          {result.caseNumber && (
                            <span className="flex items-center gap-1">
                              <Scale className="h-3 w-3" />
                              {result.caseNumber}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(result.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          {result.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Empty State */}
      {searchQuery && searchResults.length === 0 && !isSearching && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground">
              Tente buscar com outros termos ou ajuste os filtros
            </p>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!searchQuery && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Comece sua pesquisa</h3>
            <p className="text-muted-foreground mb-6">
              Digite termos para buscar em toda sua base de conhecimento jurídico
            </p>
            
            {/* Recent Searches */}
            <div className="max-w-md mx-auto">
              <h4 className="text-sm font-medium mb-3 text-left">Pesquisas recentes</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-pointer text-left">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Contrato de locação residencial</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-pointer text-left">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Ação de despejo por falta de pagamento</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-pointer text-left">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Recurso trabalhista CLT</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <AppLayout>
      <SearchContent />
    </AppLayout>
  )
}