'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import type { Abi } from 'viem';
import BondingCurveABIImport from '@/lib/abis/BondingCurve.json';
import { useUsdPrice, asterToUsd, formatUsdPrice } from '@/lib/hooks/useUsdPrice';
import { getIpfsUrl } from '@/lib/utils/ipfs';
import { ATHProgressBar } from './ATHProgressBar';

const BondingCurveABI = BondingCurveABIImport.abi as Abi;

// Creator display component that fetches username
function CreatorDisplay({ address }: { address: string }) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com';
        const res = await fetch(`${API_URL}/api/profile/${address}`);
        const data = await res.json();
        if (data.success && data.data?.user?.username) {
          setUsername(data.data.user.username);
        }
      } catch (error) {
        console.error('Failed to fetch creator profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [address]);

  const displayName = username || `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <Link
      href={`/profile/${address}`}
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition"
    >
      <span className={loading ? 'animate-pulse' : ''}>
        by <span className="text-gray-300 hover:text-primary">{displayName}</span>
      </span>
    </Link>
  );
}

interface TokenStats {
  price?: string;
  priceUsd?: string;
  marketCap?: string;
  marketCapUsd?: string;
  volume24h?: string;
  volume24hUsd?: string;
  trades24h?: number;
  holders?: number;
  liquidity?: string;
  liquidityUsd?: string;
  priceChange1h?: string;
  priceChange6h?: string;
  priceChange24h?: string;
  athMarketCapUsd?: string;
}

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
    stats?: TokenStats;
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
  // Graduation threshold is 10,000 ASTER
  const progressPercentage = (asterAmount / 10000) * 100;

  // Calculate market cap in USD - use stats if available, otherwise calculate from reserves
  const marketCapUsd = token.stats?.marketCapUsd
    ? parseFloat(token.stats.marketCapUsd)
    : asterToUsd(asterAmount, usdRate);

  // ATH Market Cap in USD from backend
  const athMarketCapUsd = token.stats?.athMarketCapUsd
    ? parseFloat(token.stats.athMarketCapUsd)
    : marketCapUsd; // Use current as ATH if not set

  // Market cap change (24h) - use priceChange24h as proxy for MC change
  const marketCapChange24h = token.stats?.priceChange24h
    ? parseFloat(token.stats.priceChange24h)
    : 0;

  const isNearGraduation = progressPercentage >= 80 && progressPercentage < 100;
  const isGraduated = progressPercentage >= 100;
  const displayPercentage = Math.min(progressPercentage, 100);

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
          </div>

          {/* Creator and Time */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <CreatorDisplay address={token.creator} />
            <span className="text-gray-600">|</span>
            <span className="whitespace-nowrap">{formatTimeAgo(token.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* ATH Progress Bar - Like pump.fun */}
      <div className="mb-3">
        <ATHProgressBar
          currentMarketCap={marketCapUsd}
          athMarketCap={athMarketCapUsd}
          marketCapChange={marketCapChange24h}
        />
      </div>

      {/* Bonding Curve Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">
            {isGraduated ? 'Graduated!' : isNearGraduation ? 'Graduating soon!' : 'Bonding Curve'}
          </span>
          <span className="text-xs font-medium text-gray-400">
            {displayPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              isGraduated
                ? 'bg-green-500'
                : isNearGraduation
                ? 'bg-gradient-to-r from-primary to-primary-green animate-pulse-green'
                : 'bg-primary'
            }`}
            style={{ width: `${displayPercentage}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
