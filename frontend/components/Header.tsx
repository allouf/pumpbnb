'use client'

import Link from 'next/link'
import { ConnectButton } from './ConnectButton'

export function Header() {
  return (
    <header className="border-b border-gray-800 bg-secondary sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-primary">ASTER FUN</h1>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="hover:text-primary transition">
              Home
            </Link>
            <Link href="/create" className="hover:text-primary transition">
              Create Token
            </Link>
            <Link href="/portfolio" className="hover:text-primary transition">
              Portfolio
            </Link>
            <Link href="/dashboard" className="hover:text-primary transition">
              Dashboard
            </Link>
            <Link href="/history" className="hover:text-primary transition">
              History
            </Link>
          </nav>
        </div>
        <ConnectButton />
      </div>
    </header>
  )
}
