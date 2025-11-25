'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useTokenList, TokenListFilters } from '@/lib/hooks/useTokenList';
import { useWatchTokenCreated } from '@/lib/hooks/useTokenEvents';
import { TrendingSection } from '@/components/TrendingSection';
import { ExploreSection } from '@/components/ExploreSection';
import { FilterValues } from '@/components/FilterBar';
import { TokenCard } from '@/components/TokenCard';
import { MiniSparkline } from '@/components/MiniSparkline';
import { cachedFetch } from '@/lib/utils/fetchWithRetry';
import { formatPrice, formatMarketCap, formatVolume, formatPercentage } from '@/lib/utils/formatNumbers';
import { getPercentChangeColor } from '@/lib/utils/formatters';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { getIpfsUrl } from '@/lib/utils/ipfs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get('search') || '';

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAnimations, setShowAnimations] = useState(true);
  const [showNsfw, setShowNsfw] = useState(false);
  const [sortOption, setSortOption] = useState('featured');
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [activeTab, setActiveTab] = useState<'explore' | 'watchlist'>('explore');

  // Update searchQuery when URL param changes
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>({
    minMcap: 0,
    maxMcap: 1000,
    minVolume: 0,
    maxVolume: 500,
  });
  const [trendingTokens, setTrendingTokens] = useState<any[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);

  // Watchlist from database
  const { getWatchlistAddresses, refresh: refreshWatchlist, isLoading: watchlistLoading } = useWatchlist(address);

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
    search: searchQuery || undefined,
    limit: 100,
  }), [sortOption, showNsfw, searchQuery, JSON.stringify(advancedFilters)]);

  // Fetch all tokens with current filters - NO POLLING
  const { tokens, isLoading, error, isOffline, offlineMessage } = useTokenList({ filters: tokenFilters, disablePolling: true });

  // Filter tokens based on active tab (explore vs watchlist)
  const displayedTokens = useMemo(() => {
    if (activeTab === 'watchlist') {
      // Filter tokens to only show ones in watchlist
      const watchlistAddresses = getWatchlistAddresses();
      return tokens.filter(token =>
        watchlistAddresses.some(w => w.toLowerCase() === token.address.toLowerCase())
      );
    }
    return tokens;
  }, [tokens, activeTab, getWatchlistAddresses]);

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

  // Handle tab change
  const handleTabChange = (tab: 'explore' | 'watchlist') => {
    setActiveTab(tab);
    // Refresh watchlist from database when switching to watchlist tab
    if (tab === 'watchlist') {
      refreshWatchlist();
    }
  };

  return (
    <div className="space-y-6 min-h-screen relative">
      {/* Trending Section - Only show when not searching */}
      {!searchQuery && !isTrendingLoading && trendingTokens.length > 0 && (
        <TrendingSection tokens={trendingTokens} />
      )}

      {/* Explore Section with Tabs and Filters */}
      <ExploreSection
        onFilterChange={handleFilterChange}
        onViewModeChange={setViewMode}
        onSortChange={handleSortChange}
        onAdvancedFilterChange={handleAdvancedFilterChange}
        onTabChange={handleTabChange}
      />

      {/* Floating Create Coin Button - Mobile Only */}
      <a
        href="/create"
        className="md:hidden fixed bottom-20 right-4 z-40 bg-primary hover:bg-primary-dark text-black font-bold rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
        title="Create Coin"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </a>

      {/* Section Title */}
      {!isLoading && displayedTokens.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            {activeTab === 'watchlist'
              ? 'Your Watchlist'
              : searchQuery
                ? `Search results for "${searchQuery}"`
                : 'Featured Tokens'}
          </h3>
        </div>
      )}

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
      {!isLoading && displayedTokens.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedTokens.map((token) => (
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
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-xs min-w-[600px] sm:min-w-0">
                <thead className="text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs">#</th>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs">COIN</th>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs hidden sm:table-cell">GRAPH</th>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs">MCAP</th>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs hidden md:table-cell">PRICE</th>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs hidden lg:table-cell">AGE</th>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs hidden lg:table-cell">24H VOL</th>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs hidden xl:table-cell">TRADES</th>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs hidden md:table-cell">1H</th>
                    <th className="text-left py-2 px-1 sm:px-2 text-xs">24H</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTokens.map((token, index) => {
                    const stats = token.stats;
                    console.log('[Table] Token:', token.symbol, 'Stats:', stats);

                    // Use imported formatters with better precision for small numbers

                    return (
                      <tr
                        key={token.address}
                        className="border-b border-gray-800 hover:bg-secondary-light/30 transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/token/${token.address}`}
                      >
                        <td className="py-2 px-1 sm:px-2 text-gray-500 text-xs">#{index + 1}</td>
                        <td className="py-2 px-1 sm:px-2">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {token.imageUrl ? (
                                <img
                                  src={getIpfsUrl(token.imageUrl)}
                                  alt={token.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector('.fallback-icon')) {
                                      // Safer DOM replacement instead of appendChild
                                      parent.innerHTML = `<span class="fallback-icon text-gray-500 text-xs">${token.symbol.charAt(0).toUpperCase()}</span>`;
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-gray-500 text-xs">{token.symbol.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-white text-xs truncate max-w-[80px] sm:max-w-none">{token.name}</div>
                              <div className="text-xs text-gray-400">{token.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-1 sm:px-2 hidden sm:table-cell">
                          <MiniSparkline
                            priceChange24h={stats?.priceChange24h}
                            tokenAddress={token.address}
                          />
                        </td>
                        <td className="py-2 px-1 sm:px-2 text-white font-medium text-xs" title={`${formatMarketCap(stats?.marketCap || 0, 'ASTER')}`}>
                          {stats?.marketCapUsd && stats.marketCapUsd !== '0' ? formatMarketCap(stats.marketCapUsd, 'USD') :
                           stats?.marketCap ? formatMarketCap(stats.marketCap, 'ASTER') : '$0'}
                        </td>
                        <td className="py-2 px-1 sm:px-2 text-white text-xs hidden md:table-cell" title={`${formatPrice(stats?.price || 0, { currency: 'ASTER' })}`}>
                          {stats?.priceUsd && stats.priceUsd !== '0' ? formatPrice(stats.priceUsd, { currency: 'USD' }) :
                           stats?.price ? formatPrice(stats.price, { currency: 'ASTER' }) : '$0'}
                        </td>
                        <td className="py-2 px-1 sm:px-2 text-gray-400 text-xs hidden lg:table-cell">
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
                        <td className="py-2 px-1 sm:px-2 text-white text-xs hidden lg:table-cell" title={`${formatVolume(stats?.volume24h || 0, 'ASTER')}`}>
                          {stats?.volume24hUsd ? formatVolume(stats.volume24hUsd, 'USD') : '$0'}
                        </td>
                        <td className="py-2 px-1 sm:px-2 text-gray-400 text-xs hidden xl:table-cell">
                          {stats?.trades24h || 0}
                        </td>
                        <td className={`py-2 px-1 sm:px-2 text-xs font-medium hidden md:table-cell ${getPercentChangeColor(stats?.priceChange1h)}`}>
                          {formatPercentage(stats?.priceChange1h || 0)}
                        </td>
                        <td className={`py-2 px-1 sm:px-2 text-xs font-medium ${getPercentChangeColor(stats?.priceChange24h)}`}>
                          {formatPercentage(stats?.priceChange24h || 0)}
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
      {!isLoading && displayedTokens.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {activeTab === 'watchlist' ? '⭐' : searchQuery ? '🔍' : '🚀'}
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {activeTab === 'watchlist'
              ? 'Your watchlist is empty'
              : searchQuery
                ? `No results found for "${searchQuery}"`
                : 'No tokens yet'}
          </h3>
          <p className="text-gray-400 mb-6">
            {activeTab === 'watchlist'
              ? 'Star tokens to add them to your watchlist!'
              : searchQuery
                ? 'Try a different search term or create your own token!'
                : 'Be the first to create a token!'}
          </p>
          {activeTab !== 'watchlist' && (
            <a
              href="/create"
              className="inline-block bg-primary text-black px-8 py-3 rounded-lg font-bold hover:bg-primary/90 transition"
            >
              Create Token
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to map frontend sort options to backend sortBy values
function mapSortOptionToBackend(sortOption: string): string {
  const mapping: Record<string, string> = {
    featured: 'volume24h',
    mayhem: 'trades24h', // Most active tokens by trade count
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
