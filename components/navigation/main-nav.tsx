'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import {
  Home,
  MessageSquare,
  FileText,
  Gavel,
  FolderOpen,
  Users,
  Calendar,
  CheckSquare,
  Settings,
  BarChart,
  BookOpen,
  Briefcase,
  LogOut,
  User,
  Building,
  Search,
  FileStack,
  Clock,
  Brain,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Visão geral',
  },
  {
    title: 'Chat IA',
    href: '/chat',
    icon: MessageSquare,
    description: 'Assistente jurídico',
  },
  {
    title: 'Documentos',
    href: '/documents',
    icon: FileText,
    description: 'Gestão de arquivos',
  },
  {
    title: 'Petições',
    href: '/petitions',
    icon: Gavel,
    description: 'Criar peças',
  },
  {
    title: 'Processos',
    href: '/processes',
    icon: FileStack,
    description: 'Acompanhamento',
  },
]

const moreItems = [
  {
    title: 'Contatos',
    href: '/contacts',
    icon: Users,
    description: 'Clientes e partes',
  },
  {
    title: 'Agenda',
    href: '/agenda',
    icon: Calendar,
    description: 'Compromissos',
  },
  {
    title: 'Tarefas IA',
    href: '/tarefas',
    icon: CheckSquare,
    description: 'Gestão inteligente',
  },
  {
    title: 'Publicações',
    href: '/publications',
    icon: BookOpen,
    description: 'Monitoramento',
  },
  {
    title: 'Contratos',
    href: '/contracts',
    icon: FileText,
    description: 'Gestão de contratos',
  },
  {
    title: 'Prazos',
    href: '/deadlines',
    icon: Clock,
    description: 'Controle de prazos',
  },
  {
    title: 'Base Jurídica',
    href: '/knowledge',
    icon: BookOpen,
    description: 'Jurisprudência',
  },
  {
    title: 'Office Style',
    href: '/office-style',
    icon: Brain,
    description: 'Estilo do escritório',
  },
]

export function MainNav() {
  const pathname = usePathname()
  
  // Mock user data - replace with actual auth data
  const user = {
    name: 'João Silva',
    email: 'joao.silva@escritorio.com',
    office: 'Silva & Associados',
    avatar: '/avatar-placeholder.png',
  }

  const isProviderPortal = pathname?.startsWith('/portal-prestador')

  if (isProviderPortal) return null // Don't show main nav in provider portal

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-freelaw-black/95">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center">
          <Image
            src="/logo-dark.png"
            alt="Freelaw"
            width={140}
            height={40}
            className="h-8 w-auto dark:hidden"
            priority
          />
          <Image
            src="/logo-white.png"
            alt="Freelaw"
            width={140}
            height={40}
            className="h-8 w-auto hidden dark:block"
            priority
          />
        </Link>

        <NavigationMenu className="mr-auto">
          <NavigationMenuList>
            {mainNavItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink 
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "text-freelaw-blue-dark hover:text-freelaw-purple hover:bg-freelaw-purple/5",
                      pathname === item.href && "bg-freelaw-purple/10 text-freelaw-purple"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
            
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-freelaw-blue-dark hover:text-freelaw-purple hover:bg-freelaw-purple/5">
                Mais
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  {moreItems.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors",
                            "hover:bg-freelaw-purple/5 hover:text-freelaw-purple focus:bg-freelaw-purple/5 focus:text-freelaw-purple",
                            pathname === item.href && "bg-freelaw-purple/10 text-freelaw-purple"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <div className="text-sm font-medium leading-none">
                              {item.title}
                            </div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {item.description}
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-4">
          <Link href="/portal-prestador" target="_blank">
            <Button 
              variant="outline" 
              size="sm"
              className="border-freelaw-purple text-freelaw-purple hover:bg-freelaw-purple hover:text-white"
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Portal Prestador
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-freelaw-purple/20">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-freelaw-purple text-white">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.office}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/team" className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Equipe</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-freelaw-pink cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}