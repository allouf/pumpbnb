'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useMockWallet } from '@/hooks/useMockWallet';
import { useToast } from '@/contexts/ToastContext';
import { Token } from '@/lib/mock-data/tokens';

interface TradingModalProps {
  token: Token;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'buy' | 'sell';
}

const PLATFORM_FEE_PERCENT = 1.5;
const MOCK_PRICE_PER_ASTER = 2; // 1 ASTER = 2 tokens (example rate)

export function TradingModal({ token, isOpen, onClose, defaultTab = 'buy' }: TradingModalProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>(defaultTab);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { isConnected, asterBalance, getTokenBalance, buyToken, sellToken, connect } = useMockWallet();
  const { showToast } = useToast();

  const tokenBalance = getTokenBalance(token.address);

  // Calculate transaction details
  const calculateBuy = () => {
    const asterAmount = parseFloat(amount) || 0;
    const platformFee = asterAmount * (PLATFORM_FEE_PERCENT / 100);
    const asterAfterFee = asterAmount - platformFee;
    const tokensReceived = asterAfterFee * MOCK_PRICE_PER_ASTER;
    const priceImpact = (asterAmount / 100) * 0.5; // Mock: 0.5% impact per 100 ASTER

    return {
      asterAmount,
      platformFee,
      tokensReceived,
      priceImpact,
      canAfford: asterAmount <= asterBalance,
    };
  };

  const calculateSell = () => {
    const tokenAmount = parseFloat(amount) || 0;
    const asterBeforeFee = tokenAmount / MOCK_PRICE_PER_ASTER;
    const platformFee = asterBeforeFee * (PLATFORM_FEE_PERCENT / 100);
    const asterReceived = asterBeforeFee - platformFee;
    const priceImpact = (tokenAmount / tokenBalance) * 1.5; // Mock: 1.5% impact per sell

    return {
      tokenAmount,
      platformFee,
      asterReceived,
      priceImpact,
      hasEnough: tokenAmount <= tokenBalance,
    };
  };

  const buyDetails = activeTab === 'buy' ? calculateBuy() : null;
  const sellDetails = activeTab === 'sell' ? calculateSell() : null;

  const handleBuy = async () => {
    if (!buyDetails || !buyDetails.canAfford) return;

    setIsProcessing(true);

    try {
      const tx = await buyToken(
        token.address,
        token.symbol,
        buyDetails.asterAmount,
        1 / MOCK_PRICE_PER_ASTER
      );

      showToast(
        'success',
        'Buy Successful!',
        `Bought ${buyDetails.tokensReceived.toFixed(2)} ${token.symbol} for ${buyDetails.asterAmount} ASTER`
      );

      setAmount('');
      setTimeout(() => onClose(), 1500);
    } catch (error: any) {
      showToast('error', 'Buy Failed', error.message || 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSell = async () => {
    if (!sellDetails || !sellDetails.hasEnough) return;

    setIsProcessing(true);

    try {
      const tx = await sellToken(
        token.address,
        token.symbol,
        sellDetails.tokenAmount,
        1 / MOCK_PRICE_PER_ASTER
      );

      showToast(
        'success',
        'Sell Successful!',
        `Sold ${sellDetails.tokenAmount} ${token.symbol} for ${sellDetails.asterReceived.toFixed(2)} ASTER`
      );

      setAmount('');
      setTimeout(() => onClose(), 1500);
    } catch (error: any) {
      showToast('error', 'Sell Failed', error.message || 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connect('metamask');
      showToast('success', 'Wallet Connected', 'Mock wallet connected successfully');
    } catch (error: any) {
      showToast('error', 'Connection Failed', error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-background-card border border-border rounded-lg w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">
            Trade {token.symbol}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-3 font-semibold transition-colors ${
              activeTab === 'buy'
                ? 'text-primary-green border-b-2 border-primary-green'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-3 font-semibold transition-colors ${
              activeTab === 'sell'
                ? 'text-primary-red border-b-2 border-primary-red'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {!isConnected ? (
            <div className="text-center py-8">
              <p className="text-text-secondary mb-4">Connect your wallet to start trading</p>
              <Button onClick={handleConnectWallet} className="w-full">
                Connect Wallet
              </Button>
            </div>
          ) : (
            <>
              {/* Balance Display */}
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">
                  {activeTab === 'buy' ? 'ASTER Balance:' : 'Token Balance:'}
                </span>
                <span className="font-semibold text-text-primary">
                  {activeTab === 'buy'
                    ? `${asterBalance.toFixed(2)} ASTER`
                    : `${tokenBalance.toFixed(2)} ${token.symbol}`}
                </span>
              </div>

              {/* Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  {activeTab === 'buy' ? 'Pay (ASTER)' : `Sell (${token.symbol})`}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-background-dark border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary-green"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={() => {
                      if (activeTab === 'buy') {
                        setAmount(asterBalance.toString());
                      } else {
                        setAmount(tokenBalance.toString());
                      }
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary-green hover:text-green-400 transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Swap Icon */}
              <div className="flex justify-center">
                <div className="bg-background-dark border border-border rounded-full p-2">
                  <ArrowsRightLeftIcon className="w-4 h-4 text-text-secondary" />
                </div>
              </div>

              {/* Output */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  {activeTab === 'buy' ? `Receive (${token.symbol})` : 'Receive (ASTER)'}
                </label>
                <div className="bg-background-dark border border-border rounded-lg px-4 py-3">
                  <p className="text-lg font-semibold text-text-primary">
                    {activeTab === 'buy'
                      ? buyDetails?.tokensReceived.toFixed(2) || '0.00'
                      : sellDetails?.asterReceived.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              {/* Transaction Details */}
              {parseFloat(amount) > 0 && (
                <div className="bg-background-dark border border-border rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                    <span className="text-text-secondary">
                      {activeTab === 'buy'
                        ? `${buyDetails?.platformFee.toFixed(4)} ASTER`
                        : `${sellDetails?.platformFee.toFixed(4)} ASTER`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Price Impact</span>
                    <span className={`${
                      (activeTab === 'buy' ? buyDetails?.priceImpact : sellDetails?.priceImpact) > 3
                        ? 'text-primary-red'
                        : 'text-accent-yellow'
                    }`}>
                      {activeTab === 'buy'
                        ? `${buyDetails?.priceImpact.toFixed(2)}%`
                        : `${sellDetails?.priceImpact.toFixed(2)}%`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Rate</span>
                    <span className="text-text-secondary">
                      1 ASTER = {MOCK_PRICE_PER_ASTER} {token.symbol}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button
                fullWidth
                size="lg"
                onClick={activeTab === 'buy' ? handleBuy : handleSell}
                disabled={
                  isProcessing ||
                  !amount ||
                  parseFloat(amount) <= 0 ||
                  (activeTab === 'buy' && !buyDetails?.canAfford) ||
                  (activeTab === 'sell' && !sellDetails?.hasEnough)
                }
                className={activeTab === 'buy' ? 'bg-primary-green hover:bg-green-400' : 'bg-primary-red hover:bg-red-400'}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : !amount || parseFloat(amount) <= 0 ? (
                  `Enter ${activeTab === 'buy' ? 'ASTER' : 'Token'} Amount`
                ) : activeTab === 'buy' && !buyDetails?.canAfford ? (
                  'Insufficient ASTER Balance'
                ) : activeTab === 'sell' && !sellDetails?.hasEnough ? (
                  'Insufficient Token Balance'
                ) : (
                  `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`
                )}
              </Button>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
