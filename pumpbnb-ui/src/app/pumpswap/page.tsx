'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { mockTokens, Token } from '@/lib/mock-data/tokens';
import { useMockWallet } from '@/hooks/useMockWallet';
import { useToast } from '@/contexts/ToastContext';
import { getTokenAsterAccumulated } from '@/lib/mock-data/tokenGraduationTracker';
import {
  ArrowsUpDownIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  FireIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

const PLATFORM_FEE_PERCENT = 1.5;
const MOCK_PRICE_PER_ASTER = 2; // 1 ASTER = 2 tokens

export default function PumpSwapPage() {
  const [fromToken, setFromToken] = useState<'ASTER' | Token>('ASTER');
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { isConnected, asterBalance, getTokenBalance, buyToken, sellToken, connect } = useMockWallet();
  const { showToast } = useToast();

  // Get tokens with balances and progress
  const tokensWithData = mockTokens.map(token => ({
    ...token,
    balance: getTokenBalance(token.address),
    asterProgress: getTokenAsterAccumulated(token.address),
  }));

  // Filter and sort
  const filteredTokens = tokensWithData
    .filter(token =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.balance > 0 && b.balance === 0) return -1;
      if (a.balance === 0 && b.balance > 0) return 1;
      return b.asterProgress - a.asterProgress;
    });

  // Calculate swap
  const calculateSwap = () => {
    const amount = parseFloat(fromAmount) || 0;
    if (amount <= 0) return null;

    if (fromToken === 'ASTER' && toToken) {
      const platformFee = amount * (PLATFORM_FEE_PERCENT / 100);
      const amountAfterFee = amount - platformFee;
      const tokensReceived = amountAfterFee * MOCK_PRICE_PER_ASTER;

      return {
        fromAmount: amount,
        toAmount: tokensReceived,
        platformFee,
        canExecute: amount <= asterBalance,
        type: 'buy' as const,
      };
    } else if (fromToken !== 'ASTER') {
      const tokenBalance = getTokenBalance(fromToken.address);
      const asterBeforeFee = amount / MOCK_PRICE_PER_ASTER;
      const platformFee = asterBeforeFee * (PLATFORM_FEE_PERCENT / 100);
      const asterReceived = asterBeforeFee - platformFee;

      return {
        fromAmount: amount,
        toAmount: asterReceived,
        platformFee,
        canExecute: amount <= tokenBalance,
        type: 'sell' as const,
      };
    }
    return null;
  };

  const swapDetails = calculateSwap();

  const handleSwap = async () => {
    if (!swapDetails || !swapDetails.canExecute) return;

    setIsProcessing(true);
    try {
      if (toToken && fromToken === 'ASTER') {
        await buyToken(toToken.address, toToken.symbol, swapDetails.fromAmount, 1 / MOCK_PRICE_PER_ASTER);
        showToast('success', 'Swap Successful!', `Swapped ${swapDetails.fromAmount} ASTER for ${swapDetails.toAmount.toFixed(2)} ${toToken.symbol}`);
      } else if (fromToken !== 'ASTER') {
        await sellToken(fromToken.address, fromToken.symbol, swapDetails.fromAmount, 1 / MOCK_PRICE_PER_ASTER);
        showToast('success', 'Swap Successful!', `Swapped ${swapDetails.fromAmount} ${fromToken.symbol} for ${swapDetails.toAmount.toFixed(2)} ASTER`);
      }
      setFromAmount('');
    } catch (error: any) {
      showToast('error', 'Swap Failed', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlipTokens = () => {
    if (fromToken === 'ASTER' && toToken) {
      setFromToken(toToken);
      setToToken(null);
    } else if (fromToken !== 'ASTER') {
      setToToken(fromToken);
      setFromToken('ASTER');
    }
    setFromAmount('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-green to-accent-yellow bg-clip-text text-transparent mb-2">
          PumpSwap
        </h1>
        <p className="text-text-secondary">Trade tokens with ASTER on the bonding curve</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swap Interface */}
        <div className="lg:col-span-2">
          <div className="bg-background-card border border-border rounded-xl p-6">
            <div className="space-y-4">
              {/* From Token */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="text-text-muted">From</label>
                  <span className="text-text-secondary">
                    Balance: {fromToken === 'ASTER' ? asterBalance.toFixed(2) : getTokenBalance(fromToken.address).toFixed(2)}
                  </span>
                </div>
                <div className="bg-background-dark border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-transparent text-2xl font-semibold text-text-primary outline-none flex-1"
                    />
                    <button
                      onClick={() => setShowFromSelector(true)}
                      className="flex items-center gap-2 bg-background-card hover:bg-background-sidebar border border-border rounded-lg px-4 py-2 transition-colors"
                    >
                      {fromToken === 'ASTER' ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-green to-accent-blue" />
                          <span className="font-semibold text-text-primary">ASTER</span>
                        </>
                      ) : (
                        <>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-xs font-bold text-white">
                            {fromToken.symbol[0]}
                          </div>
                          <span className="font-semibold text-text-primary">{fromToken.symbol}</span>
                        </>
                      )}
                      <ChevronDownIcon className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (fromToken === 'ASTER') {
                        setFromAmount(asterBalance.toString());
                      } else {
                        setFromAmount(getTokenBalance(fromToken.address).toString());
                      }
                    }}
                    className="text-xs text-primary-green hover:text-green-400 font-semibold mt-2"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Flip Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleFlipTokens}
                  className="bg-background-dark hover:bg-background-sidebar border border-border rounded-full p-3 transition-colors"
                >
                  <ArrowsUpDownIcon className="w-5 h-5 text-text-primary" />
                </button>
              </div>

              {/* To Token */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="text-text-muted">To (estimated)</label>
                  {toToken && (
                    <span className="text-text-secondary">Balance: {getTokenBalance(toToken.address).toFixed(2)}</span>
                  )}
                </div>
                <div className="bg-background-dark border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-2xl font-semibold text-text-primary">
                      {swapDetails?.toAmount.toFixed(2) || '0.00'}
                    </div>
                    <button
                      onClick={() => setShowToSelector(true)}
                      className="flex items-center gap-2 bg-background-card hover:bg-background-sidebar border border-border rounded-lg px-4 py-2 transition-colors"
                    >
                      {toToken ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-xs font-bold text-white">
                            {toToken.symbol[0]}
                          </div>
                          <span className="font-semibold text-text-primary">{toToken.symbol}</span>
                        </>
                      ) : fromToken !== 'ASTER' ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-green to-accent-blue" />
                          <span className="font-semibold text-text-primary">ASTER</span>
                        </>
                      ) : (
                        <span className="text-text-muted">Select token</span>
                      )}
                      <ChevronDownIcon className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Details */}
              {swapDetails && parseFloat(fromAmount) > 0 && (
                <div className="bg-background-dark border border-border rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                    <span className="text-text-secondary">{swapDetails.platformFee.toFixed(4)} ASTER</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Rate</span>
                    <span className="text-text-secondary">1 ASTER = {MOCK_PRICE_PER_ASTER} tokens</span>
                  </div>
                </div>
              )}

              {/* Swap Button */}
              {!isConnected ? (
                <Button onClick={() => connect('metamask')} fullWidth size="lg">
                  Connect Wallet
                </Button>
              ) : (
                <Button
                  onClick={handleSwap}
                  fullWidth
                  size="lg"
                  disabled={!swapDetails || !swapDetails.canExecute || isProcessing || (fromToken === 'ASTER' && !toToken)}
                  className="bg-primary-green hover:bg-green-400"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
                    'Enter Amount'
                  ) : fromToken === 'ASTER' && !toToken ? (
                    'Select Token'
                  ) : !swapDetails?.canExecute ? (
                    'Insufficient Balance'
                  ) : (
                    'Swap'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Token List */}
        <div className="bg-background-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Select</h3>
          <div className="space-y-4">
            {/* Near Graduation */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FireIcon className="w-4 h-4 text-accent-yellow" />
                <h4 className="text-sm font-semibold text-text-primary">Near Graduation</h4>
              </div>
              <div className="space-y-2">
                {tokensWithData.filter(t => t.asterProgress >= 50 && t.asterProgress < 100).slice(0, 3).map(token => (
                  <Link key={token.address} href={`/token/${token.address}`}>
                    <button
                      onClick={() => fromToken === 'ASTER' ? setToToken(token) : setFromToken(token)}
                      className="w-full flex items-center justify-between p-2 hover:bg-background-dark rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-yellow to-accent-orange flex items-center justify-center text-sm font-bold text-white">
                          {token.symbol[0]}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-text-primary">{token.symbol}</div>
                          <div className="text-xs text-accent-yellow">{token.asterProgress.toFixed(0)}% to grad</div>
                        </div>
                      </div>
                    </button>
                  </Link>
                ))}
              </div>
            </div>

            {/* Graduated */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrophyIcon className="w-4 h-4 text-primary-green" />
                <h4 className="text-sm font-semibold text-text-primary">Graduated</h4>
              </div>
              <div className="space-y-2">
                {tokensWithData.filter(t => t.isGraduated || t.asterProgress >= 100).slice(0, 3).map(token => (
                  <Link key={token.address} href={`/token/${token.address}`}>
                    <button
                      className="w-full flex items-center justify-between p-2 hover:bg-background-dark rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-green to-accent-blue flex items-center justify-center text-sm font-bold text-white">
                          {token.symbol[0]}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-text-primary">{token.symbol}</div>
                          <div className="text-xs text-primary-green">PancakeSwap</div>
                        </div>
                      </div>
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Selector Modal */}
      {(showFromSelector || showToSelector) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background-card border border-border rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-3">Select a token</h3>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or symbol"
                  className="w-full bg-background-dark border border-border rounded-lg pl-10 pr-4 py-2 text-text-primary outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {showFromSelector && (
                <button
                  onClick={() => { setFromToken('ASTER'); setShowFromSelector(false); setSearchQuery(''); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-background-dark rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-green to-accent-blue" />
                  <div className="text-left">
                    <div className="font-semibold text-text-primary">ASTER</div>
                    <div className="text-sm text-text-muted">Balance: {asterBalance.toFixed(2)}</div>
                  </div>
                </button>
              )}
              {filteredTokens.map(token => (
                <button
                  key={token.address}
                  onClick={() => {
                    if (showFromSelector) {
                      setFromToken(token);
                      setShowFromSelector(false);
                    } else {
                      setToToken(token);
                      setShowToSelector(false);
                    }
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center justify-between gap-3 p-3 hover:bg-background-dark rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center font-bold text-white">
                      {token.symbol[0]}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-text-primary">{token.symbol}</div>
                      <div className="text-sm text-text-muted">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {token.balance > 0 && <div className="text-text-primary">{token.balance.toFixed(2)}</div>}
                    <div className="text-text-muted">{token.asterProgress.toFixed(0)}%</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <Button onClick={() => { setShowFromSelector(false); setShowToSelector(false); setSearchQuery(''); }} variant="outline" fullWidth>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
