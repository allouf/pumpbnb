'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { TopBar } from './TopBar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="flex h-full max-w-full">
        {/* Desktop Sidebar - Fixed, never scrolls */}
        <div className={`hidden md:block ${isSidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 transition-all duration-300 overflow-hidden border-r border-gray-800`}>
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Main Content Area - Takes remaining space, scrollable */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Top Bar with wallet connect and user icon - Fixed at top */}
          <TopBar />

          {/* Main Content - Scrollable */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
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
