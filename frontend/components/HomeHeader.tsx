'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface HomeHeaderProps {
  onSearch?: (query: string) => void
}

export function HomeHeader({ onSearch }: HomeHeaderProps = {}) {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { isConnected } = useAccount()
  const { user, isAuthenticating, authenticate } = useWalletAuth()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // If it looks like an address, go directly to token page
      if (searchQuery.startsWith('0x') && searchQuery.length === 42) {
        router.push(`/token/${searchQuery}`)
      } else {
        // Call the onSearch callback if provided (for home page)
        // Otherwise redirect to tokens page (for other pages)
        if (onSearch) {
          onSearch(searchQuery)
        } else {
          router.push(`/tokens?search=${encodeURIComponent(searchQuery)}`)
        }
      }
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    if (onSearch) {
      onSearch('')
    }
  }

  const handleLogin = async () => {
    if (!isConnected) {
      // Show connect wallet modal
      document.querySelector<HTMLButtonElement>('[data-testid="rk-connect-button"]')?.click()
    } else if (!user) {
      // User is connected but not authenticated, trigger authentication
      await authenticate()
    }
  }

  return (
    <div className="mb-8">
      {/* Top Row: Create Coin and Login/Wallet */}
      <div className="flex justify-end items-center gap-3 mb-4">
        <Link
          href="/create"
          className="bg-primary text-black px-6 py-2 rounded-lg font-bold hover:bg-primary-dark transition"
        >
          create a coin
        </Link>

        {!isConnected || !user ? (
          <button
            onClick={handleLogin}
            disabled={isAuthenticating}
            className="bg-secondary text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-700 transition border border-gray-600"
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

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a token by name, symbol, or address..."
            className="w-full bg-secondary text-white px-4 py-3 pr-12 rounded-lg border border-gray-700 focus:border-primary outline-none text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-24 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-sm"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-black px-4 py-1.5 rounded-md font-bold hover:bg-primary-dark transition text-sm"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  )
}
