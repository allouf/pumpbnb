'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center" onClick={() => setIsMoreExpanded(false)}>
            {/* Popup content */}
            <div
              className="bg-secondary-light border border-gray-700 rounded-xl p-4 sm:p-6 w-[calc(100%-2rem)] sm:w-80 max-w-sm mx-4 shadow-2xl transform animate-in zoom-in-95 duration-200"
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
              
              {/* Social Links */}
              <div className="pt-4 border-t border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Follow Us</h4>
                <div className="flex items-center gap-3">
                  <a
                    href="https://x.com/Incentives01"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                    title="Follow us on X"
                  >
                    <Image src="https://www.idea-engine.ai/images/social_ic01.svg" width={18} height={18} alt="X" unoptimized />
                  </a>

                  <a
                    href="https://t.me/idea_engine_ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                    title="Join our Telegram"
                  >
                    <Image src="https://www.idea-engine.ai/images/social_ic02.svg" width={18} height={18} alt="Telegram" unoptimized />
                  </a>

                  <a
                    href="https://incentives101.substack.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                    title="Read our Substack"
                  >
                    <Image src="https://www.idea-engine.ai/images/social_ic03.svg" width={18} height={18} alt="Substack" unoptimized />
                  </a>

                  <a
                    href="https://www.instagram.com/idea_engine.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                    title="Follow us on Instagram"
                  >
                    <Image src="https://www.idea-engine.ai/images/social_ic04.svg" width={18} height={18} alt="Instagram" unoptimized />
                  </a>

                  <a
                    href="https://www.youtube.com/@IDEA-EngineAI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                    title="Subscribe on YouTube"
                  >
                    <Image src="https://www.idea-engine.ai/images/social_ic05.svg" width={18} height={18} alt="YouTube" unoptimized />
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
