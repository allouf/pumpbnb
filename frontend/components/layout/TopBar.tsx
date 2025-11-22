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
      <div className="flex justify-between items-center px-4 py-3 gap-4">
        {/* Left side - Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative flex items-center gap-2">
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
            className="bg-primary text-black px-4 py-2 rounded-lg font-bold hover:bg-primary-dark transition text-sm"
          >
            create a coin
          </Link>

          {!isConnected || !user ? (
            <button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="bg-secondary text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition border border-gray-600 text-sm"
            >
              {isAuthenticating ? 'Authenticating...' : 'log in'}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {user.profileImage ? (
                <Link href={`/profile/${user.walletAddress}`}>
                  <img
                    src={user.profileImage}
                    alt={user.username || 'Profile'}
                    className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition"
                  />
                </Link>
              ) : (
                <Link
                  href={`/profile/${user.walletAddress}`}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:opacity-80 transition"
                >
                  <span className="text-sm font-bold text-black uppercase">
                    {user.username?.[0] || user.walletAddress[2]}
                  </span>
                </Link>
              )}
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
