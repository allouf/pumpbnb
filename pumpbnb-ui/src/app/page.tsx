'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { TokenCard } from '@/components/token/TokenCard';
import { useTokens } from '@/hooks/useTokens';
import { getTokensByCategory } from '@/lib/mock-data/tokens';
import { Button } from '@/components/ui/Button';
import {
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';


export default function Home() {
  const [activeTab, setActiveTab] = useState<'featured' | 'nsfw' | 'animations'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const trendingScrollRef = useRef<HTMLDivElement>(null);
  
  // Get trending tokens (separate hook instance)
  const trendingHook = useTokens({
    sortBy: 'priceChange24h',
    order: 'desc',
    limit: 10
  });
  const { tokens: trendingTokens, isLoading: trendingLoading } = trendingHook;
  
  // Get regular tokens (separate hook instance)
  const tokensHook = useTokens({
    sortBy: 'marketCap',
    order: 'desc',
    limit: 50
  });
  const { tokens: allTokens = [], isLoading: tokensLoading } = tokensHook;
  
  // Fallback to mock data if API tokens not available
  const tokenCategories = getTokensByCategory();
  const fallbackTokens = [...tokenCategories.newlyCreated, ...tokenCategories.aboutToGraduate, ...tokenCategories.graduated];
  const displayTokens = allTokens.length > 0 ? allTokens : fallbackTokens;

  // Filter tokens based on active tab
  const filteredTokens = displayTokens.filter(token => {
    if (activeTab === 'featured') {
      return token.featured || token.graduationProgress >= 75 || token.isGraduated;
    } else if (activeTab === 'nsfw') {
      // For demo: show tokens with NSFW-like names or random selection
      return token.symbol.includes('PEPE') || token.symbol.includes('WOJAK') || Math.random() > 0.7;
    } else if (activeTab === 'animations') {
      // For demo: show tokens that could have animations
      return token.description?.toLowerCase().includes('art') ||
             token.description?.toLowerCase().includes('meme') ||
             Math.random() > 0.6;
    }
    return true;
  });

  // Carousel scroll functions
  const scrollTrending = (direction: 'left' | 'right') => {
    if (trendingScrollRef.current) {
      const scrollAmount = 320; // Card width + gap
      const newScrollPosition = direction === 'left'
        ? trendingScrollRef.current.scrollLeft - scrollAmount
        : trendingScrollRef.current.scrollLeft + scrollAmount;

      trendingScrollRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-6 min-h-screen">
      {/* Now Trending Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Now trending</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollTrending('left')}
              className="p-1 hover:bg-background-card rounded transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="w-5 h-5 text-text-secondary hover:text-text-primary" />
            </button>
            <button
              onClick={() => scrollTrending('right')}
              className="p-1 hover:bg-background-card rounded transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="w-5 h-5 text-text-secondary hover:text-text-primary" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div ref={trendingScrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {trendingLoading ? (
            // Loading skeleton
            Array(5).fill(null).map((_, index) => (
              <div key={index} className="min-w-[300px] bg-background-card rounded-lg border border-border p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-background-sidebar rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-background-sidebar rounded mb-2"></div>
                    <div className="h-3 bg-background-sidebar rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-background-sidebar rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-background-sidebar rounded"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            (trendingTokens || []).map((token) => (
              <Link
                key={token.contractAddress || token.id}
                href={`/token/${token.contractAddress || token.address}`}
                className="min-w-[300px] block"
              >
                <div className="bg-background-card rounded-lg border border-border p-4 hover:border-primary-green/50 transition-colors cursor-pointer h-full">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-purple to-accent-blue rounded-lg flex-shrink-0 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{token.symbol?.charAt(0) || 'T'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-text-primary text-sm mb-1 truncate">{token.name} ({token.symbol})</div>
                      <div className="text-xs text-text-secondary mb-1">
                        market cap: <span className="text-primary-green">${token.marketCap?.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-text-secondary mb-2">
                        price: <span className="text-text-primary">${token.price?.toFixed(6)}</span>
                      </div>
                      <div className="text-xs text-text-muted line-clamp-2">{token.description || 'No description available'}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'featured' 
                ? 'bg-primary-green text-black' 
                : 'bg-background-card text-text-secondary hover:text-text-primary'
            }`}
          >
            Featured 🔥
          </button>
          
          {/* NSFW Toggle */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('nsfw')}
              className={`w-10 h-6 rounded-full transition-colors ${
                activeTab === 'nsfw' ? 'bg-primary-green' : 'bg-background-sidebar'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                activeTab === 'nsfw' ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
            <span className="text-sm text-text-secondary">Nsfw</span>
          </div>
          
          {/* Animations Toggle */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('animations')}
              className={`w-10 h-6 rounded-full transition-colors ${
                activeTab === 'animations' ? 'bg-primary-green' : 'bg-background-sidebar'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                activeTab === 'animations' ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
            <span className="text-sm text-text-secondary">Animations</span>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-text-secondary"
          >
            <FunnelIcon className="w-4 h-4" />
            Filter
          </Button>
          
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-primary-green text-black' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-green text-black' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Token Grid */}
      <div className={`grid gap-4 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {tokensLoading ? (
          // Loading skeleton for token grid
          Array(8).fill(null).map((_, index) => (
            <div key={index} className="bg-background-card rounded-lg border border-border p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-background-sidebar rounded-lg flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-background-sidebar rounded mb-2"></div>
                  <div className="h-3 bg-background-sidebar rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-background-sidebar rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          displayTokens.map((token) => (
            <TokenCard key={token.contractAddress || token.address || token.id} token={token} compact={viewMode === 'list'} />
          ))
        )}
      </div>
    </div>
  );
}
