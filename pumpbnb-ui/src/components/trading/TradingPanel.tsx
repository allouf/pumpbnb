'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Token, formatMarketCap, formatPrice } from '@/lib/mock-data/tokens';
import { 
  Cog6ToothIcon, 
  InformationCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon 
} from '@heroicons/react/24/outline';

interface TradingPanelProps {
  token: Token;
}

interface TopHolder {
  address: string;
  percentage: number;
  amount: string;
}

export function TradingPanel({ token }: TradingPanelProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [bnbAmount, setBnbAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [slippage, setSlippage] = useState(1.0);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [isTrading, setIsTrading] = useState(false);

  // Mock top holders data
  const topHolders: TopHolder[] = [
    { address: '0x1234...5678', percentage: 25.18, amount: '25.2M' },
    { address: '0xabcd...ef01', percentage: 15.31, amount: '15.3M' },
    { address: '0x9876...5432', percentage: 8.45, amount: '8.5M' },
    { address: '0xfedc...ba98', percentage: 6.72, amount: '6.7M' },
    { address: '0x5555...aaaa', percentage: 4.33, amount: '4.3M' },
  ];

  // Calculate token amount based on BNB input
  useEffect(() => {
    if (bnbAmount && !isNaN(parseFloat(bnbAmount))) {
      const tokens = parseFloat(bnbAmount) / token.price;
      setTokenAmount(tokens.toLocaleString('en-US', { maximumFractionDigits: 0 }));
    } else {
      setTokenAmount('');
    }
  }, [bnbAmount, token.price]);

  const handleTrade = async () => {
    if (!bnbAmount || parseFloat(bnbAmount) <= 0) return;

    setIsTrading(true);
    
    // Mock trading delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock success
    alert(`${activeTab === 'buy' ? 'Bought' : 'Sold'} ${tokenAmount} ${token.symbol} for ${bnbAmount} BNB`);
    
    setBnbAmount('');
    setTokenAmount('');
    setIsTrading(false);
  };

  const progressPercentage = Math.min(token.graduationProgress, 100);

  return (
    <div className="w-full xl:w-80 bg-background-card border border-border rounded-lg p-4 space-y-4">
      
      {/* Buy/Sell Toggle */}
      <div className="flex bg-background-dark rounded-lg p-1">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${
            activeTab === 'buy'
              ? 'bg-primary-green text-black'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${
            activeTab === 'sell'
              ? 'bg-primary-red text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Switch to GASMODE toggle */}
      <div className="flex items-center justify-between p-3 bg-background-dark rounded-lg">
        <span className="text-sm text-text-primary">Switch to GASMODE</span>
        <button className="w-5 h-5 border border-border rounded bg-background-card"></button>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="number"
            value={bnbAmount}
            onChange={(e) => setBnbAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-background-dark border border-border rounded-lg p-3 text-xl font-semibold text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <span className="text-text-secondary text-sm">BNB</span>
            <div className="w-6 h-6 bg-accent-yellow rounded-full flex items-center justify-center text-black text-xs font-bold">
              B
            </div>
          </div>
        </div>
        
        {/* Quick Amount Buttons */}
        <div className="flex gap-2">
          {['0.1', '0.5', '1', '5'].map((amount) => (
            <button
              key={amount}
              onClick={() => setBnbAmount(amount)}
              className="flex-1 py-1 px-2 text-xs bg-background-dark border border-border rounded text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
            >
              {amount}
            </button>
          ))}
        </div>
      </div>

      {/* You get */}
      <div className="space-y-2">
        <label className="block text-sm text-text-secondary">You get</label>
        <div className="relative">
          <input
            type="text"
            value={tokenAmount}
            readOnly
            placeholder="0"
            className="w-full bg-background-dark border border-border rounded-lg p-3 text-xl font-semibold text-text-primary placeholder-text-muted cursor-not-allowed"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-text-secondary text-sm">{token.symbol}</span>
          </div>
        </div>
      </div>

      {/* Slippage Settings */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">Slippage</span>
        <button
          onClick={() => setShowSlippageSettings(!showSlippageSettings)}
          className="flex items-center gap-1 text-sm text-text-primary hover:text-primary-green transition-colors"
        >
          <span>{slippage}%</span>
          <Cog6ToothIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Slippage Settings Panel */}
      {showSlippageSettings && (
        <div className="bg-background-dark border border-border rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            {[0.5, 1.0, 2.0, 5.0].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`flex-1 py-1 px-2 text-xs rounded transition-colors ${
                  slippage === value
                    ? 'bg-primary-green text-black'
                    : 'bg-background-card border border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
          <input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value) || 1.0)}
            min="0.1"
            max="50"
            step="0.1"
            className="w-full bg-background-card border border-border rounded p-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-green"
            placeholder="Custom %"
          />
        </div>
      )}

      {/* Trade Button */}
      <Button
        fullWidth
        size="lg"
        variant={activeTab === 'buy' ? 'primary' : 'danger'}
        loading={isTrading}
        disabled={!bnbAmount || parseFloat(bnbAmount) <= 0}
        onClick={handleTrade}
      >
        {activeTab === 'buy' ? `Buy ${token.symbol}` : `Sell ${token.symbol}`}
        {bnbAmount && ` (${bnbAmount} BNB)`}
      </Button>

      {/* Bonding Curve Progress */}
      {!token.isGraduated && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">Bonding Curve Progress</span>
            <span className="text-sm text-primary-green font-semibold">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-background-dark rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-primary-green to-accent-yellow transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>Current: ${formatMarketCap(token.marketCap)}</span>
            <span>Goal: $100K</span>
          </div>
          <p className="text-xs text-text-muted">
            Coin has graduated!
          </p>
        </div>
      )}

      {/* Top Holders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Top holders</h3>
          <span className="text-xs text-text-muted">Currently bubble map</span>
        </div>
        
        <div className="space-y-2">
          {topHolders.map((holder, index) => (
            <div key={holder.address} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-green to-accent-blue flex items-center justify-center text-black text-xs font-bold">
                  {index + 1}
                </div>
                <span className="text-xs font-mono text-text-secondary">
                  {holder.address}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-text-primary">
                  {holder.percentage.toFixed(2)}%
                </div>
                <div className="text-xs text-text-muted">
                  {holder.amount}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Price Info */}
      <div className="bg-background-dark rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Current Price</span>
          <div className="flex items-center gap-1">
            {token.priceChange24h >= 0 ? (
              <ArrowUpIcon className="w-3 h-3 text-primary-green" />
            ) : (
              <ArrowDownIcon className="w-3 h-3 text-primary-red" />
            )}
            <span className={`text-sm font-semibold ${
              token.priceChange24h >= 0 ? 'text-primary-green' : 'text-primary-red'
            }`}>
              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-lg font-bold text-text-primary">
          ${formatPrice(token.price)}
        </div>
        <div className="text-xs text-text-muted">
          Market Cap: {formatMarketCap(token.marketCap)} • Volume: {formatMarketCap(token.volume24h)}
        </div>
      </div>
    </div>
  );
}