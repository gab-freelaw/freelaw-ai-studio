'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  MessageSquare,
  FileText,
  Upload,
  Search,
  Scale,
  Users,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileSignature,
  Briefcase,
  Menu,
  X,
  History,
  FolderOpen,
  Brain,
  Shield,
  Gavel,
  Calendar,
  UserCheck,
  FileStack,
  ListTodo,
  Wallet,
  Target,
  TrendingUp,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos de usuário
type UserType = 'contractor' | 'provider' | 'admin';

// Navegação específica por tipo de usuário
const CONTRACTOR_NAVIGATION = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/escritorio/dashboard',
    color: 'freelaw-purple',
    description: 'Visão geral do escritório'
  },
  {
    id: 'chat',
    label: 'Chat Jurídico',
    icon: MessageSquare,
    href: '/chat',
    color: 'tech-blue',
    description: 'Assistente IA para dúvidas'
  },
  {
    id: 'documents',
    label: 'Documentos',
    icon: FolderOpen,
    href: '/documents',
    color: 'olympic-gold',
    description: 'Análise e gestão de arquivos'
  },
  {
    id: 'petitions',
    label: 'Petições',
    icon: FileSignature,
    href: '/petitions',
    color: 'product-pink',
    description: 'Gerar peças processuais'
  },
  {
    id: 'processes',
    label: 'Processos',
    icon: FileStack,
    href: '/processes',
    color: 'tech-blue',
    description: 'Gestão de processos'
  },
  {
    id: 'agenda',
    label: 'Agenda & Prazos',
    icon: Calendar,
    href: '/agenda',
    color: 'product-pink',
    description: 'Compromissos e prazos'
  },
  {
    id: 'tarefas',
    label: 'Tarefas IA',
    icon: ListTodo,
    href: '/tarefas',
    color: 'freelaw-purple',
    description: 'Tarefas inteligentes'
  },
  {
    id: 'delegacoes',
    label: 'Delegações',
    icon: Users,
    href: '/escritorio/delegacoes',
    color: 'success-green',
    description: 'Delegar para prestadores'
  },
  {
    id: 'contacts',
    label: 'Contatos',
    icon: UserCheck,
    href: '/contacts',
    color: 'freelaw-purple',
    description: 'Clientes e partes'
  },
  {
    id: 'publications',
    label: 'Publicações',
    icon: Gavel,
    href: '/publications',
    color: 'olympic-gold',
    description: 'Monitoramento de diários'
  },
  {
    id: 'office',
    label: 'Escritório',
    icon: Building,
    href: '/office',
    color: 'freelaw-light-purple',
    description: 'Configurações do escritório'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    href: '/settings',
    color: 'freelaw-navy',
    description: 'Configurações da conta'
  }
];

const PROVIDER_NAVIGATION = [
  {
    id: 'dashboard-prestador',
    label: 'Dashboard',
    icon: Home,
    href: '/prestador/dashboard',
    color: 'success-green',
    description: 'Visão geral do prestador'
  },
  {
    id: 'carteira',
    label: 'Carteira Digital',
    icon: Wallet,
    href: '/prestador/carteira',
    color: 'freelaw-gold',
    description: 'Ganhos, saques e preços'
  },
  {
    id: 'trabalhos',
    label: 'Trabalhos',
    icon: Target,
    href: '/prestador/trabalhos',
    color: 'tech-blue',
    description: 'Trabalhos disponíveis'
  },
  {
    id: 'meus-servicos',
    label: 'Meus Serviços',
    icon: FileStack,
    href: '/prestador/servicos',
    color: 'product-pink',
    description: 'Serviços em andamento'
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: TrendingUp,
    href: '/prestador/performance',
    color: 'freelaw-purple',
    description: 'Métricas e classificação'
  },
  {
    id: 'chat-suporte',
    label: 'Suporte',
    icon: MessageSquare,
    href: '/prestador/suporte',
    color: 'tech-blue',
    description: 'Chat com suporte'
  },
  {
    id: 'settings-prestador',
    label: 'Configurações',
    icon: Settings,
    href: '/prestador/configuracoes',
    color: 'freelaw-navy',
    description: 'Configurações do perfil'
  }
];

