'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Upload,
  MessageSquare,
  FileText,
  Search,
  Command,
  Zap,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_ACTIONS = [
  {
    id: 'new-chat',
    label: 'Nova Conversa',
    icon: MessageSquare,
    href: '/chat',
    shortcut: '⌘K',
    color: 'tech-blue'
  },
  {
    id: 'upload-doc',
    label: 'Upload Documento',
    icon: Upload,
    href: '/documents?upload=true',
    shortcut: '⌘U',
    color: 'olympic-gold'
  },
  {
    id: 'create-petition',
    label: 'Criar Petição',
    icon: FileText,
    href: '/petitions',
    shortcut: '⌘P',
    color: 'product-pink'
  },
  {
    id: 'search',
    label: 'Pesquisar',
    icon: Search,
    href: '/search',
    shortcut: '⌘/',
    color: 'freelaw-purple'
  }
];

export function QuickAccessBar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Expanded Actions */}
      <div className={cn(
        "absolute bottom-16 right-0 transition-all duration-300",
        isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <div className="bg-white rounded-2xl shadow-xl border border-freelaw-purple/10 p-2 space-y-1 min-w-[240px]">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-freelaw-purple/10 transition-all group"
              onClick={() => setIsExpanded(false)}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-1.5 bg-${action.color}/10 rounded-lg group-hover:scale-110 transition-transform`}>
                  <action.icon className={`w-4 h-4 text-${action.color}`} />
                </div>
                <span className="text-sm font-medium text-tech-blue">
                  {action.label}
                </span>
              </div>
              <kbd className="text-xs text-tech-blue-light bg-freelaw-purple/5 px-2 py-1 rounded">
                {action.shortcut}
              </kbd>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "group relative w-14 h-14 bg-gradient-purple text-white rounded-full shadow-purple hover:shadow-glow transition-all duration-300",
          isExpanded && "rotate-45"
        )}
      >
        <Plus className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-freelaw-purple animate-ping opacity-20" />
        
        {/* Sparkle effect */}
        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-olympic-gold animate-pulse" />
      </button>

      {/* Command palette hint */}
      {!isExpanded && (
        <div className="absolute bottom-0 right-16 bg-tech-blue text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Ações Rápidas (⌘K)
        </div>
      )}
    </div>
  );
}