'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CONTRACTS } from '@/lib/contracts/addresses'

const sections = [
  { id: 'overview', title: 'Overview' },
  { id: 'contracts', title: 'Smart Contracts' },
  { id: 'tokenomics', title: 'Tokenomics' },
  { id: 'api', title: 'API Reference' },
  { id: 'integration', title: 'Integration Guide' },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview')

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-secondary pb-12">
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Documentation</h1>
          <p className="text-gray-400">
            Technical documentation for developers and integrators
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-secondary-light border border-gray-700 rounded-xl p-4 lg:sticky lg:top-24">
              <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-3">Contents</h3>
              <ul className="space-y-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        activeSection === section.id
                          ? 'bg-primary text-black font-medium'
                          : 'text-gray-400 hover:text-white hover:bg-secondary'
                      }`}
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {/* Overview */}
            <section id="overview" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Overview</h2>
              <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
                <p className="text-gray-300 mb-4">
                  ASTER FUN is a decentralized token launchpad on BNB Chain that enables anyone to create and trade meme tokens 
                  using an automated bonding curve mechanism. The platform ensures fair launches with no presales and provides 
                  built-in liquidity through the bonding curve.
                </p>
                <h3 className="font-bold mb-2">Key Features</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                  <li>Instant token creation with customizable metadata</li>
                  <li>Quadratic bonding curve for fair price discovery</li>
                  <li>Automatic graduation to PancakeSwap at threshold</li>
                  <li>Built-in anti-rug protection with burned LP tokens</li>
                  <li>Creator fee rewards on trading volume</li>
                </ul>
              </div>
            </section>

            {/* Smart Contracts */}
            <section id="contracts" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Smart Contracts</h2>
              <div className="space-y-4">
                <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
                  <h3 className="font-bold mb-2">Token Factory</h3>
                  <p className="text-gray-400 text-sm mb-3">Creates new tokens and their associated bonding curves</p>
                  <div className="bg-secondary rounded-lg p-3 font-mono text-sm break-all">
                    <span className="text-gray-500">Address: </span>
                    <span className="text-primary">{CONTRACTS.TOKEN_FACTORY}</span>
                  </div>
                </div>

                <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
                  <h3 className="font-bold mb-2">Platform Config</h3>
                  <p className="text-gray-400 text-sm mb-3">Central configuration for fees, thresholds, and platform settings</p>
                  <div className="bg-secondary rounded-lg p-3 font-mono text-sm break-all">
                    <span className="text-gray-500">Address: </span>
                    <span className="text-primary">{CONTRACTS.PLATFORM_CONFIG}</span>
                  </div>
                </div>

                <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
                  <h3 className="font-bold mb-2">Graduation Manager</h3>
                  <p className="text-gray-400 text-sm mb-3">Handles migration to PancakeSwap when graduation threshold is reached</p>
                  <div className="bg-secondary rounded-lg p-3 font-mono text-sm break-all">
                    <span className="text-gray-500">Address: </span>
                    <span className="text-primary">{CONTRACTS.GRADUATION_MANAGER}</span>
                  </div>
                </div>

                <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
                  <h3 className="font-bold mb-2">ASTER Token</h3>
                  <p className="text-gray-400 text-sm mb-3">The base trading token used on the platform</p>
                  <div className="bg-secondary rounded-lg p-3 font-mono text-sm break-all">
                    <span className="text-gray-500">Address: </span>
                    <span className="text-primary">{CONTRACTS.ASTER_TOKEN}</span>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-500 text-sm">
                    ⚠️ These are BSC Testnet addresses. Mainnet addresses will be published after audit completion.
                  </p>
                </div>
              </div>
            </section>

            {/* Tokenomics */}
            <section id="tokenomics" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Tokenomics</h2>
              <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
                <h3 className="font-bold mb-4">Token Distribution</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-secondary rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Total Supply</p>
                    <p className="text-2xl font-bold">1,000,000,000</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Bonding Curve Allocation</p>
                    <p className="text-2xl font-bold text-green-500">80%</p>
                  </div>
                </div>

                <h3 className="font-bold mb-4">Bonding Curve Parameters</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-700">
                      <tr>
                        <td className="py-3 text-gray-400">Virtual Token Reserve</td>
                        <td className="py-3 text-right font-mono">200,000,000 tokens</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-gray-400">Graduation Threshold</td>
                        <td className="py-3 text-right font-mono">100 ASTER</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-gray-400">Trading Fee (Bonding)</td>
                        <td className="py-3 text-right font-mono">1% (0.3% creator, 0.7% platform)</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-gray-400">Trading Fee (Post-Grad)</td>
                        <td className="py-3 text-right font-mono">0.3% (0.15% creator, 0.15% platform)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section id="api" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">API Reference</h2>
              <div className="space-y-4">
                <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
                  <h3 className="font-bold mb-2">Base URL</h3>
                  <div className="bg-secondary rounded-lg p-3 font-mono text-sm">
                    <span className="text-primary">{process.env.NEXT_PUBLIC_API_URL || 'https://api.aster.fun'}</span>
                  </div>
                </div>

                <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
                  <h3 className="font-bold mb-4">Endpoints</h3>
                  <div className="space-y-4">
                    <ApiEndpoint
                      method="GET"
                      path="/api/tokens"
                      description="List all tokens with pagination and filters"
                      params={['page', 'limit', 'sortBy', 'order', 'graduated']}
                    />
                    <ApiEndpoint
                      method="GET"
                      path="/api/tokens/:address"
                      description="Get detailed token information"
                    />
                    <ApiEndpoint
                      method="GET"
                      path="/api/tokens/:address/trades"
                      description="Get recent trades for a token"
                      params={['limit']}
                    />
                    <ApiEndpoint
                      method="GET"
                      path="/api/tokens/:address/holders"
                      description="Get token holder distribution"
                    />
                    <ApiEndpoint
                      method="GET"
                      path="/api/tokens/:address/ohlcv"
                      description="Get OHLCV candlestick data"
                      params={['timeframe', 'limit']}
                    />
                    <ApiEndpoint
                      method="GET"
                      path="/api/user/:address/portfolio"
                      description="Get user's token holdings"
                    />
                    <ApiEndpoint
                      method="GET"
                      path="/health"
                      description="API health check and service status"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Integration Guide */}
            <section id="integration" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Integration Guide</h2>
              <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
                <h3 className="font-bold mb-4">Reading Token Price</h3>
                <p className="text-gray-400 text-sm mb-4">
                  You can read the current token price from the bonding curve contract:
                </p>
                <div className="bg-secondary rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-gray-300">{`// Using ethers.js
