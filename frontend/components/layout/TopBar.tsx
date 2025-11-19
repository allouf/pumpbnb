'use client'

import { useAccount } from 'wagmi'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function TopBar() {
  const { isConnected } = useAccount()
  const { user, isAuthenticating, authenticate } = useWalletAuth()
  const { openConnectModal } = useConnectModal()

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
      <div className="flex justify-between items-center px-4 py-3">
        {/* Left side - can add breadcrumbs or page title later */}
        <div className="flex items-center gap-2">
          {/* Placeholder for future page-specific content */}
        </div>

        {/* Right side - Create Coin and Login/Wallet */}
        <div className="flex items-center gap-3">
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
