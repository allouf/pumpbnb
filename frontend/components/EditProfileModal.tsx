'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useWalletAuth, type User } from '@/lib/hooks/useWalletAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

interface EditProfileModalProps {
  user: User
  onClose: () => void
  onSave: () => void
}

export function EditProfileModal({ user, onClose, onSave }: EditProfileModalProps) {
  const { refreshUser } = useWalletAuth()
  const [username, setUsername] = useState(user.username || '')
  const [bio, setBio] = useState(user.bio || '')
  const [profileImage, setProfileImage] = useState(user.profileImage || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch(`${API_URL}/api/upload/image`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setProfileImage(data.data.url)
      toast.success('Image uploaded successfully!')
    } catch (error: any) {
      console.error('[EditProfileModal] Error uploading image:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

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

      // Refresh the global user state so header updates immediately
      await refreshUser()

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
              profile image
            </label>

            {/* File Upload Button */}
            <div className="mb-3">
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 bg-secondary hover:bg-secondary-light border border-gray-700 rounded-lg px-4 py-2 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm">
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Max 5MB • JPG, PNG, GIF
              </p>
            </div>

            {/* Or URL Input */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Or enter image URL:</p>
              <input
                type="text"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                className="w-full bg-secondary text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-primary outline-none text-sm"
                placeholder="https://..."
              />
            </div>

            {/* Preview */}
            {profileImage && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={profileImage}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div>
                  <p className="text-xs text-gray-400">Preview</p>
                  <button
                    type="button"
                    onClick={() => setProfileImage('')}
                    className="text-xs text-red-500 hover:text-red-400 mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || uploading || showUsernameWarning || !username.trim()}
            className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving...' : uploading ? 'Uploading...' : 'save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
