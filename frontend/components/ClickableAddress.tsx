'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ClickableAddressProps {
  address: string
  type?: 'address' | 'tx'
  showCopy?: boolean
  showExplorer?: boolean
  truncate?: boolean
  className?: string
  children?: React.ReactNode
}

export function ClickableAddress({ 
  address, 
  type = 'address', 
  showCopy = true, 
  showExplorer = true, 
  truncate = true,
  className = "",
  children 
}: ClickableAddressProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleExplorer = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const baseUrl = 'https://testnet.bscscan.com'
    const url = type === 'tx' 
      ? `${baseUrl}/tx/${address}`
      : `${baseUrl}/address/${address}`
    
    window.open(url, '_blank')
  }

  const displayAddress = truncate && address.length > 10
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span className="font-mono text-sm">
        {children || displayAddress}
      </span>

      {/* Buttons always visible - removed opacity-0 and group-hover */}
      <div className="flex items-center gap-1">
        {showCopy && (
          <button
            onClick={handleCopy}
            className="p-0.5 rounded hover:bg-gray-700 transition"
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? (
              <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}

        {showExplorer && (
          <button
            onClick={handleExplorer}
            className="p-0.5 rounded hover:bg-gray-700 transition"
            title={`View on BSC ${type === 'tx' ? 'transaction' : 'address'} explorer`}
          >
            <svg className="w-3 h-3 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// Convenience components
export function ClickableTransactionHash({ hash, className = "", children }: { 
  hash: string
  className?: string
  children?: React.ReactNode 
}) {
  return (
    <ClickableAddress 
      address={hash} 
      type="tx" 
      className={`text-blue-400 hover:text-blue-300 ${className}`}
      children={children}
    />
  )
}

export function ClickableWalletAddress({ address, className = "", children, showUsername = false, linkToProfile = true }: {
  address: string
  className?: string
  children?: React.ReactNode
  showUsername?: boolean
  linkToProfile?: boolean
}) {
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!showUsername || !address) return

    const fetchProfile = async () => {
      setLoading(true)
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'
        const res = await fetch(`${API_URL}/api/profile/${address}`)
        const data = await res.json()

        if (data.success && data.data?.user?.username) {
          setUsername(data.data.user.username)
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [address, showUsername])

  const displayText = showUsername && username
    ? username
    : children || (address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address)

  // Wrapper for profile navigation
  const ProfileLink = ({ children: linkChildren }: { children: React.ReactNode }) => {
    if (linkToProfile) {
      return (
        <Link
          href={`/profile/${address}`}
          className="hover:text-primary transition-colors cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {linkChildren}
        </Link>
      )
    }
    return <>{linkChildren}</>
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <ProfileLink>
        <span className={`font-mono text-sm text-gray-300 hover:text-primary cursor-pointer ${loading ? 'animate-pulse' : ''}`}>
          {displayText}
        </span>
      </ProfileLink>
      <div className="flex items-center gap-1">
        <button
          onClick={async (e) => {
            e.preventDefault()
            e.stopPropagation()
            try {
              await navigator.clipboard.writeText(address)
            } catch (error) {
              console.error('Failed to copy:', error)
            }
          }}
          className="p-0.5 rounded hover:bg-gray-700 transition"
          title="Copy to clipboard"
        >
          <svg className="w-3 h-3 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            window.open(`https://testnet.bscscan.com/address/${address}`, '_blank')
          }}
          className="p-0.5 rounded hover:bg-gray-700 transition"
          title="View on BSC explorer"
        >
          <svg className="w-3 h-3 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </div>
    </div>
  )
}