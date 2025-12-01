'use client'

import { useEffect, useState } from 'react'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import type { Abi } from 'viem'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { useUsdPrice, asterToUsd, formatUsdPrice } from '@/lib/hooks/useUsdPrice'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { CONTRACTS } from '@/lib/contracts'
import MockERC20ABI from '@/lib/abis/MockERC20.json'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

// Helper function to convert IPFS URLs to gateway URLs
const getImageUrl = (url: string | undefined): string => {
  if (!url) return ''

  // If it's an IPFS path, convert to gateway URL
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
  }

  // If it's just an IPFS hash (starts with Qm or bafy)
  if (url.startsWith('Qm') || url.startsWith('bafy')) {
    return `https://gateway.pinata.cloud/ipfs/${url}`
  }

  // If URL doesn't have a protocol, assume it needs https://
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
    return `https://gateway.pinata.cloud/ipfs/${url}`
  }

  return url
}

interface ProfileData {
  user: {
    id: string
    walletAddress: string
    username?: string
    bio?: string
    profileImage?: string
    followersCount: number
    followingCount: number
    createdTokensCount: number
  }
  tokens: any[]
  portfolio: any[]
}

type TabType = 'coins' | 'balances' | 'replies'

// Component to show P&L stats
function PnLStats({ userAddress }: { userAddress: string }) {
  const [pnl, setPnl] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function fetchPnL() {
      try {
        const response = await fetch(`${API_URL}/api/users/${userAddress}/pnl`)
        const data = await response.json()
        if (data.success) {
          setPnl(data.data)
        }
      } catch (error) {
        console.error('[PnLStats] Error fetching:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPnL()
  }, [userAddress])
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-secondary-light rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }
  
  if (!pnl) return null
  
  const totalPnL = parseFloat(pnl.totalPnL || '0') / 1e18
  const realizedPnL = parseFloat(pnl.realizedPnL || '0') / 1e18
  const totalBuyVol = parseFloat(pnl.totalBuyVolume || '0') / 1e18
  const totalSellVol = parseFloat(pnl.totalSellVolume || '0') / 1e18
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <div className={`rounded-xl p-4 border ${
        totalPnL >= 0 ? 'bg-secondary-light border-gray-700' : 'bg-red-500/10 border-red-500/30'
      }`}>
        <p className="text-xs text-gray-400 mb-1">Total P&L</p>
        <p className={`text-lg font-bold ${totalPnL >= 0 ? 'text-white' : 'text-red-500'}`}>
          {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
        </p>
      </div>
      <div className={`rounded-xl p-4 border ${
        realizedPnL >= 0 ? 'bg-secondary-light border-gray-700' : 'bg-red-500/10 border-red-500/30'
      }`}>
        <p className="text-xs text-gray-400 mb-1">Realized</p>
        <p className={`text-lg font-bold ${realizedPnL >= 0 ? 'text-white' : 'text-red-500'}`}>
          {realizedPnL >= 0 ? '+' : ''}{realizedPnL.toFixed(2)}
        </p>
      </div>
      <div className="bg-secondary-light rounded-xl p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-1">Buy Vol</p>
        <p className="text-lg font-bold text-white">{totalBuyVol.toFixed(2)}</p>
      </div>
      <div className="bg-secondary-light rounded-xl p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-1">Trades</p>
        <p className="text-lg font-bold text-white">{pnl.totalTrades || 0}</p>
      </div>
    </div>
  )
}

