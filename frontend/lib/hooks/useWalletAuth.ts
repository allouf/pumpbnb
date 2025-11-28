import { useAccount, useSignMessage } from 'wagmi'
import React, { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react'
import { toast } from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

export interface User {
  id: string
  walletAddress: string
  username?: string
  bio?: string
  profileImage?: string
  followersCount: number
  followingCount: number
  createdTokensCount: number
  createdAt: string
  updatedAt: string
  lastUsernameChange?: string
}

interface WalletAuthContextType {
  user: User | null
  isAuthenticating: boolean
  authenticate: () => Promise<User | undefined>
  refreshUser: () => Promise<void>
  logout: () => void
  showProfileCard: boolean
  setShowProfileCard: (show: boolean) => void
}

const WalletAuthContext = createContext<WalletAuthContextType | null>(null)

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [showProfileCard, setShowProfileCard] = useState(false)

  const authenticate = useCallback(async () => {
    if (!address || !isConnected) return

    setIsAuthenticating(true)

    try {
      console.log('[useWalletAuth] 🔐 Starting authentication for:', address)

      // Step 1: Get nonce
      console.log('[useWalletAuth] 📝 Requesting nonce...')
      const nonceRes = await fetch(`${API_URL}/api/auth/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      })

      if (!nonceRes.ok) {
        throw new Error('Failed to get nonce')
      }

      const nonceData = await nonceRes.json()
      console.log('[useWalletAuth] ✅ Nonce received:', nonceData.data.nonce.slice(0, 10) + '...')
      const { nonce } = nonceData.data

      // Step 2: Sign message
      console.log('[useWalletAuth] ✍️ Requesting signature...')
      const message = `Sign this message to authenticate with PumpBNB.\n\nNonce: ${nonce}`
      const signature = await signMessageAsync({ message })
      console.log('[useWalletAuth] ✅ Message signed')

      // Step 3: Verify signature
      console.log('[useWalletAuth] 🔍 Verifying signature...')
      const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          nonce
        }),
      })

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json()
        throw new Error(errorData.error || 'Failed to verify signature')
      }

      const verifyData = await verifyRes.json()
      console.log('[useWalletAuth] ✅ Authentication successful:', verifyData.data.user)
      const userData = verifyData.data.user

      setUser(userData)
      setShowProfileCard(true) // Show profile card after auth

      toast.success('Successfully authenticated!')

      return userData
    } catch (error: any) {
      console.error('[useWalletAuth] ❌ Authentication error:', error)

      if (error.message.includes('User rejected')) {
        toast.error('Signature rejected')
      } else {
        toast.error(error.message || 'Authentication failed')
      }

      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }, [address, isConnected, signMessageAsync])

  const refreshUser = useCallback(async () => {
    if (!address) return

    try {
      console.log('[useWalletAuth] 🔄 Refreshing user data...')
      const res = await fetch(`${API_URL}/api/profile/${address}`)
      const data = await res.json()

      if (data.success && data.data.user) {
        console.log('[useWalletAuth] ✅ User data refreshed')
        setUser(data.data.user)
      }
    } catch (error) {
      console.error('[useWalletAuth] Error refreshing user:', error)
    }
  }, [address])

  const logout = useCallback(() => {
    setUser(null)
    setShowProfileCard(false)
  }, [])

  // Restore user from backend on wallet connect
  useEffect(() => {
    if (isConnected && address && !user) {
      // Always fetch fresh user data from backend
      const fetchUserFromBackend = async () => {
        try {
          console.log('[useWalletAuth] 🔍 Checking backend for user...')
          const res = await fetch(`${API_URL}/api/profile/${address}`)
          const data = await res.json()

          if (data.success && data.data.user) {
            console.log('[useWalletAuth] ✅ User found in backend')
            setUser(data.data.user)
          } else {
            // User doesn't exist in backend - need to authenticate
            console.log('[useWalletAuth] ⏳ User not found, waiting for login...')
          }
        } catch (error) {
          console.log('[useWalletAuth] ⏳ Could not reach backend, waiting for login...')
        }
      }

      fetchUserFromBackend()
    } else if (!isConnected && user) {
      // Clear user when disconnected
      logout()
    }
  }, [isConnected, address, user, logout])

  const value = {
    user,
    isAuthenticating,
    authenticate,
    refreshUser,
    logout,
    showProfileCard,
    setShowProfileCard,
  }

  return React.createElement(
    WalletAuthContext.Provider,
    { value },
    children
  )
}

export function useWalletAuth() {
  const context = useContext(WalletAuthContext)
  if (!context) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider')
  }
  return context
}
