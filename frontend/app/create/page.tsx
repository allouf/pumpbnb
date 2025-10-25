'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACTS } from '@/lib/contracts'
import TokenFactoryABI from '@/lib/abis/TokenFactory.json'

export default function CreateTokenPage() {
  const { address, isConnected } = useAccount()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [metadataURI, setMetadataURI] = useState('')

  const { data: hash, isPending, writeContract, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      writeContract({
        address: CONTRACTS.TokenFactory as `0x${string}`,
        abi: TokenFactoryABI,
        functionName: 'createToken',
        args: [name, symbol, metadataURI],
      })
    } catch (err) {
      console.error('Error creating token:', err)
    }
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl font-bold mb-2 text-center">Create Your Token</h1>
        <p className="text-gray-400 text-center mb-8">
          Launch your meme coin in seconds. FREE creation, only gas costs!
        </p>

        <div className="bg-secondary-light p-8 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Token Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., PumpBNB Coin"
                required
                className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="symbol" className="block text-sm font-medium mb-2">
                Token Symbol
              </label>
              <input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., PUMP"
                required
                maxLength={10}
                className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="metadata" className="block text-sm font-medium mb-2">
                Metadata URI (Optional)
              </label>
              <input
                id="metadata"
                type="text"
                value={metadataURI}
                onChange={(e) => setMetadataURI(e.target.value)}
                placeholder="ipfs://... (optional)"
                className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload token metadata to IPFS and paste the URI here
              </p>
            </div>

            <div className="bg-secondary rounded-lg p-4 space-y-2 text-sm">
              <h3 className="font-semibold mb-2">Token Distribution:</h3>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Supply:</span>
                <span className="font-mono">1,000,000,000 tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bonding Curve:</span>
                <span className="font-mono">800,000,000 (80%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Creator (locked):</span>
                <span className="font-mono">200,000,000 (20%)</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                <span className="text-gray-400">Graduation Threshold:</span>
                <span className="font-mono text-primary">100 ASTER</span>
              </div>
            </div>

            {!isConnected && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                <p className="text-yellow-500 text-sm">
                  Please connect your wallet to create a token
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-500 text-sm">
                  Error: {error.message}
                </p>
              </div>
            )}

            {isSuccess && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <p className="text-green-500 text-sm">
                  Token created successfully! Transaction: {hash}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isConnected || isPending || isConfirming}
              className="w-full bg-primary text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending || isConfirming ? 'Creating...' : 'Create Token (FREE)'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By creating a token, you agree that the token is for entertainment purposes.
              You are responsible for compliance with applicable laws.
            </p>
          </form>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">Instant Trading</h3>
            <p className="text-sm text-gray-400">Start trading immediately after creation</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold mb-1">Fair Launch</h3>
            <p className="text-sm text-gray-400">No presale, everyone starts equal</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold mb-1">Auto Liquidity</h3>
            <p className="text-sm text-gray-400">Graduates to PancakeSwap at 100 ASTER</p>
          </div>
        </div>
      </div>
    </div>
  )
}
