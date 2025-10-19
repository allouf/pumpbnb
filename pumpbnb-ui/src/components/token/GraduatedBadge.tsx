'use client';

import React from 'react';
import { CheckBadgeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/Button';
import { PANCAKESWAP_URLS } from '@/lib/mock-data/mockGraduation';

interface GraduatedBadgeProps {
  tokenAddress: string;
  tokenSymbol: string;
  pancakeswapPair?: string;
  asterRaised?: number;
  wbnbConverted?: number;
  graduationDate?: string;
  className?: string;
}

export function GraduatedBadge({
  tokenAddress,
  tokenSymbol,
  pancakeswapPair,
  asterRaised = 100,
  wbnbConverted = 0.5,
  graduationDate,
  className = '',
}: GraduatedBadgeProps) {
  // Generate mock pair address if not provided
  const pairAddress = pancakeswapPair || generateMockPairAddress(tokenAddress);

  const formatDate = (date?: string) => {
    if (!date) return 'Recently';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Graduated Status Banner */}
      <div className="bg-gradient-to-r from-primary-green/20 via-accent-yellow/20 to-accent-blue/20 border border-primary-green/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckBadgeIcon className="w-8 h-8 text-primary-green" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
              Graduated to PancakeSwap
              <span className="text-xs bg-primary-green/20 text-primary-green px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </h3>
            <p className="text-sm text-text-secondary mb-3">
              This token successfully reached 100 ASTER and graduated to PancakeSwap DEX
            </p>

            {/* Graduation Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-background-dark/50 rounded p-2">
                <p className="text-text-muted mb-0.5">ASTER Raised</p>
                <p className="text-text-primary font-semibold">{asterRaised} ASTER</p>
              </div>
              <div className="bg-background-dark/50 rounded p-2">
                <p className="text-text-muted mb-0.5">WBNB Converted</p>
                <p className="text-text-primary font-semibold">{wbnbConverted.toFixed(4)} WBNB</p>
              </div>
              <div className="bg-background-dark/50 rounded p-2">
                <p className="text-text-muted mb-0.5">Graduation Date</p>
                <p className="text-text-primary font-semibold">{formatDate(graduationDate)}</p>
              </div>
              <div className="bg-background-dark/50 rounded p-2">
                <p className="text-text-muted mb-0.5">Trading Pair</p>
                <p className="text-text-primary font-semibold">{tokenSymbol}/WBNB</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PancakeSwap Actions */}
      <div className="bg-background-card border border-border rounded-lg p-4">
        <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#D1884F"/>
            <path d="M12 8L14 10L12 12L10 10L12 8Z" fill="white"/>
            <path d="M12 16L14 14L12 12L10 14L12 16Z" fill="white"/>
          </svg>
          Trade on PancakeSwap
        </h4>

        <div className="space-y-2">
          <Button
            onClick={() => window.open(PANCAKESWAP_URLS.SWAP(pairAddress), '_blank')}
            className="w-full flex items-center justify-center gap-2"
          >
            <span>Swap {tokenSymbol}/WBNB</span>
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(PANCAKESWAP_URLS.LIQUIDITY(pairAddress), '_blank')}
              className="flex items-center justify-center gap-1 text-xs"
            >
              <span>Add Liquidity</span>
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(PANCAKESWAP_URLS.INFO(pairAddress), '_blank')}
              className="flex items-center justify-center gap-1 text-xs"
            >
              <span>Pool Info</span>
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Pair Address */}
        <div className="mt-3 p-2 bg-background-dark rounded text-xs">
          <p className="text-text-muted mb-1">Pair Contract:</p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-text-secondary break-all flex-1">
              {pairAddress}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(pairAddress);
                // TODO: Add toast notification
              }}
              className="text-primary-green hover:text-primary-green/80 flex-shrink-0"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Liquidity Info */}
      <div className="bg-background-dark/30 border border-border/50 rounded-lg p-4">
        <div className="flex items-start gap-2 text-xs text-text-muted">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="mb-1">
              <span className="font-semibold text-text-primary">Permanent Liquidity Lock:</span>{' '}
              All LP tokens have been burned to ensure liquidity can never be removed from the pool.
            </p>
            <p>
              <span className="font-semibold text-text-primary">Creator Allocation:</span>{' '}
              20% of tokens (200M) unlocked for creator after graduation.
            </p>
          </div>
        </div>
      </div>

      {/* Aster Protocol Integration (Future) */}
      <div className="bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border border-accent-purple/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-accent-purple" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-text-primary mb-1">
              Coming Soon: 1001x Leverage Trading
            </h4>
            <p className="text-xs text-text-secondary mb-2">
              Graduated tokens will be eligible for extreme leverage trading on Aster Protocol
            </p>
            <Button variant="outline" size="sm" disabled className="text-xs">
              Available Post-Phase 3
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function
function generateMockPairAddress(tokenAddress: string): string {
  const hash = tokenAddress.slice(2);
  const pairHash = hash.split('').reverse().join('').substring(0, 40);
  return `0x${pairHash}`;
}
