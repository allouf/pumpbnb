'use client';

import { useState, useEffect } from 'react';
import { useTokenList, TokenListFilters } from '@/lib/hooks/useTokenList';
import { useWatchTokenCreated } from '@/lib/hooks/useTokenEvents';
import { TrendingSection } from '@/components/TrendingSection';
import { FilterBar } from '@/components/FilterBar';
import { TokenCard } from '@/components/TokenCard';
import { FilterValues } from '@/components/FilterModal';
import { cachedFetch } from '@/lib/utils/fetchWithRetry';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAnimations, setShowAnimations] = useState(true);
  const [showNsfw, setShowNsfw] = useState(false);
  const [sortOption, setSortOption] = useState('featured');
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>({
    minMcap: 0,
    maxMcap: 1000,
    minVolume: 0,
    maxVolume: 500,
  });
  const [trendingTokens, setTrendingTokens] = useState<any[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);

  // Build token list filters from state
  const tokenFilters: TokenListFilters = {
    sortBy: mapSortOptionToBackend(sortOption),
    sortOrder: sortOption === 'oldestCoins' ? 'asc' : 'desc',
    isGraduated: sortOption === 'currentlyLive' ? false : undefined,
    isNsfw: showNsfw ? true : undefined,
    minMarketCap: advancedFilters.minMcap > 0 ? advancedFilters.minMcap : undefined,
    maxMarketCap: advancedFilters.maxMcap < 1000 ? advancedFilters.maxMcap : undefined,
    minVolume24h: advancedFilters.minVolume > 0 ? advancedFilters.minVolume : undefined,
    maxVolume24h: advancedFilters.maxVolume < 500 ? advancedFilters.maxVolume : undefined,
    limit: 100,
  };

  // Fetch all tokens with current filters
  const { tokens, isLoading, error } = useTokenList({ filters: tokenFilters });

  // Fetch trending tokens ONCE on page load only
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        console.log('[Home] Fetching trending tokens...');
        setIsTrendingLoading(true);
        const url = `${API_URL}/api/v2/tokens/trending?limit=10`;
        console.log('[Home] Trending URL:', url);

        // Use cachedFetch with retry logic
        const data = await cachedFetch(url, {
          cacheTTL: 60000, // Cache for 1 minute (since we don't poll)
          retries: 3,
          retryDelay: 1000,
          onRetry: (attempt, error) => {
            console.warn(`[Home] Trending retry attempt ${attempt}:`, error);
          },
        });

        console.log('[Home] Trending data received:', data);
        setTrendingTokens(data.data || []);
        console.log('[Home] Trending tokens set:', data.data?.length || 0, 'tokens');
      } catch (err) {
        console.error('[Home] Error fetching trending tokens:', err);
        // Don't show error to user for trending - just silently fail
      } finally {
        setIsTrendingLoading(false);
      }
    };

    // Fetch ONLY ONCE on mount - no polling!
    fetchTrending();
  }, []);

  // Watch for new token events
  useWatchTokenCreated((event) => {
    // New tokens will be picked up by the polling in useTokenList
    console.log('New token created:', event.token);
  });

  // Handle filter changes from FilterBar
  const handleFilterChange = (filters: any) => {
    if (filters.showNsfw !== undefined) {
      setShowNsfw(filters.showNsfw);
    }
    if (filters.showAnimations !== undefined) {
      setShowAnimations(filters.showAnimations);
    }
    if (filters.sortOption !== undefined) {
      setSortOption(filters.sortOption);
    }
  };

  // Handle sort changes
  const handleSortChange = (sort: string) => {
    setSortOption(sort);
  };

  // Handle advanced filter changes
  const handleAdvancedFilterChange = (filters: FilterValues) => {
    setAdvancedFilters(filters);
  };

  return (
    <div className="space-y-6 min-h-screen">
      {/* Trending Section */}
      {!isTrendingLoading && trendingTokens.length > 0 && (
        <TrendingSection tokens={trendingTokens} />
      )}

      {/* Filter Bar */}
      <FilterBar
        onFilterChange={handleFilterChange}
        onViewModeChange={setViewMode}
        onSortChange={handleSortChange}
        onAdvancedFilterChange={handleAdvancedFilterChange}
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
      {!isLoading && tokens.length > 0 && (
        <div
          className={`grid gap-4 ${
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}
        >
          {tokens.map((token) => (
            <TokenCard
              key={token.address}
              token={token}
              compact={viewMode === 'list'}
              showAnimations={showAnimations}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tokens.length === 0 && !error && (
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

// Helper function to map frontend sort options to backend sortBy values
function mapSortOptionToBackend(sortOption: string): string {
  const mapping: Record<string, string> = {
    featured: 'volume24h',
    createdAt: 'createdAt',
    lastTraded: 'lastTraded',
    oldestCoins: 'oldestCoins',
    lastReply: 'lastReply',
    currentlyLive: 'createdAt', // Will be filtered by isGraduated=false
    highestMcap: 'highestMcap',
    topGainers: 'topGainers',
  };
  return mapping[sortOption] || 'createdAt';
}
