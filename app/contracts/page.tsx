'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layouts/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Edit, 
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'

interface Contract {
  id: string
  title: string
  client: string
  type: string
  value: number
  status: 'draft' | 'active' | 'expired' | 'cancelled'
  startDate: string
  endDate: string
  lastModified: string
}

// Mock data
const mockContracts: Contract[] = [
  {
    id: '1',
    title: 'Contrato de Prestação de Serviços Advocatícios',
    client: 'João Silva',
    type: 'Consultoria',
    value: 5000,
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2025-01-15',
    lastModified: '2024-12-01'
  },
  {
    id: '2',
    title: 'Contrato de Honorários - Ação Trabalhista',
    client: 'Maria Santos',
    type: 'Contencioso',
    value: 15000,
    status: 'active',
    startDate: '2024-06-01',
    endDate: '2025-06-01',
    lastModified: '2024-11-15'
  },
  {
    id: '3',
    title: 'Contrato de Assessoria Jurídica Empresarial',
    client: 'Tech Solutions Ltda',
    type: 'Empresarial',
    value: 8000,
    status: 'draft',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    lastModified: '2024-12-10'
  }
]

function ContractsContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [contracts] = useState<Contract[]>(mockContracts)

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'active': return 'default'
      case 'draft': return 'secondary'
      case 'expired': return 'destructive'
      case 'cancelled': return 'outline'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: Contract['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'draft': return <Clock className="h-4 w-4" />
      case 'expired': return <AlertCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return null
    }
  }

  const getStatusLabel = (status: Contract['status']) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'draft': return 'Rascunho'
      case 'expired': return 'Expirado'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  const filteredContracts = contracts.filter(contract =>
    contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeContracts = filteredContracts.filter(c => c.status === 'active')
  const draftContracts = filteredContracts.filter(c => c.status === 'draft')

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">Gerencie contratos e honorários</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeContracts.length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {activeContracts.reduce((sum, c) => sum + c.value, 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Em contratos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(contracts.map(c => c.client)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Vencimento</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15 dias</div>
            <p className="text-xs text-muted-foreground">
              Contrato mais próximo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar contratos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contracts Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({filteredContracts.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Ativos ({activeContracts.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Rascunhos ({draftContracts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredContracts.map((contract) => (
            <Card key={contract.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{contract.title}</h3>
                      <Badge variant={getStatusColor(contract.status)}>
                        {getStatusIcon(contract.status)}
                        <span className="ml-1">{getStatusLabel(contract.status)}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {contract.client}
                      </span>
                      <span>{contract.type}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(contract.startDate).toLocaleDateString('pt-BR')} - {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-lg font-semibold">
                      R$ {contract.value.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex gap-2">
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

        <TabsContent value="active" className="space-y-4">
          {activeContracts.map((contract) => (
            <Card key={contract.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{contract.title}</h3>
                      <Badge variant={getStatusColor(contract.status)}>
                        {getStatusIcon(contract.status)}
                        <span className="ml-1">{getStatusLabel(contract.status)}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {contract.client}
                      </span>
                      <span>{contract.type}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(contract.startDate).toLocaleDateString('pt-BR')} - {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-lg font-semibold">
                      R$ {contract.value.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex gap-2">
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

        <TabsContent value="draft" className="space-y-4">
          {draftContracts.map((contract) => (
            <Card key={contract.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{contract.title}</h3>
                      <Badge variant={getStatusColor(contract.status)}>
                        {getStatusIcon(contract.status)}
                        <span className="ml-1">{getStatusLabel(contract.status)}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {contract.client}
                      </span>
                      <span>{contract.type}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(contract.startDate).toLocaleDateString('pt-BR')} - {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-lg font-semibold">
                      R$ {contract.value.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex gap-2">
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
      </Tabs>
    </div>
  )
}

export default function ContractsPage() {
  return (
    <AppLayout>
      <ContractsContent />
    </AppLayout>
  )
}