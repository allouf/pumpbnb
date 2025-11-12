'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import type { User } from '@/lib/hooks/useWalletAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

interface EditProfileModalProps {
  user: User
  onClose: () => void
  onSave: () => void
}

export function EditProfileModal({ user, onClose, onSave }: EditProfileModalProps) {
  const [username, setUsername] = useState(user.username || '')
  const [bio, setBio] = useState(user.bio || '')
  const [profileImage, setProfileImage] = useState(user.profileImage || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error('Username is required')
      return
    }

    // Validate username (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Username can only contain letters, numbers, and underscores')
      return
    }

    if (username.length < 3 || username.length > 20) {
      toast.error('Username must be between 3 and 20 characters')
      return
    }

    setSaving(true)
    try {
      console.log('[EditProfileModal] 💾 Saving profile...', {
        username,
        bio: bio ? 'present' : 'empty',
        profileImage: profileImage ? 'present' : 'empty',
      })

      const res = await fetch(`${API_URL}/api/profile/${user.walletAddress}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          bio: bio.trim() || undefined,
          profileImage: profileImage.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      console.log('[EditProfileModal] ✅ Profile saved successfully')

      // Update localStorage
      localStorage.setItem('pumpbnb_user', JSON.stringify(data.data.user))

      toast.success('Profile updated successfully!')
      onSave()
    } catch (error: any) {
      console.error('[EditProfileModal] ❌ Error saving profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // Check if username was recently changed
  const canChangeUsername = () => {
    if (!user.lastUsernameChange) return true

    const lastChange = new Date(user.lastUsernameChange)
    const now = new Date()
    const hoursSinceChange = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60)

    return hoursSinceChange >= 24
  }

  const usernameChanged = username !== (user.username || '')
  const showUsernameWarning = usernameChanged && !canChangeUsername()

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-secondary-light rounded-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">edit profile</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">Update your profile information</p>

        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2">
              username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-secondary text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-primary outline-none"
              placeholder="Enter username"
              maxLength={20}
            />
            {showUsernameWarning ? (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ You can only change your username once every 24 hours
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                you can change your username once every day
              </p>
            )}
          </div>

          {/* Bio */}
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
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {bio.length}/200
            </p>
          </div>

          {/* Profile Image */}
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
            {profileImage && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                <img
                  src={profileImage}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || showUsernameWarning || !username.trim()}
            className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving...' : 'save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
