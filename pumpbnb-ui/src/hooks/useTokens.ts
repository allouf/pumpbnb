'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient, { PaginationResponse } from '@/lib/api/client';

interface TokensState {
  tokens: any[];
  trendingTokens: any[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  } | null;
}

interface TokensFilters {
  page?: number;
  limit?: number;
  category?: 'graduated' | 'about-to-graduate' | 'newly-created';
  featured?: boolean;
  nsfw?: boolean;
  sortBy?: 'createdAt' | 'marketCap' | 'volume24h' | 'priceChange24h';
  order?: 'asc' | 'desc';
}

export const useTokens = (initialFilters: TokensFilters = {}) => {
  const [state, setState] = useState<TokensState>({
    tokens: [],
    trendingTokens: [],
    isLoading: true,
    error: null,
    pagination: null,
  });

  const [filters, setFilters] = useState<TokensFilters>(initialFilters);

  const fetchTokens = useCallback(async (newFilters: TokensFilters = filters, append = false) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    try {
      const response = await apiClient.getTokens(newFilters);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          tokens: append ? [...prev.tokens, ...response.data] : response.data,
          pagination: response.pagination || null,
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch tokens');
      }
    } catch (error: any) {
      console.error('Fetch tokens error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to fetch tokens',
        isLoading: false,
      }));
    }
  }, []); // Empty dependency array since we don't want it to change

  const fetchTrendingTokens = useCallback(async () => {
    try {
      const response = await apiClient.getTrendingTokens();
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          trendingTokens: response.data,
        }));
      }
    } catch (error: any) {
      console.error('Fetch trending tokens error:', error);
      // Don't set error state for trending tokens as it's secondary data
    }
  }, []);

  const loadMore = () => {
    if (state.pagination?.hasMore) {
      const nextPage = (state.pagination.page || 1) + 1;
      const newFilters = { ...filters, page: nextPage };
      setFilters(newFilters);
      fetchTokens(newFilters, true);
    }
  };

  const updateFilters = (newFilters: Partial<TokensFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchTokens(updatedFilters);
  };

  const refresh = () => {
    fetchTokens(filters);
    fetchTrendingTokens();
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  useEffect(() => {
    fetchTokens();
    fetchTrendingTokens();
  }, [fetchTokens, fetchTrendingTokens]); // Depend on the memoized functions

  return {
    ...state,
    filters,
    fetchTokens,
    fetchTrendingTokens,
    loadMore,
    updateFilters,
    refresh,
    clearError,
  };
};

// Hook for individual token
export const useToken = (tokenId: string | undefined) => {
  const [state, setState] = useState<{
    token: any | null;
    isLoading: boolean;
    error: string | null;
  }>({
    token: null,
    isLoading: true,
    error: null,
  });

  const fetchToken = async (id: string) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    try {
      const response = await apiClient.getToken(id);
      
      if (response.success && response.data) {
        setState({
          token: response.data,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.message || 'Token not found');
      }
    } catch (error: any) {
      console.error('Fetch token error:', error);
      setState({
        token: null,
        isLoading: false,
        error: error.message || 'Failed to fetch token',
      });
    }
  };

  const refresh = () => {
    if (tokenId) {
      fetchToken(tokenId);
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  useEffect(() => {
    if (tokenId) {
      fetchToken(tokenId);
    }
  }, [tokenId]);

  return {
    ...state,
    fetchToken,
    refresh,
    clearError,
  };
};

// Hook for creating tokens
export const useCreateToken = () => {
  const [state, setState] = useState<{
    isLoading: boolean;
    error: string | null;
    success: boolean;
  }>({
    isLoading: false,
    error: null,
    success: false,
  });

  const createToken = async (tokenData: {
    name: string;
    symbol: string;
    description: string;
    imageUrl?: string;
    websiteUrl?: string;
    twitterUrl?: string;
    telegramUrl?: string;
    discordUrl?: string;
    totalSupply?: string;
  }) => {
    setState({ isLoading: true, error: null, success: false });

    try {
      const response = await apiClient.createToken(tokenData);
      
      if (response.success) {
        setState({
          isLoading: false,
          error: null,
          success: true,
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create token');
      }
    } catch (error: any) {
      console.error('Create token error:', error);
      setState({
        isLoading: false,
        error: error.message || 'Failed to create token',
        success: false,
      });
      throw error;
    }
  };

  const reset = () => {
    setState({
      isLoading: false,
      error: null,
      success: false,
    });
  };

  return {
    ...state,
    createToken,
    reset,
  };
};

export default useTokens;