const ADMIN_NAVIGATION = [
  {
    id: 'admin-dashboard',
    label: 'Admin Dashboard',
    icon: Shield,
    href: '/admin',
    color: 'freelaw-navy',
    description: 'Painel administrativo'
  },
  {
    id: 'pricing-rules',
    label: 'Regras de Preço',
    icon: Scale,
    href: '/admin/pricing',
    color: 'freelaw-gold',
    description: 'Gerenciar precificação'
  },
  {
    id: 'providers-admin',
    label: 'Prestadores',
    icon: Users,
    href: '/admin/providers',
    color: 'success-green',
    description: 'Gerenciar prestadores'
  },
  {
    id: 'orders-admin',
    label: 'Ordens de Serviço',
    icon: FileStack,
    href: '/admin/orders',
    color: 'product-pink',
    description: 'Monitorar ordens'
  },
  {
    id: 'sistema-completo',
    label: 'Sistema Completo',
    icon: Brain,
    href: '/sistema-completo',
    color: 'tech-blue',
    description: 'Visão técnica completa'
  }
];

interface SmartSidebarProps {
  userType?: UserType;
  collapsed?: boolean;
}

export function SmartSidebar({ userType = 'contractor', collapsed = false }: SmartSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Selecionar navegação baseada no tipo de usuário
  const getNavigationItems = () => {
    switch (userType) {
      case 'provider':
        return PROVIDER_NAVIGATION;
      case 'admin':
        return ADMIN_NAVIGATION;
      case 'contractor':
      default:
        return CONTRACTOR_NAVIGATION;
    }
  };

  const navigationItems = getNavigationItems();

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'provider':
        return 'Prestador';
      case 'admin':
        return 'Administrador';
      case 'contractor':
      default:
        return 'Escritório';
    }
  };

  const getUserTypeColor = () => {
    switch (userType) {
      case 'provider':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'contractor':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-freelaw-white border-r border-freelaw-purple/10 transition-all duration-300 lg:relative lg:z-0 shadow-lg',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-freelaw-purple/10">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <Link href="/" className="block">
                <Image
                  src="/images/logo-dark.png"
                  alt="Freelaw AI Studio"
                  width={150}
                  height={50}
                  className="h-10 w-auto"
                />
              </Link>
            )}
            {!isCollapsed && (
              <div className={cn('text-xs px-2 py-1 rounded border', getUserTypeColor())}>
                {getUserTypeLabel()}
              </div>
            )}
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            {!isCollapsed && (
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 hover:bg-freelaw-purple/10 rounded-lg transition-colors lg:hidden"
              >
                <X className="w-5 h-5 text-tech-blue" />
              </button>
            )}
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-freelaw-purple/10 rounded-lg transition-colors hidden lg:block"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-tech-blue" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-tech-blue" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-freelaw-purple to-freelaw-light-purple text-white shadow-md'
                        : 'text-freelaw-navy hover:bg-freelaw-purple/10 hover:text-freelaw-purple',
                      isCollapsed && 'justify-center px-2'
                    )}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-freelaw-navy/70')} />
                    {!isCollapsed && (
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className={cn(
                            'text-xs mt-0.5',
                            isActive ? 'text-white/80' : 'text-freelaw-navy/60'
                          )}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-freelaw-purple/10 p-4 bg-freelaw-purple/5">
            <div className="text-xs text-freelaw-navy/60 space-y-1">
              <div className="font-medium text-freelaw-navy">Freelaw AI Studio v2.0</div>
              <div>Backend: NestJS + PostgreSQL</div>
              <div>Frontend: Next.js + React</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Hook para detectar tipo de usuário
export function useUserType(): UserType {
  const [userType, setUserType] = useState<UserType>('contractor');
  const pathname = usePathname();

  useEffect(() => {
    // Detectar tipo baseado na URL ou contexto
    if (pathname.startsWith('/prestador') || pathname.startsWith('/carteira')) {
      setUserType('provider');
    } else if (pathname.startsWith('/admin') || pathname.startsWith('/sistema-completo')) {
      setUserType('admin');
    } else {
      setUserType('contractor');
    }
  }, [pathname]);

  return userType;
}

