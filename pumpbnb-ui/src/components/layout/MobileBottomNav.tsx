'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  PlusIcon,
  ChartBarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  PlusIcon as PlusIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  iconSolid: React.ElementType;
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Create', href: '/create', icon: PlusIcon, iconSolid: PlusIconSolid },
  { name: 'Advanced', href: '/advanced', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { name: 'Profile', href: '/profile', icon: UserIcon, iconSolid: UserIconSolid },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background-sidebar border-t border-border z-30">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive ? item.iconSolid : item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-primary-green text-black' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-card'
                }
              `}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}