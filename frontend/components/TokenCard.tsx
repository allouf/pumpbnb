'use client';

import React from 'react';
import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import type { Abi } from 'viem';
import BondingCurveABIImport from '@/lib/abis/BondingCurve.json';
import { useUsdPrice, asterToUsd, formatUsdPrice } from '@/lib/hooks/useUsdPrice';
import { getIpfsUrl } from '@/lib/utils/ipfs';

const BondingCurveABI = BondingCurveABIImport.abi as Abi;

interface TokenCardProps {
  token: {
    address: string;
    bondingCurve: string;
    name: string;
    symbol: string;
    creator: string;
    imageUrl?: string;
    description?: string;
    timestamp?: number;
  };
  compact?: boolean;
  showAnimations?: boolean;
}

export function TokenCard({ token, compact = false, showAnimations = true }: TokenCardProps) {
  const { usdRate } = useUsdPrice();

  // Fetch real bonding curve data
  const { data: reserves } = useReadContract({
    address: token.bondingCurve as `0x${string}`,
    abi: BondingCurveABI,
    functionName: 'getReserves',
  });

  const reservesData = reserves as readonly [bigint, bigint] | undefined;
  const asterReserves = reservesData ? reservesData[0] : BigInt(0);
  const asterAmount = Number(formatUnits(asterReserves, 18));
  const progress = asterAmount; // Out of 100 ASTER

  // Calculate market cap in USD
  const marketCapUsd = asterToUsd(asterAmount, usdRate);
  const marketCapDisplay = formatUsdPrice(marketCapUsd);
  
  const isNearGraduation = progress >= 80 && progress < 100;
  const isGraduated = progress >= 100;
  const progressPercentage = Math.min(progress, 100);

  // Format time ago
  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Link 
      href={`/token/${token.address}`}
      className="block bg-secondary-light p-4 rounded-xl hover:bg-secondary-light/80 transition border border-gray-800 hover:border-primary/50"
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Token Image */}
        {token.imageUrl ? (
          <img
            src={getIpfsUrl(token.imageUrl)}
            alt={token.name}
            className={`w-12 h-12 rounded-full object-cover flex-shrink-0 ${
              !showAnimations ? 'pointer-events-none' : ''
            }`}
            style={!showAnimations ? { imageRendering: 'crisp-edges' } : {}}
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-green flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
            {token.symbol.charAt(0)}
          </div>
        )}

        {/* Token Info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="font-semibold text-white truncate hover:text-primary transition-colors">
                {token.name}
              </h3>
              <p className="text-sm text-gray-400 truncate">
                ${token.symbol}
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <p className="text-sm font-semibold text-white whitespace-nowrap">
                {marketCapDisplay}
              </p>
              <p className="text-xs text-gray-400 whitespace-nowrap">
                Market Cap
              </p>
            </div>
          </div>
          
          {/* Time */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span className="whitespace-nowrap">{formatTimeAgo(token.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">
            {isGraduated ? '🎉 Graduated!' : isNearGraduation ? 'Graduating soon! 🚀' : 'Bonding curve progress:'}
          </span>
          <span className="text-xs font-medium text-gray-400">
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isNearGraduation 
                ? 'bg-gradient-to-r from-primary to-primary-green animate-pulse-green' 
                : 'bg-primary'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>0 ASTER</span>
          <span>100 ASTER</span>
        </div>
      </div>

      {/* Creator Info */}
      <div className="pt-3 border-t border-gray-700 flex items-center justify-between text-sm">
        <div>
          <span className="text-gray-400">Created by: </span>
          <span className="font-mono text-xs text-gray-300">
            {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
            Bonding Curve
          </span>
        </div>
      </div>
    </Link>
  );
}
