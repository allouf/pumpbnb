'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  QuestionMarkCircleIcon,
  EllipsisHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  PlusIcon as PlusIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ClockIcon as ClockIconSolid,
  UserIcon as UserIconSolid,
  QuestionMarkCircleIcon as SupportIconSolid,
  EllipsisHorizontalIcon as MoreIconSolid,
  Square3Stack3DIcon as Square3Stack3DIconSolid
} from '@heroicons/react/24/solid';

import { ConnectButton } from '../ConnectButton';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  iconSolid: React.ElementType;
}

const navigation: NavigationItem[] = [
  { name: 'Home', href: '/', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Create', href: '/create', icon: PlusIcon, iconSolid: PlusIconSolid },
  { name: 'Portfolio', href: '/portfolio', icon: Square3Stack3DIcon, iconSolid: Square3Stack3DIconSolid },
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { name: 'History', href: '/history', icon: ClockIcon, iconSolid: ClockIconSolid },
  { name: 'Profile', href: '/profile', icon: UserIcon, iconSolid: UserIconSolid },
];

// More dropdown menu items
const moreMenuItems = [
  { name: 'Support', href: '/support' },
  { name: 'How it works', href: '/how-it-works' },
  { name: 'Documentation', href: '/docs' },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);

  return (
    <div className={`h-screen bg-background-sidebar border-r border-border flex flex-col transition-all duration-300 sticky top-0 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo Section with Collapse Button */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src="/logo.jpg" alt="ASTER FUN" className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold text-white whitespace-nowrap overflow-hidden">
                ASTER FUN
              </span>
            )}
          </Link>

          {/* Collapse Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="w-7 h-7 rounded-lg bg-secondary-light border border-gray-700 flex items-center justify-center hover:bg-secondary transition-colors flex-shrink-0"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronLeftIcon className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Wallet Connection - Only show when expanded */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border">
          <ConnectButton />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = isActive ? item.iconSolid : item.icon;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-primary text-black font-semibold' 
                      : 'text-gray-400 hover:text-white hover:bg-secondary-light'
                    }
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-secondary-light border border-gray-700 rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
          
          {/* More Dropdown */}
          <li>
            <div className="relative">
              <button
                onClick={() => setIsMoreExpanded(!isMoreExpanded)}
                className={`
                  w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  text-gray-400 hover:text-white hover:bg-secondary-light
                `}
                title={isCollapsed ? 'More' : undefined}
              >
                <div className="flex items-center gap-3">
                  <EllipsisHorizontalIcon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">More</span>}
                </div>
                {!isCollapsed && (
                  <div className="transition-transform duration-200">
                    {isMoreExpanded ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-secondary-light border border-gray-700 rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    More
                  </div>
                )}
              </button>
              
              {/* Dropdown Menu */}
              {!isCollapsed && isMoreExpanded && (
                <div className="mt-1 ml-8 space-y-1">
                  {moreMenuItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-secondary-light rounded-lg transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                  
                  {/* Social Links */}
                  <div className="pt-2 mt-2 border-t border-gray-700">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                        <span className="sr-only">Twitter</span>
                        𝕏
                      </a>
                      <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                        <span className="sr-only">Telegram</span>
                        💬
                      </a>
                      <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                        <span className="sr-only">Discord</span>
                        💬
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Collapsed state dropdown */}
              {isCollapsed && isMoreExpanded && (
                <div className="absolute left-full ml-2 top-0 bg-secondary-light border border-gray-700 rounded-lg shadow-lg p-2 z-50 min-w-[200px]">
                  <div className="space-y-1">
                    {moreMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-secondary rounded transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                    
                    {/* Social Links for collapsed */}
                    <div className="pt-2 mt-2 border-t border-gray-700">
                      <div className="flex items-center gap-3 px-3 py-2">
                        <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                          𝕏
                        </a>
                        <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                          💬
                        </a>
                        <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                          💬
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </li>
        </ul>
      </nav>

      {/* Create Coin Button */}
      <div className="p-2 border-t border-border">
        <Link href="/create">
          {isCollapsed ? (
            <button 
              className="w-full h-12 bg-primary hover:bg-primary/90 rounded-lg flex items-center justify-center transition-colors group relative"
              title="Create coin"
            >
              <PlusIcon className="w-5 h-5 text-black" />
              {/* Tooltip for collapsed create button */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-secondary-light border border-gray-700 rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Create coin
              </div>
            </button>
          ) : (
            <button 
              className="w-full h-12 bg-primary hover:bg-primary/90 rounded-lg flex items-center justify-center gap-2 text-black font-bold transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Create coin</span>
            </button>
          )}
        </Link>
      </div>
    </div>
  );
}
