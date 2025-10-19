'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Token, formatMarketCap, formatPrice } from '@/lib/mock-data/tokens';
import { getTokenAsterAccumulated } from '@/lib/mock-data/tokenGraduationTracker';
import {
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { TradingModal } from './TradingModal';
import { useMockWallet } from '@/hooks/useMockWallet';

interface TradingPanelProps {
  token: Token;
}

interface TopHolder {
  address: string;
  percentage: number;
  amount: string;
}

export function TradingPanel({ token }: TradingPanelProps) {
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [modalTab, setModalTab] = useState<'buy' | 'sell'>('buy');
  const [dynamicProgress, setDynamicProgress] = useState(0);

  const { asterBalance, getTokenBalance } = useMockWallet();
  const tokenBalance = getTokenBalance(token.address);

  // Update graduation progress dynamically
  useEffect(() => {
    const updateProgress = () => {
      const asterAccumulated = getTokenAsterAccumulated(token.address);
      setDynamicProgress(asterAccumulated);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 2000);
    return () => clearInterval(interval);
  }, [token.address]);

  // Mock top holders data
  const topHolders: TopHolder[] = [
    { address: '0x1234...5678', percentage: 25.18, amount: '25.2M' },
    { address: '0xabcd...ef01', percentage: 15.31, amount: '15.3M' },
    { address: '0x9876...5432', percentage: 8.45, amount: '8.5M' },
    { address: '0xfedc...ba98', percentage: 6.72, amount: '6.7M' },
    { address: '0x5555...aaaa', percentage: 4.33, amount: '4.3M' },
  ];

  const handleOpenModal = (tab: 'buy' | 'sell') => {
    setModalTab(tab);
    setShowTradingModal(true);
  };

  const progressPercentage = Math.min((dynamicProgress / 100) * 100, 100);

  return (
    <>
      <div className="w-full xl:w-80 bg-background-card border border-border rounded-lg p-4 space-y-4">

        {/* ASTER Balance Display */}
        <div className="bg-background-dark border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Your ASTER Balance</span>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-gradient-to-br from-primary-green to-accent-blue rounded-full"></div>
              <span className="text-sm font-semibold text-text-primary">
                {asterBalance.toFixed(2)} ASTER
              </span>
            </div>
          </div>
          {tokenBalance > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-text-secondary">Your {token.symbol}</span>
              <span className="text-sm font-semibold text-text-primary">
                {tokenBalance.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Trading Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            fullWidth
            onClick={() => handleOpenModal('buy')}
            className="bg-primary-green hover:bg-green-400 text-black font-semibold"
          >
            Buy with ASTER
          </Button>
          <Button
            fullWidth
            onClick={() => handleOpenModal('sell')}
            className="bg-primary-red hover:bg-red-400 text-white font-semibold"
            disabled={tokenBalance === 0}
          >
            Sell for ASTER
          </Button>
        </div>

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
            <span>Current: {dynamicProgress.toFixed(1)} ASTER</span>
            <span>Goal: 100 ASTER</span>
          </div>
          <p className="text-xs text-text-muted">
            When bonding curve accumulates 100 ASTER, token graduates to PancakeSwap (Token/WBNB pair)
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

      {/* Trading Modal */}
      <TradingModal
        token={token}
        isOpen={showTradingModal}
        onClose={() => setShowTradingModal(false)}
        defaultTab={modalTab}
      />
    </>
  );
}