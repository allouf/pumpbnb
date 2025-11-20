'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import {
  HomeIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  EllipsisHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  PlusIcon as PlusIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ClockIcon as ClockIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';

interface NavigationItem {
  name: string;
  href: string | ((address?: string) => string);
  icon: React.ElementType;
  iconSolid: React.ElementType;
}

const navigation: NavigationItem[] = [
  { name: 'Home', href: '/', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Create', href: '/create', icon: PlusIcon, iconSolid: PlusIconSolid },
  {
    name: 'Profile',
    href: (address?: string) => address ? `/profile/${address}` : '/profile',
    icon: UserIcon,
    iconSolid: UserIconSolid
  },
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { name: 'History', href: '/history', icon: ClockIcon, iconSolid: ClockIconSolid },
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
  const { address } = useAccount();

  return (
    <div className={`h-screen bg-background-sidebar border-r border-border flex flex-col transition-all duration-300 sticky top-0 ${isCollapsed ? 'w-16' : 'w-64'} overflow-hidden`}>
      {/* Logo Section with Collapse Button */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center justify-center flex-1 min-w-0">
            <div className={`rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 ${
              isCollapsed ? 'w-12 h-12' : 'w-full h-16'
            }`}>
              <img src="/logo.jpg" alt="ASTER FUN" className="w-full h-full object-cover" />
            </div>
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

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const itemHref = typeof item.href === 'function' ? item.href(address) : item.href;
            const isActive = pathname === itemHref;
            const Icon = isActive ? item.iconSolid : item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={itemHref}
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
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  text-gray-400 hover:text-white hover:bg-secondary-light
                `}
                title={isCollapsed ? 'More' : undefined}
              >
                <EllipsisHorizontalIcon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">More</span>}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-secondary-light border border-gray-700 rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    More
                  </div>
                )}
              </button>
              
            </div>
          </li>
        </ul>
        </div>
      </nav>
      
      {/* More Menu Popup Overlay */}
      {isMoreExpanded && (
        <>
          {/* Full-screen overlay */}
          <div className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm flex items-center justify-center" onClick={() => setIsMoreExpanded(false)}>
            {/* Popup content */}
            <div 
              className="bg-secondary-light border border-gray-700 rounded-xl p-6 w-80 mx-4 shadow-2xl transform animate-in zoom-in-95 duration-200" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">More Options</h3>
                <button
                  onClick={() => setIsMoreExpanded(false)}
                  className="text-gray-400 hover:text-white text-xl hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center transition"
                  title="Close"
                >
                  ✕
                </button>
              </div>
              
              {/* Menu items */}
              <div className="space-y-2 mb-6">
                {moreMenuItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-secondary rounded-lg transition-colors"
                    onClick={() => setIsMoreExpanded(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              
              {/* Social Links - Real professional icons */}
              <div className="pt-4 border-t border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Follow Us</h4>
                <div className="flex items-center gap-4">
                  {/* X/Twitter */}
                  <a
                    href="https://twitter.com/PumpBNB"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Follow us on X"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>

                  {/* Telegram */}
                  <a
                    href="https://t.me/PumpBNBOfficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Join our Telegram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L9.23 13.615l-2.97-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                    </svg>
                  </a>

                  {/* Discord */}
                  <a
                    href="https://discord.gg/PumpBNB"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Join our Discord"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
