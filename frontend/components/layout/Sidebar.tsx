'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const { address } = useAccount();
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMoreExpanded) {
        setIsMoreExpanded(false);
      }
    };

    if (isMoreExpanded) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMoreExpanded]);

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
                ref={moreButtonRef}
                onClick={() => setIsMoreExpanded(!isMoreExpanded)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${isMoreExpanded ? 'bg-secondary-light text-white' : 'text-gray-400 hover:text-white hover:bg-secondary-light'}
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
      
      {/* More Menu Popup - Rendered via Portal */}
      {mounted && isMoreExpanded && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2147483647, // Maximum z-index
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'auto',
          }}
          onClick={() => setIsMoreExpanded(false)}
        >
          {/* Dropdown positioned below the More button in sidebar */}
          <div
            style={{
              position: 'fixed',
              left: isCollapsed ? '80px' : '272px', // Position to the right of sidebar
              top: moreButtonRef.current ? `${moreButtonRef.current.getBoundingClientRect().top}px` : '300px',
              pointerEvents: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-secondary-light border border-gray-700 rounded-xl p-4 w-64 shadow-2xl animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">More Options</h3>
                <button
                  onClick={() => setIsMoreExpanded(false)}
                  className="text-gray-400 hover:text-white text-lg hover:bg-gray-700 rounded-full w-7 h-7 flex items-center justify-center transition"
                  title="Close (ESC)"
                >
                  ✕
                </button>
              </div>

              {/* Menu items */}
              <div className="space-y-1 mb-4">
                {moreMenuItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-secondary rounded-lg transition-colors text-sm"
                    onClick={() => setIsMoreExpanded(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Social Links */}
              <div className="pt-3 border-t border-gray-700">
                <h4 className="text-xs font-medium text-gray-400 mb-2">Follow Us</h4>
                <div className="flex items-center gap-2">
                  <a
                    href="https://x.com/Incentives01"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                    title="Follow us on X"
                  >
                    <Image src="https://www.idea-engine.ai/images/social_ic01.svg" width={14} height={14} alt="X" unoptimized />
                  </a>

                  <a
                    href="https://t.me/idea_engine_ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                    title="Join our Telegram"
                  >
                    <Image src="https://www.idea-engine.ai/images/social_ic02.svg" width={14} height={14} alt="Telegram" unoptimized />
                  </a>

                  <a
                    href="https://incentives101.substack.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                    title="Read our Substack"
                  >
                    <Image src="https://www.idea-engine.ai/images/social_ic03.svg" width={14} height={14} alt="Substack" unoptimized />
                  </a>

                  <a
                    href="https://www.instagram.com/idea_engine.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                    title="Follow us on Instagram"
                  >
                    <Image src="https://www.idea-engine.ai/images/social_ic04.svg" width={14} height={14} alt="Instagram" unoptimized />
                  </a>

                  <a
                    href="https://www.youtube.com/@IDEA-EngineAI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                    title="Subscribe on YouTube"
                  >
                    <Image src="https://www.idea-engine.ai/images/social_ic05.svg" width={14} height={14} alt="YouTube" unoptimized />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
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
