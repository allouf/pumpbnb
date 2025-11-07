'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="flex max-w-full">
        {/* Desktop Sidebar - Has its own space, not fixed */}
        <div className={`hidden md:block ${isSidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 transition-all duration-300 overflow-hidden`}>
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>
        
        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 min-w-0 overflow-x-hidden">
          {/* Main Content */}
          <main className="min-h-screen pb-20 md:pb-0">
            <div className="p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
