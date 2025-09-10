'use client';

import { useState, useEffect } from 'react';
import { UnifiedSidebar } from '@/components/navigation/unified-sidebar';
import { QuickAccessBar } from '@/components/navigation/quick-access-bar';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  showQuickAccess?: boolean;
  className?: string;
}

export function AppLayout({ children, showQuickAccess = true, className }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-purple/5">
      {/* Sidebar */}
      <UnifiedSidebar
        isOpen={mounted ? sidebarOpen : true}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobile={mounted ? isMobile : false}
      />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          !mounted ? "ml-80" : (sidebarOpen && !isMobile ? "ml-80" : isMobile ? "ml-0" : "ml-20")
        )}
      >
        {/* Mobile Header */}
        {mounted && isMobile && (
          <header className="bg-white border-b border-freelaw-purple/10 px-4 py-3 sticky top-0 z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-freelaw-purple/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-tech-blue" />
            </button>
          </header>
        )}

        {/* Page Content */}
        <main className={cn("min-h-screen", className)}>
          {children}
        </main>
      </div>

      {/* Quick Access Bar */}
      {showQuickAccess && <QuickAccessBar />}
    </div>
  );
}