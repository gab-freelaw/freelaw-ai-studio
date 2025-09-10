'use client';

import { useState } from 'react';
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
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAVIGATION_ITEMS = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: Home,
    href: '/escritorio/dashboard',
    color: 'freelaw-purple'
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
    description: 'Gerenciar arquivos'
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
    id: 'delegacoes',
    label: 'Delegações',
    icon: Users,
    href: '/escritorio/delegacoes',
    color: 'success-green',
    description: 'Delegar para prestadores'
  },
  {
    id: 'agenda',
    label: 'Agenda & Prazos',
    icon: Calendar,
    href: '/agenda',
    color: 'product-pink',
    description: 'Compromissos, prazos e tarefas IA'
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
    id: 'search',
    label: 'Pesquisa',
    icon: Search,
    href: '/search',
    color: 'freelaw-purple',
    description: 'Jurisprudência e leis'
  },
  {
    id: 'contracts',
    label: 'Contratos',
    icon: Briefcase,
    href: '/contracts',
    color: 'tech-blue',
    description: 'Análise e criação'
  },
  {
    id: 'knowledge',
    label: 'Base de Conhecimento',
    icon: BookOpen,
    href: '/knowledge',
    color: 'tech-blue',
    description: 'Biblioteca jurídica'
  },
  {
    id: 'office',
    label: 'Perfil do Escritório',
    icon: Brain,
    href: '/office',
    color: 'freelaw-purple',
    description: 'Equipe, estilo e performance'
  }
];

interface UnifiedSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function UnifiedSidebar({ isOpen, onToggle, isMobile = false }: UnifiedSidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={cn(
          "fixed left-0 top-0 h-full bg-white border-r border-freelaw-purple/10 z-50 transition-all duration-300 flex flex-col",
          isOpen ? "w-80" : "w-20",
          isMobile && !isOpen && "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-freelaw-purple/10">
          <div className="flex items-center justify-between">
            <Link href="/" className={cn("block", !isOpen && "hidden")}>
              <Image
                src="/images/logo-dark.png"
                alt="Freelaw AI"
                width={150}
                height={50}
                className="h-10 w-auto"
              />
            </Link>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-freelaw-purple/10 rounded-lg transition-colors"
            >
              {isMobile ? (
                <X className="w-5 h-5 text-tech-blue" />
              ) : isOpen ? (
                <ChevronLeft className="w-5 h-5 text-tech-blue" />
              ) : (
                <ChevronRight className="w-5 h-5 text-tech-blue" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const isHovered = hoveredItem === item.id;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-gradient-purple text-white shadow-purple" 
                      : "hover:bg-freelaw-purple/10 text-tech-blue",
                    !isOpen && "justify-center"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-all",
                    isActive 
                      ? "bg-white/20" 
                      : isHovered 
                        ? `bg-${item.color}/20`
                        : "bg-transparent"
                  )}>
                    <item.icon className={cn(
                      "w-5 h-5",
                      isActive ? "text-white" : `text-${item.color}`
                    )} />
                  </div>
                  
                  {isOpen && (
                    <div className="flex-1">
                      <div className={cn(
                        "font-semibold text-sm",
                        isActive ? "text-white" : "text-tech-blue"
                      )}>
                        {item.label}
                      </div>
                      {item.description && (
                        <div className={cn(
                          "text-xs mt-0.5",
                          isActive ? "text-white/80" : "text-tech-blue-light"
                        )}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tooltip for collapsed sidebar */}
                  {!isOpen && !isMobile && (
                    <div className={cn(
                      "absolute left-full ml-2 px-3 py-2 bg-tech-blue text-white text-sm rounded-lg whitespace-nowrap opacity-0 pointer-events-none transition-opacity z-50",
                      isHovered && "opacity-100"
                    )}>
                      {item.label}
                      {item.description && (
                        <div className="text-xs text-white/80 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-freelaw-purple/10">
          {isOpen ? (
            <div className="space-y-2">
              <Link
                href="/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-freelaw-purple/10 text-tech-blue transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Configurações</span>
              </Link>
              <Link
                href="/team"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-freelaw-purple/10 text-tech-blue transition-colors"
              >
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Time</span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Link
                href="/settings"
                className="p-2 hover:bg-freelaw-purple/10 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-tech-blue" />
              </Link>
              <Link
                href="/team"
                className="p-2 hover:bg-freelaw-purple/10 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-tech-blue" />
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}