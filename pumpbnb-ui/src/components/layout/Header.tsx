'use client';

import React, { useState } from 'react';
import { MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, isAuthenticated, walletAddress, loginWithWallet, logout, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleWalletConnect = async () => {
    if (isAuthenticated) {
      logout();
    } else {
      try {
        await loginWithWallet();
      } catch (error) {
        console.error('Wallet connection failed:', error);
      }
    }
  };

  return (
    <header className="h-16 w-full">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        
        {/* Mobile Menu + Logo */}
        <div className="flex items-center gap-4 lg:hidden">
          <Button variant="ghost" size="sm">
            <Bars3Icon className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-green rounded-md flex items-center justify-center text-black font-bold text-sm">
              A
            </div>
            <span className="text-lg font-bold text-text-primary">AsterFun</span>
          </div>
        </div>
        
        {/* Search Bar - Hidden on small mobile, visible on larger screens */}
        <div className="hidden sm:flex flex-1 max-w-md lg:max-w-lg">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2 
                bg-background-card border border-border rounded-lg
                text-text-primary placeholder-text-muted
                focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Right Side - Wallet Connection */}
        <div className="flex items-center gap-4">
          
          {/* Stats (Optional) */}
          <div className="hidden md:flex items-center gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary-green rounded-full"></div>
              <span>Stable Connection</span>
            </div>
          </div>

          {/* Wallet Connection Button */}
          <Button
            variant={isAuthenticated ? 'secondary' : 'primary'}
            onClick={handleWalletConnect}
            className="min-w-[140px]"
            disabled={isLoading}
          >
            {isLoading ? (
              'Connecting...'
            ) : isAuthenticated ? (
              <>
                <div className="w-2 h-2 bg-primary-green rounded-full mr-2"></div>
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}
              </>
            ) : (
              'Connect Wallet'
            )}
          </Button>

          {/* User Profile (when authenticated) */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>Welcome, {user.username || 'User'}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}