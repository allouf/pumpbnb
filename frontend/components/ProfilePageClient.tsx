'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

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

export function ProfilePageClient({ address }: { address: string }) {
  const { address: connectedAddress } = useAccount()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const isOwnProfile = connectedAddress?.toLowerCase() === address.toLowerCase()

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
      <div className="bg-secondary-light rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.username || 'Profile'}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <span className="text-3xl font-bold text-black uppercase">
                {user.username?.[0] || address[2]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">
              {user.username || shortAddress}
            </h1>
            <div className="flex items-center gap-2 mb-2">
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

          {/* Follow Button */}
          {!isOwnProfile && (
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
          )}
        </div>

        {user.bio && (
          <p className="text-gray-300 mb-4">{user.bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-6 text-sm">
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
                className="block bg-secondary p-4 rounded-lg hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  {token.imageUrl && (
                    <img
                      src={token.imageUrl}
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
                        ${(Number(token.stats.marketCapUsd) / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-gray-400">MCap</div>
                    </div>
                  )}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                  <th className="pb-3">Token</th>
                  <th className="pb-3">Balance</th>
                  <th className="pb-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((holding: any) => (
                  <tr key={holding.id} className="border-t border-gray-700">
                    <td className="py-3">
                      <Link
                        href={`/token/${holding.tokenAddress}`}
                        className="text-primary hover:underline"
                      >
                        {holding.tokenAddress.slice(0, 10)}...
                      </Link>
                    </td>
                    <td className="py-3">
                      {(Number(holding.balance) / 1e18).toFixed(2)}
                    </td>
                    <td className="py-3 text-gray-400">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!tokens || tokens.length === 0) && (!portfolio || portfolio.length === 0) && (
        <div className="bg-secondary-light rounded-xl p-6 text-center">
          <p className="text-gray-400">No activity yet</p>
        </div>
      )}
    </div>
  )
}
