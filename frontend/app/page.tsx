import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
              Launch Your Meme Coin on BNB Chain
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Create and trade tokens with automated bonding curves. Graduate to PancakeSwap at 100 ASTER market cap.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/create"
                className="bg-primary text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-dark transition"
              >
                Create Token (FREE)
              </Link>
              <Link
                href="/tokens"
                className="border border-primary text-primary px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary/10 transition"
              >
                Browse Tokens
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-secondary-light p-6 rounded-xl">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">Instant Launch</h3>
              <p className="text-gray-400">
                Create your token for FREE. Only pay gas costs. No presale, no team allocation during bonding curve.
              </p>
            </div>
            <div className="bg-secondary-light p-6 rounded-xl">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-2">Bonding Curve</h3>
              <p className="text-gray-400">
                Trade on automated bonding curves with ASTER token. Only 1% trading fee (0.3% creator, 0.7% protocol).
              </p>
            </div>
            <div className="bg-secondary-light p-6 rounded-xl">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-bold mb-2">Auto Graduate</h3>
              <p className="text-gray-400">
                Automatically migrate to PancakeSwap at 100 ASTER threshold. Liquidity permanently locked.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$0</div>
              <div className="text-gray-400">Token Creation Fee</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1%</div>
              <div className="text-gray-400">Trading Fee</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100</div>
              <div className="text-gray-400">ASTER to Graduate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">3s</div>
              <div className="text-gray-400">Block Time</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-secondary py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>PumpBNB - Built on BNB Smart Chain | Testnet v1.0</p>
          <p className="mt-2 text-sm">Smart contracts audited and deployed on BSC Testnet</p>
        </div>
      </footer>
    </div>
  );
}
