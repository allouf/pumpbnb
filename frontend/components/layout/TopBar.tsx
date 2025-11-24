'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const router = useRouter()

  const { isConnected } = useAccount()
  const { user, isAuthenticating, authenticate } = useWalletAuth()
  const { openConnectModal } = useConnectModal()

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
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex justify-between items-center px-2 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-4">
        {/* Left side - Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-md">
          <div className="relative flex items-center gap-1 sm:gap-2">
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
                id="search-token"
                name="search-token"
                className={`w-full bg-secondary text-white text-sm px-3 sm:px-4 py-2 rounded-lg border ${
                  isSearchFocused ? 'border-primary' : 'border-gray-700'
                } focus:border-primary outline-none transition-colors`}
              />
            </div>
            <button
              type="submit"
              aria-pressed="false"
              className="bg-primary text-black px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm hover:bg-primary-dark transition flex-shrink-0"
            >
              <span className="hidden xs:inline">Search</span>
              <svg className="xs:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Right side - Create Coin and Login/Wallet */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <Link
            href="/create"
            className="bg-primary text-black px-2 sm:px-4 py-2 rounded-lg font-bold hover:bg-primary-dark transition text-xs sm:text-sm whitespace-nowrap"
          >
            <span className="hidden sm:inline">create a coin</span>
            <span className="sm:hidden">+</span>
          </Link>

          {!isConnected ? (
            <button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="bg-secondary text-white px-2 sm:px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition border border-gray-600 text-xs sm:text-sm whitespace-nowrap"
            >
              {isAuthenticating ? '...' : <><span className="hidden sm:inline">log in</span><span className="sm:hidden">Login</span></>}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              {user?.profileImage ? (
                <Link href={`/profile/${user.walletAddress}`}>
                  <img
                    src={user.profileImage}
                    alt={user.username || 'Profile'}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition"
                  />
                </Link>
              ) : user ? (
                <Link
                  href={`/profile/${user.walletAddress}`}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:opacity-80 transition"
                >
                  <span className="text-xs sm:text-sm font-bold text-black uppercase">
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
