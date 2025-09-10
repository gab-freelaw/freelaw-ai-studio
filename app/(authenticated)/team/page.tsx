'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layouts/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Shield, 
  Edit, 
  Trash2,
  MoreVertical,
  Check,
  X,
  Clock,
  Award,
  Briefcase,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'lawyer' | 'intern' | 'secretary'
  oab?: string
  status: 'active' | 'inactive' | 'pending'
  joinedAt: string
  lastActive: string
  avatar?: string
  permissions: string[]
  cases: number
  tasks: number
}

const roleLabels = {
  admin: 'Administrador',
  lawyer: 'Advogado',
  intern: 'Estagiário',
  secretary: 'Secretário'
}

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  lawyer: 'bg-blue-100 text-blue-800',
  intern: 'bg-yellow-100 text-yellow-800',
  secretary: 'bg-green-100 text-green-800'
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800'
}

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'lawyer'
  })

  const [members] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Dr. João Silva',
      email: 'joao.silva@exemplo.com',
      phone: '(11) 99999-9999',
      role: 'admin',
      oab: 'SP 123456',
      status: 'active',
      joinedAt: '2024-01-15',
      lastActive: '2025-09-04',
      avatar: '',
      permissions: ['all'],
      cases: 45,
      tasks: 12
    },
    {
      id: '2',
      name: 'Dra. Maria Santos',
      email: 'maria.santos@exemplo.com',
      phone: '(11) 98888-8888',
      role: 'lawyer',
      oab: 'SP 234567',
      status: 'active',
      joinedAt: '2024-03-20',
      lastActive: '2025-09-04',
      avatar: '',
      permissions: ['cases', 'documents', 'chat'],
      cases: 28,
      tasks: 8
    },
    {
      id: '3',
      name: 'Pedro Oliveira',
      email: 'pedro.oliveira@exemplo.com',
      phone: '(11) 97777-7777',
      role: 'intern',
      status: 'active',
      joinedAt: '2024-06-01',
      lastActive: '2025-09-03',
      avatar: '',
      permissions: ['documents', 'research'],
      cases: 10,
      tasks: 15
    },
    {
      id: '4',
      name: 'Ana Costa',
      email: 'ana.costa@exemplo.com',
      phone: '(11) 96666-6666',
      role: 'secretary',
      status: 'active',
      joinedAt: '2024-02-10',
      lastActive: '2025-09-04',
      avatar: '',
      permissions: ['agenda', 'contacts', 'documents'],
      cases: 0,
      tasks: 25
    },
    {
      id: '5',
      name: 'Carlos Mendes',
      email: 'carlos.mendes@exemplo.com',
      phone: '(11) 95555-5555',
      role: 'lawyer',
      status: 'pending',
      joinedAt: '2025-09-01',
      lastActive: '',
      avatar: '',
      permissions: [],
      cases: 0,
      tasks: 0
    }
  ])

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || member.role === selectedRole
    return matchesSearch && matchesRole
  })

  const handleInvite = () => {
    if (!inviteForm.email || !inviteForm.name) {
      toast.error('Preencha todos os campos')
      return
    }
    
    toast.success(`Convite enviado para ${inviteForm.email}`)
    setIsInviteOpen(false)
    setInviteForm({ email: '', name: '', role: 'lawyer' })
  }

  const handleRemoveMember = (memberId: string) => {
    toast.success('Membro removido da equipe')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-purple/5">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-freelaw-purple/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-purple rounded-2xl">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-tech-blue">Equipe</h1>
                  <p className="text-lg text-tech-blue-light mt-1">
                    Gerencie os membros do seu escritório
                  </p>
                </div>
              </div>

              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Convidar Membro
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Convidar Novo Membro</DialogTitle>
                    <DialogDescription>
                      Envie um convite para adicionar um novo membro à equipe
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-name">Nome</Label>
                      <Input
                        id="invite-name"
                        value={inviteForm.name}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-role">Função</Label>
                      <Select 
                        value={inviteForm.role}
                        onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="lawyer">Advogado</SelectItem>
                          <SelectItem value="intern">Estagiário</SelectItem>
                          <SelectItem value="secretary">Secretário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleInvite}>
                      Enviar Convite
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="lawyer">Advogados</SelectItem>
                <SelectItem value="intern">Estagiários</SelectItem>
                <SelectItem value="secretary">Secretários</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Team Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members.length}</div>
                <p className="text-xs text-muted-foreground">
                  {members.filter(m => m.status === 'active').length} ativos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Advogados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {members.filter(m => m.role === 'lawyer').length}
                </div>
                <p className="text-xs text-muted-foreground">No escritório</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Casos Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {members.reduce((acc, m) => acc + m.cases, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total da equipe</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {members.reduce((acc, m) => acc + m.tasks, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Para hoje</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Members */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-gradient-purple text-white">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <Badge className={roleColors[member.role]}>
                            {roleLabels[member.role]}
                          </Badge>
                          <Badge className={statusColors[member.status]}>
                            {member.status === 'active' ? 'Ativo' : 
                             member.status === 'pending' ? 'Pendente' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </span>
                          {member.oab && (
                            <span className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              OAB {member.oab}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="hidden sm:flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-lg">{member.cases}</p>
                          <p className="text-muted-foreground">Casos</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-lg">{member.tasks}</p>
                          <p className="text-muted-foreground">Tarefas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Último acesso</p>
                          <p className="font-medium">
                            {member.lastActive || 'Nunca'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {member.role !== 'admin' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum membro encontrado</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </AppLayout>
  )
}