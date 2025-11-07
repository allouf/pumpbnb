'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface SharePopupProps {
  isOpen: boolean
  onClose: () => void
  tokenName: string
  tokenSymbol: string
  url: string
}

export function SharePopup({ isOpen, onClose, tokenName, tokenSymbol, url }: SharePopupProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setCopied(false)
    }
  }, [isOpen])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareOptions = [
    {
      name: 'Twitter',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        const text = `Check out ${tokenName} ($${tokenSymbol}) on ASTER FUN! 🚀`
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        window.open(twitterUrl, '_blank')
      }
    },
    {
      name: 'Telegram',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L9.23 13.615l-2.97-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
        </svg>
      ),
      color: 'bg-blue-400 hover:bg-blue-500',
      action: () => {
        const text = `Check out ${tokenName} ($${tokenSymbol}) on ASTER FUN! 🚀`
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
        window.open(telegramUrl, '_blank')
      }
    },
    {
      name: 'Discord',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => {
        // Discord doesn't have a direct share URL, so we'll copy the link
        handleCopyLink()
      }
    }
  ]

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="relative bg-secondary-light border border-gray-700 rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Share {tokenSymbol}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Token Info */}
        <div className="bg-secondary rounded-xl p-4 mb-6">
          <h4 className="text-white font-semibold mb-1">{tokenName}</h4>
          <p className="text-gray-400 text-sm">Share this token with your network!</p>
        </div>

        {/* Share Options */}
        <div className="space-y-3 mb-6">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={option.action}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${option.color} text-white`}
            >
              {option.icon}
              <span className="font-medium">Share on {option.name}</span>
            </button>
          ))}
        </div>

        {/* Copy Link */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 bg-secondary border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-primary text-black hover:bg-primary/90'
              }`}
            >
              {copied ? (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}