'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import {
  HomeIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  PlusIcon as PlusIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ClockIcon as ClockIconSolid,
  EllipsisHorizontalIcon as EllipsisHorizontalIconSolid
} from '@heroicons/react/24/solid';

interface NavItem {
  name: string;
  href: string | ((address?: string) => string);
  icon: React.ElementType;
  iconSolid: React.ElementType;
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Portfolio', href: '/portfolio', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { name: 'Create', href: '/create', icon: PlusIcon, iconSolid: PlusIconSolid },
  { name: 'History', href: '/history', icon: ClockIcon, iconSolid: ClockIconSolid },
];

// More dropdown menu items
const moreMenuItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Profile', href: (address?: string) => address ? `/profile/${address}` : '/profile' },
  { name: 'Support', href: '/support' },
  { name: 'How it works', href: '/how-it-works' },
  { name: 'Documentation', href: '/docs' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { address } = useAccount();
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only render portal on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-secondary border-t border-gray-800 z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigation.map((item) => {
            const itemHref = typeof item.href === 'function' ? item.href(address) : item.href;
            const isActive = pathname === itemHref;
            const Icon = isActive ? item.iconSolid : item.icon;

            return (
              <Link
                key={item.name}
                href={itemHref}
                className={`
                  flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-primary text-black'
                    : 'text-gray-400 hover:text-white hover:bg-secondary-light'
                  }
                `}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setIsMoreExpanded(true)}
            className={`
              flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200
              ${isMoreExpanded
                ? 'bg-primary text-black'
                : 'text-gray-400 hover:text-white hover:bg-secondary-light'
              }
            `}
          >
            <EllipsisHorizontalIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* More Menu Popup Overlay - Rendered via Portal to ensure it's on top of everything */}
      {mounted && isMoreExpanded && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center"
          onClick={() => setIsMoreExpanded(false)}
        >
          {/* Popup content - slides up from bottom on mobile */}
          <div
            className="bg-secondary-light border-t md:border border-gray-700 md:rounded-xl p-6 w-full md:w-80 max-w-sm md:mx-4 shadow-2xl transform animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
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
              {moreMenuItems.map((item) => {
                const itemHref = typeof item.href === 'function' ? item.href(address) : item.href;
                return (
                  <Link
                    key={item.name}
                    href={itemHref}
                    className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-secondary rounded-lg transition-colors"
                    onClick={() => setIsMoreExpanded(false)}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Social Links */}
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Follow Us</h4>
              <div className="flex items-center gap-3">
                <a
                  href="https://x.com/Incentives01"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                  title="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://t.me/your_telegram_channel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                  title="Telegram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L9.23 13.615l-2.97-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                  </svg>
                </a>
                <a
                  href="https://discord.gg/your_discord_server"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary-light flex items-center justify-center transition-colors"
                  title="Discord"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Safe area padding for bottom on mobile */}
            <div className="h-safe-area-inset-bottom md:hidden"></div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
