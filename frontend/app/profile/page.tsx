'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'

export default function ProfilePage() {
  const router = useRouter()
  const { address, isConnected, isConnecting } = useAccount()
  const { open } = useWeb3Modal()

  useEffect(() => {
    // If connected, redirect to user's profile page
    if (isConnected && address) {
      router.replace(`/profile/${address}`)
    }
  }, [isConnected, address, router])

  // Show loading while checking connection or redirecting
  if (isConnecting || (isConnected && address)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    )
  }

  // Show connect wallet prompt for guests
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3">
          Connect Your Wallet
        </h1>

        {/* Description */}
        <p className="text-gray-400 mb-8 leading-relaxed">
          Connect your wallet to view your profile, track your created tokens,
          see your trading history, and manage your portfolio.
        </p>

        {/* Connect Button */}
        <button
          onClick={() => open()}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Connect Wallet
        </button>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-sm text-gray-500">
            New to crypto wallets?{' '}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition"
            >
              Get MetaMask
            </a>
          </p>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="text-lg mb-1">🎨</div>
            <p className="text-xs text-gray-400">Created Tokens</p>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="text-lg mb-1">📊</div>
            <p className="text-xs text-gray-400">Trade History</p>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="text-lg mb-1">💼</div>
            <p className="text-xs text-gray-400">Portfolio</p>
          </div>
        </div>
      </div>
    </div>
  )
}
