'use client'

import { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { EditProfileModal } from './EditProfileModal'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface ProfileCardProps {
  onClose: () => void
}

export function ProfileCard({ onClose }: ProfileCardProps) {
  const { user, refreshUser } = useWalletAuth()
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const [showEditModal, setShowEditModal] = useState(false)

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success('Address copied to clipboard!')
    }
  }

  const handleDisconnect = () => {
    disconnect()
    onClose()
  }

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ''

  if (!user || !address) {
    return null
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div
          className="bg-secondary-light rounded-xl p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.username || 'Profile'}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xl font-bold text-black uppercase">
                    {user.username?.[0] || address[2]}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold">@{user.username || shortAddress}</h3>
                <span className="text-xs text-gray-400">dev</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            className="text-primary text-sm hover:underline mb-4 block"
          >
            edit profile
          </button>

          {/* Stats */}
          <div className="flex gap-4 text-sm mb-4">
            <Link
              href={`/profile/${address}`}
              className="hover:text-primary"
              onClick={onClose}
            >
              <span className="font-bold">{user.followersCount}</span>
              <span className="text-gray-400 ml-1">Followers</span>
            </Link>
            <Link
              href={`/profile/${address}`}
              className="hover:text-primary"
              onClick={onClose}
            >
              <span className="font-bold">{user.followingCount}</span>
              <span className="text-gray-400 ml-1">Following</span>
            </Link>
            <Link
              href={`/profile/${address}`}
              className="hover:text-primary"
              onClick={onClose}
            >
              <span className="font-bold">{user.createdTokensCount}</span>
              <span className="text-gray-400 ml-1">Created coins</span>
            </Link>
          </div>

          {/* Wallet Info */}
          <div className="bg-secondary rounded-lg p-4 mb-4">
            <div className="text-2xl font-bold mb-1">$ 0.00</div>
            <div className="text-gray-400 text-sm mb-3">0.000 BNB</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">{shortAddress}</span>
              <button
                onClick={copyAddress}
                className="text-primary hover:underline"
              >
                Copy Wallet Address
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Link
              href={`/profile/${address}`}
              onClick={onClose}
              className="w-full bg-primary text-black font-bold py-2 rounded-lg hover:bg-primary-dark text-center transition"
            >
              View Profile
            </Link>
            <div className="text-sm text-gray-400 text-center">or</div>
            <button
              onClick={handleDisconnect}
              className="w-full bg-secondary text-white font-bold py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={async () => {
            setShowEditModal(false)
            await refreshUser()
          }}
        />
      )}
    </>
  )
}
