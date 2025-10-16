import React from 'react';

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">How it works</h1>
        <p className="text-text-secondary">Learn about PumpBNB's token creation and trading mechanism</p>
      </div>
      
      <div className="space-y-8">
        {/* Step 1 */}
        <div className="bg-background-card rounded-lg border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-green rounded-full flex items-center justify-center text-black font-bold">
              1
            </div>
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Create Your Token</h3>
              <p className="text-text-secondary">
                Launch your own meme coin on BNB Chain with just a name, symbol, and description. 
                No coding required - we handle all the smart contract deployment.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-background-card rounded-lg border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-green rounded-full flex items-center justify-center text-black font-bold">
              2
            </div>
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Bonding Curve Trading</h3>
              <p className="text-text-secondary">
                Your token starts trading immediately on our bonding curve. Price increases as more people buy,
                creating natural price discovery and early adopter rewards.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-background-card rounded-lg border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-green rounded-full flex items-center justify-center text-black font-bold">
              3
            </div>
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Graduate to PancakeSwap</h3>
              <p className="text-text-secondary">
                When your token reaches $69K market cap, it automatically graduates to PancakeSwap 
                with locked liquidity, enabling full decentralized trading.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-background-card rounded-lg border border-border p-6">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Why PumpBNB?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="text-primary-green">✓</div>
              <span className="text-text-secondary">Fair launch for everyone</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-primary-green">✓</div>
              <span className="text-text-secondary">Low fees on BNB Chain</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-primary-green">✓</div>
              <span className="text-text-secondary">Instant liquidity</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-primary-green">✓</div>
              <span className="text-text-secondary">Auto-graduation system</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}