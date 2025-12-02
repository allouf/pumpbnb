'use client'

import Link from 'next/link'

const steps = [
  {
    number: '01',
    title: 'Connect Your Wallet',
    description: 'Connect your Web3 wallet (MetaMask, Trust Wallet, etc.) to get started. Make sure you have BNB for gas fees and ASTER tokens for trading.',
    icon: '🔗',
  },
  {
    number: '02',
    title: 'Create or Discover Tokens',
    description: 'Launch your own meme token in seconds, or browse existing tokens on the platform. Each token starts on a bonding curve for fair price discovery.',
    icon: '🪙',
  },
  {
    number: '03',
    title: 'Trade on the Bonding Curve',
    description: 'Buy and sell tokens directly on the bonding curve. Prices adjust automatically based on supply and demand - no need for traditional order books.',
    icon: '📈',
  },
  {
    number: '04',
    title: 'Watch Tokens Graduate',
    description: 'When a token reaches 10,000 ASTER in liquidity, it graduates to PancakeSwap with permanent liquidity. LP tokens are burned to prevent rug pulls.',
    icon: '🎓',
  },
]

const features = [
  {
    title: 'Fair Launch',
    description: 'No presales, no team allocations. Everyone starts equal with bonding curve pricing.',
    icon: '⚖️',
  },
  {
    title: 'Anti-Rug',
    description: 'Liquidity is locked in smart contracts. After graduation, LP tokens are burned forever.',
    icon: '🔒',
  },
  {
    title: 'Creator Rewards',
    description: 'Token creators earn 0.3% of all trading volume on their tokens.',
    icon: '💰',
  },
  {
    title: 'Instant Trading',
    description: 'No waiting for liquidity. Trade immediately on the bonding curve.',
    icon: '⚡',
  },
  {
    title: 'Transparent Pricing',
    description: 'Bonding curve math is open and predictable. See exactly how price changes with buys/sells.',
    icon: '📊',
  },
  {
    title: 'Community Driven',
    description: 'The best tokens are decided by the community through organic trading activity.',
    icon: '👥',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-secondary pt-24 px-4 pb-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How ASTER FUN Works</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            The fairest way to launch and trade meme tokens on BNB Chain
          </p>
        </div>

        {/* Steps */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">Getting Started</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-secondary-light border border-gray-700 rounded-xl p-6 relative overflow-hidden group hover:border-primary transition"
              >
                <div className="absolute top-4 right-4 text-6xl font-bold text-gray-800 group-hover:text-primary/20 transition">
                  {step.number}
                </div>
                <div className="relative z-10">
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bonding Curve Explanation */}
        <div className="mb-20 bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Understanding the Bonding Curve</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-500 text-sm">↑</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-500">When You Buy</h4>
                    <p className="text-gray-400 text-sm">Price increases. You get tokens, ASTER goes into the curve's liquidity pool.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-500 text-sm">↓</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-red-500">When You Sell</h4>
                    <p className="text-gray-400 text-sm">Price decreases. You get ASTER back from the pool, tokens are returned to the curve.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-500 text-sm">🎓</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-500">Graduation</h4>
                    <p className="text-gray-400 text-sm">At 10,000 ASTER liquidity, the token migrates to PancakeSwap with burned LP tokens.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-secondary rounded-xl p-6">
              <div className="text-center mb-4">
                <span className="text-sm text-gray-400">Bonding Curve Formula</span>
              </div>
              <div className="bg-secondary-light rounded-lg p-4 font-mono text-sm text-center">
                <p className="text-primary">Price = k × Supply²</p>
              </div>
              <p className="text-xs text-gray-500 text-center mt-4">
                The quadratic bonding curve ensures early buyers get better prices, 
                rewarding early discovery while maintaining fair access for everyone.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">Platform Features</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-secondary-light border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fee Structure */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">Fee Structure</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">📈</span>
                Bonding Curve Phase
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Fee</span>
                  <span className="font-bold">1%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">→ Creator Share</span>
                  <span className="text-green-500">0.3%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">→ Platform Share</span>
                  <span className="text-primary">0.7%</span>
                </div>
              </div>
            </div>
            <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">🎓</span>
                Post-Graduation (PancakeSwap)
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Fee</span>
                  <span className="font-bold">0.3%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">→ Creator Share</span>
                  <span className="text-green-500">0.15%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">→ Platform Share</span>
                  <span className="text-primary">0.15%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-6">
            Launch your token or start trading in seconds
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/create"
              className="bg-primary text-black px-8 py-3 rounded-lg font-bold hover:bg-primary-dark transition"
            >
              Create Token
            </Link>
            <Link
              href="/"
              className="bg-secondary-light border border-gray-700 px-8 py-3 rounded-lg font-bold hover:border-primary transition"
            >
              Browse Tokens
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
