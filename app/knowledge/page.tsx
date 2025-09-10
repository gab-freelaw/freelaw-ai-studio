'use client'

import { AppLayout } from '@/components/layouts/app-layout'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Search, 
  Plus, 
  FileText, 
  Folder,
  Download,
  Upload,
  Star,
  Clock,
  TrendingUp,
  Users,
  Scale,
  Briefcase,
  GraduationCap,
  Library,
  ChevronRight,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

interface KnowledgeItem {
  id: string
  title: string
  description: string
  category: 'legislation' | 'jurisprudence' | 'doctrine' | 'templates' | 'articles'
  tags: string[]
  author?: string
  date: string
  views: number
  isFavorite: boolean
}

interface Category {
  name: string
  icon: any
  count: number
  color: string
}

// Mock data
const mockKnowledge: KnowledgeItem[] = [
  {
    id: '1',
    title: 'Novo Código de Processo Civil - Principais Mudanças',
    description: 'Análise completa das principais alterações trazidas pelo NCPC...',
    category: 'legislation',
    tags: ['CPC', 'Processo Civil', 'Legislação'],
    author: 'Dr. Pedro Santos',
    date: '2024-11-20',
    views: 234,
    isFavorite: true
  },
  {
    id: '2',
    title: 'Súmulas do STF sobre Direito Trabalhista',
    description: 'Compilado atualizado das súmulas do Supremo Tribunal Federal...',
    category: 'jurisprudence',
    tags: ['STF', 'Trabalhista', 'Súmulas'],
    date: '2024-10-15',
    views: 189,
    isFavorite: true
  },
  {
    id: '3',
    title: 'Modelo de Petição Inicial - Ação de Despejo',
    description: 'Template completo para ação de despejo por falta de pagamento...',
    category: 'templates',
    tags: ['Petição', 'Despejo', 'Locação'],
    author: 'Dra. Ana Costa',
    date: '2024-09-30',
    views: 456,
    isFavorite: false
  },
  {
    id: '4',
    title: 'Direito Digital e LGPD - Guia Prático',
    description: 'Manual completo sobre a Lei Geral de Proteção de Dados...',
    category: 'articles',
    tags: ['LGPD', 'Direito Digital', 'Privacidade'],
    author: 'Dr. Carlos Oliveira',
    date: '2024-12-01',
    views: 321,
    isFavorite: false
  }
]

const categories: Category[] = [
  { name: 'Legislação', icon: Scale, count: 45, color: 'text-blue-600' },
  { name: 'Jurisprudência', icon: Library, count: 128, color: 'text-purple-600' },
  { name: 'Doutrina', icon: GraduationCap, count: 67, color: 'text-green-600' },
  { name: 'Modelos', icon: FileText, count: 234, color: 'text-orange-600' },
  { name: 'Artigos', icon: BookOpen, count: 89, color: 'text-red-600' }
]

function KnowledgeContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [knowledge] = useState<KnowledgeItem[]>(mockKnowledge)

  const getCategoryIcon = (category: KnowledgeItem['category']) => {
    switch (category) {
      case 'legislation': return <Scale className="h-4 w-4" />
      case 'jurisprudence': return <Library className="h-4 w-4" />
      case 'doctrine': return <GraduationCap className="h-4 w-4" />
      case 'templates': return <FileText className="h-4 w-4" />
      case 'articles': return <BookOpen className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: KnowledgeItem['category']) => {
    switch (category) {
      case 'legislation': return 'Legislação'
      case 'jurisprudence': return 'Jurisprudência'
      case 'doctrine': return 'Doutrina'
      case 'templates': return 'Modelos'
      case 'articles': return 'Artigos'
      default: return category
    }
  }

  const filteredKnowledge = knowledge.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const recentItems = [...knowledge].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 3)

  const popularItems = [...knowledge].sort((a, b) => b.views - a.views).slice(0, 3)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Base de Conhecimento</h1>
          <p className="text-muted-foreground">
            Sua biblioteca jurídica digital com legislação, jurisprudência e modelos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        {categories.map((category) => (
          <Card 
            key={category.name}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedCategory(
              selectedCategory === category.name.toLowerCase() ? null : category.name.toLowerCase() as any
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
              <category.icon className={`h-4 w-4 ${category.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{category.count}</div>
              <p className="text-xs text-muted-foreground">documentos</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar na base de conhecimento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="favorites">Favoritos</TabsTrigger>
              <TabsTrigger value="recent">Recentes</TabsTrigger>
              <TabsTrigger value="popular">Populares</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredKnowledge.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {getCategoryIcon(item.category)}
                            <span className="ml-1">{getCategoryLabel(item.category)}</span>
                          </Badge>
                          {item.isFavorite && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
                          {item.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {item.author && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {item.author}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(item.date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {item.views} visualizações
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          {item.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
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
                          <Edit className="h-4 w-4" />
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

            <TabsContent value="favorites" className="space-y-4">
              {filteredKnowledge.filter(item => item.isFavorite).map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {getCategoryIcon(item.category)}
                            <span className="ml-1">{getCategoryLabel(item.category)}</span>
                          </Badge>
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </div>
                        
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              {recentItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {getCategoryIcon(item.category)}
                            <span className="ml-1">{getCategoryLabel(item.category)}</span>
                          </Badge>
                          <Badge variant="outline">Novo</Badge>
                        </div>
                        
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="popular" className="space-y-4">
              {popularItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {getCategoryIcon(item.category)}
                            <span className="ml-1">{getCategoryLabel(item.category)}</span>
                          </Badge>
                          <Badge variant="default">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-sm font-medium">{item.views} visualizações</p>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Access */}
          <Card>
            <CardHeader>
              <CardTitle>Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Scale className="mr-2 h-4 w-4" />
                Código Civil
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Scale className="mr-2 h-4 w-4" />
                Código de Processo Civil
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Scale className="mr-2 h-4 w-4" />
                CLT
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Library className="mr-2 h-4 w-4" />
                Súmulas STF
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Library className="mr-2 h-4 w-4" />
                Súmulas STJ
              </Button>
            </CardContent>
          </Card>

          {/* Storage Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Armazenamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usado</span>
                  <span className="font-medium">3.2 GB / 10 GB</span>
                </div>
                <Progress value={32} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  563 documentos armazenados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>Uploads Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Lei 14.790/2023</span>
                </div>
                <p className="text-xs text-muted-foreground">há 2 horas</p>
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Súmula 621 STJ</span>
                </div>
                <p className="text-xs text-muted-foreground">há 5 horas</p>
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Modelo Contrato Social</span>
                </div>
                <p className="text-xs text-muted-foreground">ontem</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function KnowledgePage() {
  return (
    <AppLayout>
      <KnowledgeContent />
    </AppLayout>
  )
}