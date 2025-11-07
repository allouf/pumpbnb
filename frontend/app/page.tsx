'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTokenList, TokenListFilters } from '@/lib/hooks/useTokenList';
import { useWatchTokenCreated } from '@/lib/hooks/useTokenEvents';
import { TrendingSection } from '@/components/TrendingSection';
import { FilterBar, FilterValues } from '@/components/FilterBar';
import { TokenCard } from '@/components/TokenCard';
import { cachedFetch } from '@/lib/utils/fetchWithRetry';
import { useWatchTokenCreated } from '@/lib/hooks/useTokenEvents';
import { formatPrice, formatMarketCap, formatVolume, formatPercent, getPercentChangeColor } from '@/lib/utils/formatters';

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
  const { tokens, isLoading, error, isOffline, offlineMessage } = useTokenList({ filters: tokenFilters, disablePolling: true });

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

      {/* Offline Message */}
      {isOffline && offlineMessage && (
        <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-orange-500">🔌</span>
            <p className="text-orange-500">{offlineMessage}</p>
          </div>
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
              <table className="w-full text-xs">
                <thead className="text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="text-left py-2 px-2 text-xs">#</th>
                    <th className="text-left py-2 px-2 text-xs">COIN</th>
                    <th className="text-left py-2 px-2 text-xs">GRAPH</th>
                    <th className="text-left py-2 px-2 text-xs">MCAP</th>
                    <th className="text-left py-2 px-2 text-xs">PRICE</th>
                    <th className="text-left py-2 px-2 text-xs">AGE</th>
                    <th className="text-left py-2 px-2 text-xs">24H VOL</th>
                    <th className="text-left py-2 px-2 text-xs">TRADES</th>
                    <th className="text-left py-2 px-2 text-xs">1H</th>
                    <th className="text-left py-2 px-2 text-xs">24H</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token, index) => {
                    const stats = token.stats;
                    console.log('[Table] Token:', token.symbol, 'Stats:', stats);

                    // Use imported formatters with better precision for small numbers

                    return (
                      <tr
                        key={token.address}
                        className="border-b border-gray-800 hover:bg-secondary-light/30 transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/token/${token.address}`}
                      >
                        <td className="py-2 px-2 text-gray-500 text-xs">#{index + 1}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {token.imageUrl ? (
                                <img
                                  src={token.imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                  alt={token.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector('.fallback-icon')) {
                                      const fallback = document.createElement('span');
                                      fallback.className = 'fallback-icon text-gray-500 text-xs';
                                      fallback.textContent = token.symbol.charAt(0).toUpperCase();
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-gray-500 text-xs">{token.symbol.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-white text-xs truncate">{token.name}</div>
                              <div className="text-xs text-gray-400">{token.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <div className="w-16 h-8 bg-gray-800 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-600">📈</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-white font-medium text-xs">
                          {stats ? formatMarketCap(stats.marketCap) : '$0'}
                        </td>
                        <td className="py-2 px-2 text-white text-xs" title={`${formatPrice(stats?.price, { currency: 'ASTER' })}`}>
                          {stats ? formatPrice(stats.price) : '$0'}
                        </td>
                        <td className="py-2 px-2 text-gray-400 text-xs">
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
                        <td className="py-2 px-2 text-white text-xs">
                          {stats ? formatVolume(stats.volume24h, 'ASTER') : '0 ASTER'}
                        </td>
                        <td className="py-2 px-2 text-gray-400 text-xs">
                          {stats?.trades24h || 0}
                        </td>
                        <td className={`py-2 px-2 text-xs font-medium ${getPercentChangeColor(stats?.priceChange1h)}`}>
                          {formatPercent(stats?.priceChange1h)}
                        </td>
                        <td className={`py-2 px-2 text-xs font-medium ${getPercentChangeColor(stats?.priceChange24h)}`}>
                          {formatPercent(stats?.priceChange24h)}
                        </td>
                      </tr>
                    );
                  })}
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
