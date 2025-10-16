'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  PlayIcon, 
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  QuestionMarkCircleIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  PlayIcon as PlayIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ChatBubbleLeftRightIcon as ChatIconSolid,
  UserIcon as UserIconSolid,
  QuestionMarkCircleIcon as SupportIconSolid,
  EllipsisHorizontalIcon as MoreIconSolid
} from '@heroicons/react/24/solid';

import { Button } from '@/components/ui/Button';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  iconSolid: React.ElementType;
}

const navigation: NavigationItem[] = [
  { name: 'Home', href: '/', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Livestreams', href: '/livestreams', icon: PlayIcon, iconSolid: PlayIconSolid },
  { name: 'Advanced', href: '/advanced', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon, iconSolid: ChatIconSolid },
  { name: 'Profile', href: '/profile', icon: UserIcon, iconSolid: UserIconSolid },
  { name: 'Support', href: '/support', icon: QuestionMarkCircleIcon, iconSolid: SupportIconSolid },
];

// More dropdown menu items
const moreMenuItems = [
  { name: 'PumpSwap', href: '/pumpswap' },
  { name: 'Livestream policy', href: '/livestream-policy' },
  { name: 'DMCA policy', href: '/dmca-policy' },
  { name: 'Trademark guidelines', href: '/trademark-guidelines' },
  { name: 'How it works', href: '/how-it-works' },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);

  return (
    <div className={`h-full bg-background-sidebar border-r border-border flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Collapse Toggle Button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute top-4 -right-3 w-6 h-6 bg-background-card border border-border rounded-full flex items-center justify-center hover:bg-background-sidebar transition-colors z-10"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4 text-text-secondary" />
          )}
        </button>
      )}
      
      {/* Logo Section */}
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-green rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-lg">P</span>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-text-primary whitespace-nowrap overflow-hidden">
              Pump.bnb
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4">
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
                      ? 'bg-primary-green text-black font-semibold' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-background-card'
                    }
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-background-card border border-border rounded text-sm text-text-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
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
                  text-text-secondary hover:text-text-primary hover:bg-background-card
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
                  <div className="absolute left-full ml-2 px-2 py-1 bg-background-card border border-border rounded text-sm text-text-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
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
                      className="block px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-card rounded-lg transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                  
                  {/* Social Links */}
                  <div className="pt-2 mt-2 border-t border-border">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                        <span className="sr-only">Twitter</span>
                        𝕏
                      </a>
                      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                        <span className="sr-only">Instagram</span>
                        📷
                      </a>
                      <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                        <span className="sr-only">TikTok</span>
                        🎵
                      </a>
                      <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                        <span className="sr-only">YouTube</span>
                        📺
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Collapsed state dropdown */}
              {isCollapsed && isMoreExpanded && (
                <div className="absolute left-full ml-2 top-0 bg-background-card border border-border rounded-lg shadow-lg p-2 z-50 min-w-[200px]">
                  <div className="space-y-1">
                    {moreMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-sidebar rounded transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                    
                    {/* Social Links for collapsed */}
                    <div className="pt-2 mt-2 border-t border-border">
                      <div className="flex items-center gap-3 px-3 py-2">
                        <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                          𝕏
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                          📷
                        </a>
                        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                          🎵
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                          📺
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
        {isCollapsed ? (
          <button 
            className="w-full h-12 bg-primary-green hover:bg-green-400 rounded-lg flex items-center justify-center transition-colors group relative"
            title="Create coin"
          >
            <PlusIcon className="w-5 h-5 text-black" />
            {/* Tooltip for collapsed create button */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-background-card border border-border rounded text-sm text-text-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Create coin
            </div>
          </button>
        ) : (
          <Button 
            fullWidth 
            size="lg" 
            className="bg-primary-green text-black hover:bg-green-400"
            leftIcon={<PlusIcon className="w-5 h-5" />}
          >
            Create coin
          </Button>
        )}
      </div>
    </div>
  );
}
