'use client'

import Link from 'next/link'

// This will be replaced with real data from the blockchain
const SAMPLE_TOKENS = [
  {
    address: '0xE1bD0AFB5A41fDEd89678D2826eD9F3c6062dF3a',
    name: 'Sample Token',
    symbol: 'SAMPLE',
    creator: '0x900333E7D9BFa2781308C8A4203BF2823c605Ef0',
    bondingCurve: '0xCefD1ff0849AcDe7ebE6f0Ee26c96Bc17B490da9',
    progress: 45,
    marketCap: '45 ASTER',
  },
]

export default function TokensPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-2">Browse Tokens</h1>
        <p className="text-gray-400 mb-8">
          Discover and trade the latest meme coins on BNB Chain
        </p>

        <div className="grid gap-4">
          {SAMPLE_TOKENS.map((token) => (
            <Link
              key={token.address}
              href={`/token/${token.address}`}
              className="bg-secondary-light p-6 rounded-xl hover:bg-secondary-light/80 transition border border-gray-800 hover:border-primary/50"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{token.name}</h3>
                  <p className="text-gray-400">${token.symbol}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{token.marketCap}</div>
                  <p className="text-sm text-gray-400">Market Cap</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress to Graduation</span>
                  <span className="font-semibold">{token.progress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${token.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 ASTER</span>
                  <span>100 ASTER</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-400">Created by: </span>
                  <span className="font-mono text-xs">{token.creator.slice(0, 6)}...{token.creator.slice(-4)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                    Bonding Curve
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {SAMPLE_TOKENS.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">No tokens yet</h3>
            <p className="text-gray-400 mb-6">Be the first to create a token!</p>
            <Link
              href="/create"
              className="inline-block bg-primary text-black px-8 py-3 rounded-lg font-bold hover:bg-primary-dark transition"
            >
              Create Token
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