const bondingCurve = new ethers.Contract(
  bondingCurveAddress,
  BondingCurveABI,
  provider
);

// Get current price
const price = await bondingCurve.getCurrentPrice();

// Get buy quote (how many tokens for X ASTER)
const tokensOut = await bondingCurve.getBuyPrice(asterAmount);

// Get sell quote (how much ASTER for X tokens)
const asterOut = await bondingCurve.getSellPrice(tokenAmount);`}</pre>
                </div>

                <h3 className="font-bold mb-4 mt-8">Executing Trades</h3>
                <p className="text-gray-400 text-sm mb-4">
                  To execute trades, first approve ASTER spending, then call buy/sell:
                </p>
                <div className="bg-secondary rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-gray-300">{`// Approve ASTER spending
await asterToken.approve(bondingCurveAddress, amount);

// Buy tokens
await bondingCurve.buy(
  asterAmount,    // ASTER to spend
  minTokensOut,   // Minimum tokens (slippage protection)
  deadline        // Transaction deadline
);

// Sell tokens
await bondingCurve.sell(
  tokenAmount,    // Tokens to sell
  minAsterOut,    // Minimum ASTER (slippage protection)
  deadline        // Transaction deadline
);`}</pre>
                </div>
              </div>
            </section>

            {/* Footer Links */}
            <div className="flex flex-wrap gap-4 pt-8 border-t border-gray-700">
              <Link
                href="/support"
                className="text-primary hover:underline"
              >
                Need help? Visit Support →
              </Link>
              <a
                href="https://github.com/your-repo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                GitHub Repository
              </a>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function ApiEndpoint({
  method,
  path,
  description,
  params,
}: {
  method: string
  path: string
  description: string
  params?: string[]
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-500',
    POST: 'bg-blue-500/20 text-blue-500',
    PUT: 'bg-yellow-500/20 text-yellow-500',
    DELETE: 'bg-red-500/20 text-red-500',
  }

  return (
    <div className="border-b border-gray-700 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-3 mb-2">
        <span className={`px-2 py-1 rounded text-xs font-bold ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-primary text-sm">{path}</code>
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
      {params && (
        <div className="mt-2 flex flex-wrap gap-2">
          {params.map((param) => (
            <span key={param} className="text-xs bg-secondary px-2 py-1 rounded text-gray-500">
              {param}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
