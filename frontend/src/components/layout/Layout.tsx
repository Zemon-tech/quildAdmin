import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="layout-flex-col viewport-full-exact overflow-hidden bg-background overscroll-none">
      <div className="layout-flex-row layout-flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="layout-flex-col layout-flex-1 overflow-hidden">
          <Navbar />
          <main
            className={cn(
              'layout-flex-1 overflow-y-container overscroll-y-contain p-6',
              sidebarCollapsed ? 'ml-0' : 'ml-0'
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
