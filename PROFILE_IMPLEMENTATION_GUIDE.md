# Profile System Implementation Guide

## ✅ Completed (Backend)

### 1. Database Schema
- **File**: `backend/prisma/schema.prisma`
- **Models Added**:
  - `User`: Profile data (username, bio, image, stats)
  - `UserFollow`: Follow relationships
- **Migration**: `backend/prisma/migrations/20251112_add_user_profiles/migration.sql`

### 2. Backend API Routes
- **File**: `backend/src/routes/auth.routes.ts`
  - `POST /api/auth/nonce` - Get nonce for wallet signing
  - `POST /api/auth/verify` - Verify signature and create/get user

- **File**: `backend/src/routes/profile.routes.ts`
  - `GET /api/profile/:address` - Get user profile
  - `PUT /api/profile/:address` - Update profile
  - `POST /api/profile/:address/follow` - Follow/unfollow user

### 3. Routes Registered
- **File**: `backend/src/app.ts` - Auth and profile routes added

---

## 🔨 To Implement (Frontend)

### Phase 1: Wallet Authentication Hook

**File**: `frontend/lib/hooks/useWalletAuth.ts`

```typescript
import { useAccount, useSignMessage } from 'wagmi'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

interface User {
  id: string
  walletAddress: string
  username?: string
  bio?: string
  profileImage?: string
  followersCount: number
  followingCount: number
  createdTokensCount: number
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
      // Step 1: Get nonce
      const nonceRes = await fetch(`${API_URL}/api/auth/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      })
      const { data: { nonce } } = await nonceRes.json()

      // Step 2: Sign message
      const message = `Sign this message to authenticate with PumpBNB.\n\nNonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      // Step 3: Verify signature
      const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, signature, nonce }),
      })
      const { data: { user: userData } } = await verifyRes.json()

      setUser(userData)
      setShowProfileCard(true) // Show profile card after auth

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData))

      return userData
    } catch (error) {
      console.error('Authentication error:', error)
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Auto-authenticate if wallet connects and no user
  useEffect(() => {
    if (isConnected && address && !user) {
      // Check localStorage first
      const stored = localStorage.getItem('user')
      if (stored) {
        setUser(JSON.parse(stored))
      } else {
        authenticate()
      }
    }
  }, [isConnected, address])

  return {
    user,
    isAuthenticating,
    authenticate,
    showProfileCard,
    setShowProfileCard,
  }
}
```

### Phase 2: Profile Card Component

**File**: `frontend/components/ProfileCard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { EditProfileModal } from './EditProfileModal'

export function ProfileCard({ onClose }: { onClose: () => void }) {
  const { user } = useWalletAuth()
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const [showEditModal, setShowEditModal] = useState(false)

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      // Show toast
    }
  }

  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : ''

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-secondary-light rounded-xl p-6 max-w-md w-full mx-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.username}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xl font-bold text-black">
                    {user?.username?.[0] || address?.[2]}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold">@{user?.username || shortAddress}</h3>
                <span className="text-xs text-gray-400">dev</span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            className="text-primary text-sm hover:underline mb-4"
          >
            edit profile
          </button>

          {/* Wallet Info */}
          <div className="bg-secondary rounded-lg p-4 mb-4">
            <div className="text-2xl font-bold mb-1">$ 0.00</div>
            <div className="text-gray-400 text-sm mb-3">0.000 BNB</div>
            <div
              className="flex items-center gap-2 text-sm cursor-pointer"
              onClick={copyAddress}
            >
              <span>{shortAddress}</span>
              <button className="text-primary hover:underline">
                Copy Wallet Address
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button className="w-full bg-primary text-black font-bold py-2 rounded-lg hover:bg-primary-dark">
              transfer from wallet
            </button>
            <button className="text-sm text-gray-400 hover:text-white">
              or
            </button>
            <button
              onClick={() => disconnect()}
              className="w-full bg-secondary text-white font-bold py-2 rounded-lg hover:bg-gray-700"
            >
              disconnect wallet
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user!}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false)
            // Refresh user data
          }}
        />
      )}
    </>
  )
}
```

### Phase 3: Edit Profile Modal

