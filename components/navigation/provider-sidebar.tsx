'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  BarChart3, 
  MessageSquare, 
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/portal-prestador/dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral das suas métricas'
  },
  {
    title: 'Performance',
    href: '/portal-prestador/performance',
    icon: BarChart3,
    description: 'Análise detalhada de performance'
  },
  {
    title: 'Feedback',
    href: '/portal-prestador/feedback',
    icon: MessageSquare,
    description: 'Feedback dos clientes'
  },
  {
    title: 'Metas',
    href: '/portal-prestador/metas',
    icon: Target,
    description: 'Configurar e acompanhar metas'
  }
]

export default function ProviderSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Portal Prestador</h2>
                <p className="text-sm text-gray-500">Freelaw AI Studio</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 hover:bg-gray-100",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1">
                    <div>{item.title}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {!isCollapsed && (
            <div className="text-xs text-gray-500 text-center">
              © 2024 Freelaw AI Studio
            </div>
          )}
        </div>
      </div>
    </div>
  )
}