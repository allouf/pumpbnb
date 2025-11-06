'use client';

import { useState, useEffect, useMemo } from 'react';
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

  // Memoize token list filters to prevent infinite loop
  // Use JSON.stringify for advancedFilters to ensure proper dependency tracking
  const tokenFilters: TokenListFilters = useMemo(() => ({
    sortBy: mapSortOptionToBackend(sortOption),
    sortOrder: sortOption === 'oldestCoins' ? 'asc' : 'desc',
    isGraduated: sortOption === 'currentlyLive' ? false : undefined,
    isNsfw: showNsfw ? true : undefined,
    minMarketCap: advancedFilters.minMcap > 0 ? advancedFilters.minMcap : undefined,
    maxMarketCap: advancedFilters.maxMcap < 1000 ? advancedFilters.maxMcap : undefined,
    minVolume24h: advancedFilters.minVolume > 0 ? advancedFilters.minVolume : undefined,
    maxVolume24h: advancedFilters.maxVolume < 500 ? advancedFilters.maxVolume : undefined,
    limit: 100,
  }), [sortOption, showNsfw, JSON.stringify(advancedFilters)]);

  // Fetch all tokens with current filters - NO POLLING
  const { tokens, isLoading, error } = useTokenList({ filters: tokenFilters, disablePolling: true });

  // Fetch trending tokens ONCE on page load only
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        console.log('[Home] Fetching trending tokens...');
        setIsTrendingLoading(true);
        const url = `${API_URL}/api/v2/tokens/trending?limit=4`;
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

      {/* Token Display */}
      {!isLoading && tokens.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tokens.map((token) => (
                <TokenCard
                  key={token.address}
                  token={token}
                  compact={false}
                  showAnimations={showAnimations}
                />
              ))}
            </div>
          ) : (
            /* List View - Table Format like pump.fun */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="text-left py-3 px-4">#</th>
                    <th className="text-left py-3 px-4">COIN</th>
                    <th className="text-left py-3 px-4">MCAP</th>
                    <th className="text-left py-3 px-4">PRICE</th>
                    <th className="text-left py-3 px-4">AGE</th>
                    <th className="text-left py-3 px-4">24H VOL</th>
                    <th className="text-left py-3 px-4">TRADERS</th>
                    <th className="text-left py-3 px-4">TXNS</th>
                    <th className="text-left py-3 px-4">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token, index) => (
                    <tr
                      key={token.address}
                      className="border-b border-gray-800 hover:bg-secondary-light/30 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/token/${token.address}`}
                    >
                      <td className="py-4 px-4 text-gray-500">#{index + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={token.imageUrl || '/placeholder-token.png'}
                            alt={token.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <div className="font-semibold text-white">{token.name}</div>
                            <div className="text-xs text-gray-400">{token.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white font-medium">
                        ${((token as any).stats?.marketCap || '0')}
                      </td>
                      <td className="py-4 px-4 text-white">
                        ${((token as any).stats?.currentPrice || '0')}
                      </td>
                      <td className="py-4 px-4 text-gray-400">
                        {(() => {
                          const now = Date.now();
                          const created = token.timestamp * 1000;
                          const diff = now - created;
                          const hours = Math.floor(diff / (1000 * 60 * 60));
                          const days = Math.floor(hours / 24);
                          if (days > 0) return `${days}d`;
                          return `${hours}h`;
                        })()}
                      </td>
                      <td className="py-4 px-4 text-white">
                        ${((token as any).stats?.volume24h || '0')}
                      </td>
                      <td className="py-4 px-4 text-gray-400">
                        {((token as any).stats?.holders || '0')}
                      </td>
                      <td className="py-4 px-4 text-gray-400">
                        {((token as any).stats?.transactions || '0')}
                      </td>
                      <td className="py-4 px-4">
                        {token.isGraduated ? (
                          <span className="text-green-500 text-xs font-semibold">GRADUATED</span>
                        ) : (
                          <span className="text-primary text-xs font-semibold">LIVE</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
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