**File**: `frontend/components/EditProfileModal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

interface EditProfileModalProps {
  user: any
  onClose: () => void
  onSave: () => void
}

export function EditProfileModal({ user, onClose, onSave }: EditProfileModalProps) {
  const [username, setUsername] = useState(user.username || '')
  const [bio, setBio] = useState(user.bio || '')
  const [profileImage, setProfileImage] = useState(user.profileImage || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/profile/${user.walletAddress}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, bio, profileImage }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(data.data.user))

      toast.success('Profile updated successfully!')
      onSave()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-secondary-light rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">edit profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">Update your profile information</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              username *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-secondary text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-primary outline-none"
              placeholder="Enter username"
            />
            <p className="text-xs text-gray-500 mt-1">
              you can change your username once every day
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-secondary text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-primary outline-none resize-none"
              placeholder="describe your profile"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              profile image URL
            </label>
            <input
              type="text"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              className="w-full bg-secondary text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-primary outline-none"
              placeholder="https://..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Phase 4: Profile Page

**File**: `frontend/app/profile/[address]/page.tsx`

```typescript
import { ProfilePageClient } from '@/components/ProfilePageClient'

export default function ProfilePage({ params }: { params: { address: string } }) {
  return <ProfilePageClient address={params.address} />
}
```

**File**: `frontend/components/ProfilePageClient.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

export function ProfilePageClient({ address }: { address: string }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [address])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/${address}`)
      const data = await res.json()
      if (data.success) {
        setProfile(data.data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!profile) return <div>User not found</div>

  const { user, tokens, portfolio } = profile

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-secondary-light rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.username}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <span className="text-3xl font-bold text-black">
                {user.username?.[0] || address[2]}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{user.username || address}</h1>
            <p className="text-gray-400 text-sm">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
            <a
              href={`https://testnet.bscscan.com/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline"
            >
              View on BSCScan ↗
            </a>
          </div>
        </div>

        {user.bio && (
          <p className="text-gray-300 mb-4">{user.bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-6 text-sm">
          <div>
            <button className="text-primary font-bold hover:underline">
              Follow
            </button>
          </div>
          <div>
            <span className="font-bold">{user.followersCount}</span>
            <span className="text-gray-400 ml-1">Followers</span>
          </div>
          <div>
            <span className="font-bold">{user.followingCount}</span>
            <span className="text-gray-400 ml-1">Following</span>
          </div>
          <div>
            <span className="font-bold">{user.createdTokensCount}</span>
            <span className="text-gray-400 ml-1">Created coins</span>
          </div>
        </div>
      </div>

      {/* Created Tokens */}
      {tokens && tokens.length > 0 && (
        <div className="bg-secondary-light rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Created Tokens</h2>
          <div className="space-y-2">
            {tokens.map((token: any) => (
              <Link
                key={token.id}
                href={`/token/${token.address}`}
                className="block bg-secondary p-4 rounded-lg hover:bg-gray-700"
              >
                <div className="flex items-center gap-3">
                  {token.imageUrl && (
                    <img src={token.imageUrl} alt={token.name} className="w-10 h-10 rounded-full" />
                  )}
                  <div>
                    <div className="font-bold">{token.name}</div>
                    <div className="text-sm text-gray-400">{token.symbol}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio/Balances */}
      {portfolio && portfolio.length > 0 && (
        <div className="bg-secondary-light rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Holdings</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm">
                <th className="pb-2">Token</th>
                <th className="pb-2">Balance</th>
                <th className="pb-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((holding: any) => (
                <tr key={holding.id} className="border-t border-gray-700">
                  <td className="py-2">{holding.tokenAddress.slice(0, 10)}...</td>
                  <td className="py-2">{(Number(holding.balance) / 1e18).toFixed(2)}</td>
                  <td className="py-2">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

### Phase 5: Integration with Web3Provider

**File**: `frontend/components/Web3Provider.tsx`

Add the profile card to your Web3Provider:

```typescript
import { ProfileCard } from './ProfileCard'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'

// Inside your Web3Provider component:
const { showProfileCard, setShowProfileCard } = useWalletAuth()

return (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        {children}
        {showProfileCard && (
          <ProfileCard onClose={() => setShowProfileCard(false)} />
        )}
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
)
```

---

## Deployment Steps

1. **Push to Git**:
   ```bash
   git add .
   git commit -m "Add user profile system with authentication"
   git push
   ```

2. **Backend Migration** will auto-run on Render deployment

3. **Test Flow**:
   - Connect wallet → Sign message → Profile card appears
   - Edit profile → Save changes
   - Visit `/profile/[your-address]` to see profile page

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/nonce` | Get signing nonce |
| POST | `/api/auth/verify` | Verify signature & auth |
| GET | `/api/profile/:address` | Get user profile |
| PUT | `/api/profile/:address` | Update profile |
| POST | `/api/profile/:address/follow` | Follow/unfollow user |

---

## Next Steps

1. Implement the frontend components above
2. Add profile image upload to IPFS
3. Add follow/unfollow UI interactions
4. Add profile link to navbar
5. Test the complete authentication flow
