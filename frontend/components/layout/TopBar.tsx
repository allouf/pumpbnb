'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const { isConnected } = useAccount()
  const { user, isAuthenticating, authenticate } = useWalletAuth()
  const { openConnectModal } = useConnectModal()

  // Check if we're on a token page (for back button)
  const isTokenPage = pathname?.startsWith('/token/')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // If it looks like an address, go directly to token page
      if (searchQuery.startsWith('0x') && searchQuery.length === 42) {
        router.push(`/token/${searchQuery}`)
      } else {
        // Redirect to home page with search query
        router.push(`/?search=${encodeURIComponent(searchQuery)}`)
      }
      setSearchQuery('')
    }
  }

  const handleLogin = async () => {
    if (!isConnected) {
      // Show connect wallet modal using RainbowKit's hook
      if (openConnectModal) {
        openConnectModal()
      }
    } else if (!user) {
      // User is connected but not authenticated, trigger authentication
      try {
        await authenticate()
      } catch (error) {
        console.error('Authentication failed:', error)
      }
    }
  }

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Mobile Layout - Pump.fun style */}
      <div className="md:hidden flex flex-col">
        {/* Row 1: Search Bar (full width) */}
        <div className="px-4 py-2">
          <form onSubmit={handleSearch} className="w-full">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search..."
                  aria-label="Search..."
                  autoComplete="off"
                  enterKeyHint="search"
                  id="search-token"
                  name="search-token"
                  className={`w-full bg-secondary text-white text-sm px-3 py-2 rounded-md border ${
                    isSearchFocused ? 'border-primary' : 'border-gray-700'
                  } focus:border-primary outline-none transition-colors`}
                />
              </div>
              <button
                type="submit"
                aria-pressed="false"
                className="bg-primary text-black px-3 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition flex-shrink-0"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Row 2: Logo (left) | Create coin + Login (right) */}
        <div className="flex justify-between items-center px-4 py-2">
          {/* Left side - Logo icon */}
          <Link href="/" className="flex items-center">
            <img
              src="/logo.jpg"
              alt="ASTER FUN"
              width={25}
              height={25}
              className="rounded"
            />
          </Link>

          {/* Right side - Create coin + Login buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="bg-primary text-black px-3 h-8 rounded-md font-medium text-sm hover:bg-primary/90 transition inline-flex items-center justify-center"
            >
              Create coin
            </Link>

            {!isConnected ? (
              <button
                onClick={handleLogin}
                disabled={isAuthenticating}
                className="bg-primary text-black px-3 h-8 rounded-md font-medium text-sm hover:bg-primary/90 transition"
              >
                {isAuthenticating ? '...' : 'Log in'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {user?.profileImage ? (
                  <Link href={`/profile/${user.walletAddress}`}>
                    <img
                      src={user.profileImage}
                      alt={user.username || 'Profile'}
                      className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition"
                    />
                  </Link>
                ) : user ? (
                  <Link
                    href={`/profile/${user.walletAddress}`}
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:opacity-80 transition"
                  >
                    <span className="text-sm font-bold text-black uppercase">
                      {user.username?.[0] || user.walletAddress[2]}
                    </span>
                  </Link>
                ) : null}
                <ConnectButton
                  showBalance={false}
                  accountStatus="avatar"
                />
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Back button (only on token pages) */}
        {isTokenPage && (
          <div className="px-4 py-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition text-sm"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Layout - Original style */}
      <div className="hidden md:flex justify-between items-center px-6 py-3 gap-4">
        {/* Left side - Search Bar - aligned with content panels below */}
        <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-md ml-4">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search..."
                aria-label="Search..."
                autoComplete="off"
                enterKeyHint="search"
                id="search-token-desktop"
                name="search-token-desktop"
                className={`w-full bg-secondary text-white text-sm px-4 py-2 rounded-lg border ${
                  isSearchFocused ? 'border-primary' : 'border-gray-700'
                } focus:border-primary outline-none transition-colors`}
              />
            </div>
            <button
              type="submit"
              aria-pressed="false"
              className="bg-primary text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary-dark transition flex-shrink-0"
            >
              Search
            </button>
          </div>
        </form>

        {/* Right side - Create Coin and Login/Wallet */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/create"
            className="bg-primary text-black px-4 py-2 rounded-lg font-bold hover:bg-primary-dark transition text-sm whitespace-nowrap"
          >
            create a coin
          </Link>

          {!isConnected ? (
            <button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="bg-secondary text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition border border-gray-600 text-sm whitespace-nowrap"
            >
              {isAuthenticating ? '...' : 'log in'}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {user?.profileImage ? (
                <Link href={`/profile/${user.walletAddress}`}>
                  <img
                    src={user.profileImage}
                    alt={user.username || 'Profile'}
                    className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition"
                  />
                </Link>
              ) : user ? (
                <Link
                  href={`/profile/${user.walletAddress}`}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:opacity-80 transition"
                >
                  <span className="text-sm font-bold text-black uppercase">
                    {user.username?.[0] || user.walletAddress[2]}
                  </span>
                </Link>
              ) : null}
              <ConnectButton
                showBalance={false}
                accountStatus={{
                  smallScreen: 'avatar',
                  largeScreen: 'full',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
