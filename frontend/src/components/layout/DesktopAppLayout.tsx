import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DesktopAppLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  className?: string;
}

/**
 * DesktopAppLayout - Implements the main layout strategy for desktop app-like experience
 * 
 * Key Features:
 * - Viewport Height Control: Uses exact viewport calculations (100vh)
 * - Controlled Scroll Areas: Only specific content areas scroll
 * - Flex Layout: Uses flex-1 to fill remaining space
 * - Overscroll Prevention: Prevents unwanted scroll behaviors
 */
export function DesktopAppLayout({ 
  children, 
  sidebar, 
  header,
  className 
}: DesktopAppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={cn(
      // Main container: fills exact viewport height, prevents page-level scrolling
      "layout-flex-col viewport-full-exact overflow-hidden bg-background overscroll-none",
      className
    )}>
      {/* Flex row container for sidebar and main content */}
      <div className="layout-flex-row layout-flex-1 overflow-hidden">
        
        {/* Sidebar - Fixed width, no overflow */}
        {sidebar && (
          <div className="overflow-container flex-shrink-0">
            {sidebar}
          </div>
        )}
        
        {/* Main content area */}
        <div className="layout-flex-col layout-flex-1 overflow-hidden">
          
          {/* Header - Fixed height, no overflow */}
          {header && (
            <div className="overflow-container flex-shrink-0">
              {header}
            </div>
          )}
          
          {/* Main content - Scrollable when needed */}
          <main className="layout-flex-1 overflow-y-container overscroll-y-contain">
            {children}
          </main>
          
        </div>
      </div>
    </div>
  );
}

/**
 * ContentContainer - Wrapper for content areas that need controlled scrolling
 */
export function ContentContainer({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn(
      "overflow-y-container overscroll-y-contain",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * FixedContainer - Wrapper for fixed-height content that shouldn't scroll
 */
export function FixedContainer({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn(
      "overflow-container",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * ScrollableCard - Card with internal scrolling for long content
 */
export function ScrollableCard({ 
  children, 
  className,
  maxHeight = "400px"
}: { 
  children: ReactNode; 
  className?: string;
  maxHeight?: string;
}) {
  return (
    <div className={cn(
      "card-overflow-hidden rounded-lg border bg-card",
      className
    )}>
      <div 
        className="overflow-y-container overscroll-y-contain"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>
  );
}
