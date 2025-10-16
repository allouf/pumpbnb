'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const sidebarWidth = isSidebarCollapsed ? 'w-16' : 'w-64';

  return (
    <div className="min-h-screen bg-background-dark">
      <div className="flex">
        {/* Sidebar - Has its own space, not fixed */}
        <div className={`hidden md:block ${sidebarWidth} flex-shrink-0 transition-all duration-300`}>
          <div className="h-screen sticky top-0">
            <Sidebar 
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          </div>
        </div>
        
        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 min-w-0">
          {/* Header - Only sticky, not fixed */}
          <div className="sticky top-0 h-16 z-50 bg-background-dark/95 backdrop-blur-sm border-b border-border shadow-sm">
            <Header />
          </div>
          
          {/* Main Content */}
          <main className="min-h-[calc(100vh-4rem)]">
            <div className="p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileBottomNav />
      </div>
    </div>
  );
}
