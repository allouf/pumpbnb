import React from 'react';

export default function AdvancedPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Advanced Trading</h1>
        <p className="text-text-secondary">Professional trading tools and analytics</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Interface */}
        <div className="lg:col-span-2 bg-background-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Trading Interface</h2>
          <div className="aspect-[16/9] bg-background-sidebar rounded-lg flex items-center justify-center">
            <p className="text-text-secondary">Advanced Trading Chart</p>
          </div>
        </div>
        
        {/* Tools Panel */}
        <div className="space-y-6">
          <div className="bg-background-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Trading Tools</h3>
            <div className="space-y-3">
              <div className="p-3 bg-background-sidebar rounded border">
                <div className="font-medium text-text-primary">Limit Orders</div>
                <div className="text-sm text-text-secondary">Set buy/sell orders</div>
              </div>
              <div className="p-3 bg-background-sidebar rounded border">
                <div className="font-medium text-text-primary">Stop Loss</div>
                <div className="text-sm text-text-secondary">Risk management</div>
              </div>
              <div className="p-3 bg-background-sidebar rounded border">
                <div className="font-medium text-text-primary">DCA Bot</div>
                <div className="text-sm text-text-secondary">Dollar cost averaging</div>
              </div>
            </div>
          </div>
          
          <div className="bg-background-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Analytics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">24h Volume</span>
                <span className="text-text-primary font-medium">$2.3M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Active Pairs</span>
                <span className="text-text-primary font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total TVL</span>
                <span className="text-text-primary font-medium">$45.6M</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}