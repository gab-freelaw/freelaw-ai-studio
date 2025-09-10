'use client';

import { SmartSidebar, useUserType } from '@/components/navigation/smart-sidebar';

interface SmartLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function SmartLayout({ children, title, description }: SmartLayoutProps) {
  const userType = useUserType();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar inteligente */}
      <SmartSidebar userType={userType} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        {(title || description) && (
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-7xl mx-auto">
              {title && (
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              )}
              {description && (
                <p className="text-gray-600 mt-1">{description}</p>
              )}
            </div>
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

