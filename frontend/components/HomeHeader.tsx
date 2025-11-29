'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HomeHeaderProps {
  onSearch?: (query: string) => void
}

export function HomeHeader({ onSearch }: HomeHeaderProps = {}) {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // If it looks like an address, go directly to token page
      if (searchQuery.startsWith('0x') && searchQuery.length === 42) {
        router.push(`/token/${searchQuery}`)
      } else {
        // Call the onSearch callback if provided (for home page)
        // Otherwise redirect to tokens page (for other pages)
        if (onSearch) {
          onSearch(searchQuery)
        } else {
          router.push(`/?search=${encodeURIComponent(searchQuery)}`)
        }
      }
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    if (onSearch) {
      onSearch('')
    }
  }

  return (
    <div className="mb-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a token by name, symbol, or address..."
            className="w-full bg-secondary text-white px-4 py-3 pr-12 rounded-lg border border-gray-700 focus:border-primary outline-none text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-24 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-sm"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-black px-4 py-1.5 rounded-md font-bold hover:bg-primary-dark transition text-sm"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  )
}
