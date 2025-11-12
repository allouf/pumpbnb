import { useAccount, useSignMessage } from 'wagmi'
import { useState, useEffect } from 'react'
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

export function useWalletAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [showProfileCard, setShowProfileCard] = useState(false)

  const authenticate = async () => {
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

      // Store in localStorage
      localStorage.setItem('pumpbnb_user', JSON.stringify(userData))
      localStorage.setItem('pumpbnb_user_address', address.toLowerCase())

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
  }

  const refreshUser = async () => {
    if (!address) return

    try {
      const res = await fetch(`${API_URL}/api/profile/${address}`)
      const data = await res.json()

      if (data.success && data.data.user) {
        setUser(data.data.user)
        localStorage.setItem('pumpbnb_user', JSON.stringify(data.data.user))
      }
    } catch (error) {
      console.error('[useWalletAuth] Error refreshing user:', error)
    }
  }

  const logout = () => {
    setUser(null)
    setShowProfileCard(false)
    localStorage.removeItem('pumpbnb_user')
    localStorage.removeItem('pumpbnb_user_address')
  }

  // Auto-authenticate if wallet connects and no user
  useEffect(() => {
    if (isConnected && address && !user) {
      // Check localStorage first
      const storedUser = localStorage.getItem('pumpbnb_user')
      const storedAddress = localStorage.getItem('pumpbnb_user_address')

      if (storedUser && storedAddress === address.toLowerCase()) {
        console.log('[useWalletAuth] 📦 Restoring user from localStorage')
        setUser(JSON.parse(storedUser))
      } else {
        // Auto-authenticate on connect
        console.log('[useWalletAuth] 🚀 Auto-authenticating...')
        authenticate()
      }
    } else if (!isConnected && user) {
      // Clear user when disconnected
      logout()
    }
  }, [isConnected, address])

  return {
    user,
    isAuthenticating,
    authenticate,
    refreshUser,
    logout,
    showProfileCard,
    setShowProfileCard,
  }
}