// Component to show token holdings from the correct API
function TokenHoldings({ userAddress }: { userAddress: string }) {
  const [holdings, setHoldings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function fetchHoldings() {
      try {
        const response = await fetch(`${API_URL}/api/users/${userAddress}/portfolio`)
        const data = await response.json()
        if (data.success && data.data?.tokens) {
          setHoldings(data.data.tokens)
        }
      } catch (error) {
        console.error('[TokenHoldings] Error fetching:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchHoldings()
  }, [userAddress])
  
  if (isLoading) {
    return (
      <div className="bg-secondary-light rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Token Holdings</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }
  
  if (holdings.length === 0) {
    return (
      <div className="bg-secondary-light rounded-xl p-6 text-center">
        <p className="text-gray-400">No token holdings yet</p>
        <Link href="/" className="text-primary hover:underline text-sm mt-2 inline-block">
          Browse tokens to start trading
        </Link>
      </div>
    )
  }
  
  return (
    <div className="bg-secondary-light rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Token Holdings</h2>
      <div className="space-y-3">
        {holdings.map((holding: any) => (
          <Link
            key={holding.tokenAddress}
            href={`/token/${holding.tokenAddress}`}
            className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-gray-700 transition"
          >
            <div className="flex items-center gap-3">
              {holding.imageUrl ? (
                <img
                  src={getImageUrl(holding.imageUrl)}
                  alt={holding.symbol}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{holding.symbol?.slice(0, 3)}</span>
                </div>
              )}
              <div>
                <div className="font-semibold">{holding.name || 'Unknown'}</div>
                <div className="text-sm text-gray-400">{holding.symbol || 'UNKNOWN'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">
                {(Number(holding.balance || 0) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-400">{holding.symbol}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function ProfilePageClient({ address }: { address: string }) {
  const { address: connectedAddress } = useAccount()
  const { usdRate } = useUsdPrice()
  const { refreshUser } = useWalletAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('coins')

  const isOwnProfile = connectedAddress?.toLowerCase() === address.toLowerCase()

  // Fetch BNB balance
  const { data: bnbBalance } = useBalance({
    address: address as `0x${string}`,
  })

  // Fetch ASTER balance
  const { data: asterBalance } = useReadContract({
    address: CONTRACTS.ASTER_TOKEN as `0x${string}`,
    abi: MockERC20ABI.abi as Abi,
    functionName: 'balanceOf',
    args: [address],
  })

  // Format balances
  const bnbAmount = bnbBalance ? parseFloat(formatUnits(bnbBalance.value, 18)) : 0
  const asterAmount = asterBalance ? parseFloat(formatUnits(asterBalance as bigint, 18)) : 0
  const bnbUsd = bnbAmount * 600 // Approximate BNB price, you can fetch real price if needed
  const asterUsd = asterToUsd(asterAmount, usdRate)

  useEffect(() => {
    fetchProfile()
  }, [address])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/profile/${address}`)
      const data = await res.json()

      if (data.success) {
        setProfile(data.data)
        console.log('[ProfilePage] ✅ Profile loaded:', data.data.user.username)
      } else {
        console.error('[ProfilePage] ❌ Failed to load profile:', data.error)
      }
    } catch (error) {
      console.error('[ProfilePage] ❌ Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!connectedAddress) {
      toast.error('Please connect your wallet to follow')
      return
    }

    setFollowLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/profile/${address}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerAddress: connectedAddress }),
      })

      const data = await res.json()

      if (data.success) {
        setFollowing(data.data.following)
        // Update follower count
        if (profile) {
          setProfile({
            ...profile,
            user: {
              ...profile.user,
              followersCount: profile.user.followersCount + (data.data.following ? 1 : -1),
            },
          })
        }
        toast.success(data.data.following ? 'Followed!' : 'Unfollowed')
      } else {
        toast.error(data.error || 'Failed to follow/unfollow')
      }
    } catch (error) {
      console.error('[ProfilePage] Error following/unfollowing:', error)
      toast.error('Failed to follow/unfollow')
    } finally {
      setFollowLoading(false)
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    toast.success('Address copied!')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploadingImage(true)
    try {
      // Upload to IPFS
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch(`${API_URL}/api/ipfs/upload`, {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Failed to upload image')
      }

      // Update profile with new image URL
      const updateRes = await fetch(`${API_URL}/api/profile/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: uploadData.data.url }),
      })

      const updateData = await updateRes.json()

      if (updateData.success) {
        setProfile({
          ...profile!,
          user: updateData.data.user,
        })
        // Refresh the global user state so header updates immediately
        await refreshUser()
        toast.success('Profile image updated!')
      } else {
        throw new Error(updateData.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('[ProfilePage] Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEditProfile = () => {
    if (profile) {
      setEditUsername(profile.user.username || '')
      setEditBio(profile.user.bio || '')
      setIsEditingProfile(true)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const updateRes = await fetch(`${API_URL}/api/profile/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editUsername || undefined,
          bio: editBio || undefined,
        }),
      })

      const updateData = await updateRes.json()

      if (updateData.success) {
        setProfile({
          ...profile!,
          user: updateData.data.user,
        })
        // Refresh the global user state so header updates immediately
        await refreshUser()
        setIsEditingProfile(false)
        toast.success('Profile updated!')
      } else {
        toast.error(updateData.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('[ProfilePage] Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-secondary-light rounded-xl p-6 animate-pulse">
          <div className="h-20 w-20 bg-secondary rounded-full mb-4"></div>
          <div className="h-8 w-48 bg-secondary rounded mb-2"></div>
          <div className="h-4 w-32 bg-secondary rounded"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-secondary-light rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold mb-2">User not found</h2>
          <p className="text-gray-400">This wallet address has no profile yet.</p>
        </div>
      </div>
    )
  }

  const { user, tokens, portfolio } = profile
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-secondary-light rounded-xl p-4 sm:p-6 mb-6">
        {/* Mobile: Stack vertically, Desktop: Horizontal */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
          {/* Avatar - Larger on mobile */}
          <div className="relative group mx-auto sm:mx-0">
            {user.profileImage ? (
              <img
                src={getImageUrl(user.profileImage)}
                alt={user.username || 'Profile'}
                className="w-24 h-24 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-primary/30"
              />
            ) : (
              <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-primary flex items-center justify-center border-4 border-primary/30">
                <span className="text-4xl sm:text-3xl font-bold text-black uppercase">
                  {user.username?.[0] || address[2]}
                </span>
              </div>
            )}
            {isOwnProfile && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </label>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold mb-1">
              {user.username || shortAddress}
            </h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <p className="text-gray-400 text-sm">{shortAddress}</p>
              <button
                onClick={copyAddress}
                className="text-primary text-sm hover:underline"
              >
                Copy
              </button>
            </div>
            <a
              href={`https://testnet.bscscan.com/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline inline-flex items-center gap-1"
            >
              View on BSCScan ↗
            </a>
          </div>

          {/* Follow/Edit Button - Hidden on mobile, shown on desktop */}
          <div className="hidden sm:block">
            {!isOwnProfile ? (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-6 py-2 rounded-lg font-bold transition ${
                  following
                    ? 'bg-secondary text-white hover:bg-gray-700'
                    : 'bg-primary text-black hover:bg-primary-dark'
                }`}
              >
                {followLoading ? '...' : following ? 'Unfollow' : 'Follow'}
              </button>
            ) : (
              <button
                onClick={handleEditProfile}
                className="px-6 py-2 rounded-lg font-bold bg-secondary text-white hover:bg-gray-700 transition border border-gray-600"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Mobile Follow/Edit Button */}
        <div className="sm:hidden mb-4">
          {!isOwnProfile ? (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`w-full px-6 py-2.5 rounded-lg font-bold transition ${
                following
                  ? 'bg-secondary text-white hover:bg-gray-700 border border-gray-600'
                  : 'bg-primary text-black hover:bg-primary-dark'
              }`}
            >
              {followLoading ? '...' : following ? 'Unfollow' : 'Follow'}
            </button>
          ) : (
            <button
              onClick={handleEditProfile}
              className="w-full px-6 py-2.5 rounded-lg font-bold bg-secondary text-white hover:bg-gray-700 transition border border-gray-600"
            >
              Edit Profile
            </button>
          )}
        </div>

        {user.bio && (
          <p className="text-gray-300 mb-4 text-center sm:text-left">{user.bio}</p>
        )}

        {/* Stats - Compact row that fits on one line */}
        <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-1">
            <span className="font-bold">{user.followersCount}</span>
            <span className="text-gray-400">Followers</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">{user.followingCount}</span>
            <span className="text-gray-400">Following</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">{user.createdTokensCount}</span>
            <span className="text-gray-400">Created</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-secondary-light rounded-xl mb-6 overflow-hidden">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('coins')}
            className={`flex-1 px-6 py-3 font-medium transition ${
              activeTab === 'coins'
                ? 'text-primary bg-primary/10 border-b-2 border-primary'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            } ${activeTab === 'coins' ? 'rounded-tl-xl' : ''}`}
          >
            Coins
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex-1 px-6 py-3 font-medium transition ${
              activeTab === 'balances'
                ? 'text-primary bg-primary/10 border-b-2 border-primary'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            Balances
          </button>
          <button
            onClick={() => setActiveTab('replies')}
            className={`flex-1 px-6 py-3 font-medium transition ${
              activeTab === 'replies'
                ? 'text-primary bg-primary/10 border-b-2 border-primary'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            } ${activeTab === 'replies' ? 'rounded-tr-xl' : ''}`}
          >
            Replies
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'coins' && (
        <>
          {/* Created Tokens */}
          {tokens && tokens.length > 0 ? (
        <div className="bg-secondary-light rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Created Tokens</h2>
          <div className="space-y-2">
            {tokens.map((token: any) => (
              <Link
                key={token.id}
                href={`/token/${token.address}`}
                className="block bg-secondary p-4 rounded-lg hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  {token.imageUrl && (
                    <img
                      src={getImageUrl(token.imageUrl)}
                      alt={token.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-bold">{token.name}</div>
                    <div className="text-sm text-gray-400">{token.symbol}</div>
                  </div>
                  {token.stats && (
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {(() => {
                          const marketCapUsd = Number(token.stats.marketCapUsd || 0);
                          const marketCapAster = Number(token.stats.marketCap || 0);

                          // Show USD if > $1, otherwise show ASTER
                          if (marketCapUsd >= 1) {
                            if (marketCapUsd >= 1000) {
                              return `$${(marketCapUsd / 1000).toFixed(1)}K`;
                            }
                            return `$${marketCapUsd.toFixed(2)}`;
                          } else if (marketCapAster > 0) {
                            return `${marketCapAster.toFixed(2)} ASTER`;
                          }
                          return '$0';
                        })()}
                      </div>
                      <div className="text-xs text-gray-400">MCap</div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
          ) : (
            <div className="bg-secondary-light rounded-xl p-6 text-center">
              <p className="text-gray-400">No tokens created yet</p>
            </div>
          )}
        </>
      )}

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          {/* P&L Stats - Only show on own profile */}
          {isOwnProfile && <PnLStats userAddress={address} />}
          
          {/* Native Token Balances */}
          <div className="bg-secondary-light rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Native Tokens</h2>
            <div className="space-y-3">
              {/* BNB Balance */}
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-[#F3BA2F]">
                    <svg viewBox="0 0 126.61 126.61" className="w-6 h-6">
                      <path fill="#fff" d="M38.73 53.2l24.59-24.58 24.6 24.6 14.3-14.31L63.32 0l-38.9 38.9zM0 63.31l14.3-14.31 14.31 14.31-14.31 14.3zM38.73 73.41l24.59 24.59 24.6-24.6 14.31 14.29-38.9 38.91-38.91-38.88zM97.99 63.31l14.3-14.31 14.32 14.31-14.31 14.3z"/>
                      <path fill="#fff" d="M77.83 63.3l-14.51-14.52-10.73 10.73-1.24 1.23-2.54 2.54 14.51 14.5 14.51-14.47z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold">BNB</div>
                    <div className="text-sm text-gray-400">Native Gas Token</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {bnbBalance ? `${bnbAmount.toFixed(4)} BNB` : 'Loading...'}
                  </div>
                  <div className="text-sm text-gray-400">
                    ${bnbUsd.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* ASTER Balance */}
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src="/aster.webp"
                    alt="ASTER"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">ASTER</div>
                    <div className="text-sm text-gray-400">Trading Token</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {asterBalance !== undefined ? `${asterAmount.toFixed(2)} ASTER` : 'Loading...'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatUsdPrice(asterUsd)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Created Tokens Balance */}
          {tokens && tokens.length > 0 && (
            <div className="bg-secondary-light rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Created Tokens</h2>
              <div className="space-y-3">
                {tokens.map((token: any) => (
                  <Link
                    key={token.id}
                    href={`/token/${token.address}`}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-gray-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      {token.imageUrl ? (
                        <img
                          src={getImageUrl(token.imageUrl)}
                          alt={token.symbol}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">{token.symbol?.slice(0, 3)}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{token.name}</div>
                        <div className="text-sm text-gray-400">{token.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">200M {token.symbol}</div>
                      <div className="text-sm text-gray-400">Creator allocation</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Other Token Holdings - Fetch from TokenHolder data */}
          <TokenHoldings userAddress={address} />
        </div>
      )}

      {/* Replies Tab */}
      {activeTab === 'replies' && (
        <div className="bg-secondary-light rounded-xl p-6 text-center">
          <p className="text-gray-400">Replies feature coming soon</p>
        </div>
      )}


      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-secondary-light rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-secondary text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-primary outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Can be changed once per day</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={3}
                  className="w-full bg-secondary text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-primary outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-secondary text-white hover:bg-gray-700 transition border border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-black font-bold hover:bg-primary-dark transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
