'use client';

import { useState, useEffect } from 'react';
import { useTokenList } from '@/lib/hooks/useTokenList';
import { useWatchTokenCreated } from '@/lib/hooks/useTokenEvents';
import { TrendingSection } from '@/components/TrendingSection';
import { FilterBar } from '@/components/FilterBar';
import { TokenCard } from '@/components/TokenCard';

export default function Home() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    tab: 'all',
    showNsfw: false,
  });
  const [sortBy, setSortBy] = useState('recent');
  const [allTokens, setAllTokens] = useState<any[]>([]);
  
  // Fetch all tokens from blockchain
  const { tokens, isLoading, error } = useTokenList();
  
  // Update local state when tokens load
  useEffect(() => {
    setAllTokens(tokens);
  }, [tokens]);
  
  // Watch for new token events and add them to the list
  useWatchTokenCreated((event) => {
    const newToken = {
      address: event.token,
      bondingCurve: event.bondingCurve,
      creator: event.creator,
      name: event.name,
      symbol: event.symbol,
      timestamp: Number(event.timestamp),
    };
    setAllTokens((prev) => [newToken, ...prev]);
  });
  
  // Get trending tokens (top 10 by market cap or recent activity)
  const trendingTokens = [...allTokens]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 10);
  
  // Sort tokens based on selected sort option
  const sortedTokens = [...allTokens].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return (b.timestamp || 0) - (a.timestamp || 0);
      case 'marketcap':
        // Will be implemented when we have market cap data
        return 0;
      case 'volume':
        // Will be implemented when we have volume data
        return 0;
      case 'price':
        // Will be implemented when we have price change data
        return 0;
      default:
        return 0;
    }
  });
  
  // Filter tokens based on active filters
  const filteredTokens = sortedTokens.filter(token => {
    if (filters.tab === 'featured') {
      // Filter for featured tokens (can be based on market cap, volume, etc.)
      return true; // For now, show all
    }
    return true;
  });
  
  return (
    <div className="space-y-6 min-h-screen">
      {/* Trending Section */}
      {trendingTokens.length > 0 && (
        <TrendingSection tokens={trendingTokens} />
      )}
      
      {/* Filter Bar */}
      <FilterBar 
        onFilterChange={setFilters}
        onViewModeChange={setViewMode}
        onSortChange={setSortBy}
      />
      
      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-400">Loading tokens...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-500">Error loading tokens: {error.message}</p>
        </div>
      )}
      
      {/* Token Grid */}
      {!isLoading && filteredTokens.length > 0 && (
        <div className={`grid gap-4 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredTokens.map((token) => (
            <TokenCard key={token.address} token={token} compact={viewMode === 'list'} />
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && filteredTokens.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No tokens yet</h3>
          <p className="text-gray-400 mb-6">Be the first to create a token!</p>
          <a
            href="/create"
            className="inline-block bg-primary text-black px-8 py-3 rounded-lg font-bold hover:bg-primary/90 transition"
          >
            Create Token
          </a>
        </div>
      )}
    </div>
  );
}
