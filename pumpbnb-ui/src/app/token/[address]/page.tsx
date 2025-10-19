'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TokenInfo } from '@/components/token/TokenInfo';
import { PriceChart } from '@/components/trading/PriceChart';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { CommentsSection } from '@/components/token/CommentsSection';
import { Button } from '@/components/ui/Button';
import { GraduationAnimation } from '@/components/token/GraduationAnimation';
import { GraduatedBadge } from '@/components/token/GraduatedBadge';
import { GraduationProgress } from '@/components/token/GraduationProgress';
import { GraduationResult } from '@/lib/mock-data/mockGraduation';
import { getTokenGraduationProgress, getTokenAsterAccumulated } from '@/lib/mock-data/tokenGraduationTracker';
import {
  ArrowLeftIcon,
  ShareIcon,
  StarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import { Token, mockTokens } from '@/lib/mock-data/tokens';

export default function TokenDetailPage() {
  const params = useParams();
  const address = params.address as string;

  const [token, setToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [showFeaturedClips, setShowFeaturedClips] = useState(true);
  const [showGraduationModal, setShowGraduationModal] = useState(false);
  const [hasGraduated, setHasGraduated] = useState(false);
  const [graduationProgress, setGraduationProgress] = useState(0);

  // Fetch token by address
  useEffect(() => {
    const fetchToken = async () => {
      try {
        setIsLoading(true);

        // Try API first
        let foundToken = null;
        try {
          const response = await apiClient.get(`/tokens`);
          const tokens = response.data || [];
          foundToken = tokens.find((t: any) =>
            t.contractAddress === address || t.id === address
          );

          if (foundToken) {
            // Map API response to Token interface
            setToken({
              address: foundToken.contractAddress || foundToken.id,
              name: foundToken.name,
              symbol: foundToken.symbol,
              description: foundToken.description,
              image: foundToken.imageUrl || '/api/placeholder/400/400',
              creator: foundToken.creatorId,
              createdAt: foundToken.createdAt,
              marketCap: foundToken.marketCap,
              price: foundToken.price,
              priceChange24h: foundToken.priceChange24h,
              volume24h: foundToken.volume24h,
              holders: foundToken.holders,
              graduationProgress: foundToken.graduationProgress,
              isGraduated: foundToken.isGraduated,
              socialLinks: {
                website: foundToken.websiteUrl,
                twitter: foundToken.twitterUrl,
                telegram: foundToken.telegramUrl,
              },
            });
            return;
          }
        } catch (apiError) {
          console.warn('API fetch failed, falling back to mock data:', apiError);
        }

        // Fallback to mock data if API fails or token not found
        const mockToken = mockTokens.find(t =>
          t.address.toLowerCase() === address.toLowerCase()
        );

        if (mockToken) {
          setToken(mockToken);
        } else {
          setError('Token not found');
        }
      } catch (err) {
        console.error('Error fetching token:', err);
        setError('Failed to load token');
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, [address]);

  // Update graduation progress dynamically
  useEffect(() => {
    if (!token) return;

    const updateProgress = () => {
      const currentProgress = getTokenAsterAccumulated(token.address);
      setGraduationProgress(currentProgress);
    };

    // Initial update
    updateProgress();

    // Poll for updates every 2 seconds
    const interval = setInterval(updateProgress, 2000);

    return () => clearInterval(interval);
  }, [token]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading token...</p>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Token Not Found</h1>
        <p className="text-text-secondary mb-6">
          {error || "The token you're looking for doesn't exist or has been removed."}
        </p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${token.name} (${token.symbol}) on AsterFun`,
        text: `Check out ${token.name} on AsterFun - ${token.description}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Add toast notification here
    }
  };

  const handleGraduationComplete = (result: GraduationResult) => {
    if (result.success) {
      // Update token state to graduated
      setToken(prev => prev ? { ...prev, isGraduated: true, graduationProgress: 100 } : null);
      setHasGraduated(true);
      setShowGraduationModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-green to-accent-blue flex items-center justify-center text-black font-bold text-lg">
              {token.symbol.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{token.name}</h1>
              <p className="text-sm text-text-secondary">${token.symbol}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsWatchlisted(!isWatchlisted)}
          >
            <StarIcon className={`w-4 h-4 ${isWatchlisted ? 'fill-accent-yellow text-accent-yellow' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
          >
            <ShareIcon className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <ExclamationTriangleIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_300px] gap-4 lg:gap-6">
        
        {/* Left Sidebar - Token Info & Graduation */}
        <div className="order-2 xl:order-1 space-y-4">
          <TokenInfo token={token} />

          {/* Graduation Progress or Graduated Badge */}
          {token.isGraduated || hasGraduated || graduationProgress >= 100 ? (
            <GraduatedBadge
              tokenAddress={token.address}
              tokenSymbol={token.symbol}
              graduationDate={token.createdAt}
            />
          ) : (
            <GraduationProgress
              tokenAddress={token.address}
              tokenName={token.name}
              tokenSymbol={token.symbol}
              graduationProgress={graduationProgress}
              isGraduated={token.isGraduated || hasGraduated || graduationProgress >= 100}
              onGraduate={() => setShowGraduationModal(true)}
            />
          )}
        </div>

        {/* Center - Chart and Comments */}
        <div className="order-1 xl:order-2 space-y-6">
          {/* Price Chart */}
          <PriceChart token={token} />
          
          {/* Featured Clips Section */}
          {showFeaturedClips && (
            <div className="bg-background-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Featured clips</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowFeaturedClips(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Mock featured clips */}
                <div className="bg-background-dark rounded-lg p-4 text-center">
                  <div className="w-full h-32 bg-gradient-to-br from-accent-purple to-accent-blue rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-white font-bold">▶</span>
                  </div>
                  <p className="text-xs text-text-muted">Streamed on Oct 15, 2025</p>
                  <p className="text-xs text-text-secondary">2:16</p>
                </div>
                
                <div className="bg-background-dark rounded-lg p-4 text-center">
                  <div className="w-full h-32 bg-gradient-to-br from-accent-yellow to-accent-blue rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-white font-bold">▶</span>
                  </div>
                  <p className="text-xs text-text-muted">Streamed on Oct 15, 2025</p>
                  <p className="text-xs text-text-secondary">1:43</p>
                </div>
              </div>
              
              <div className="text-center mt-4">
                <Button variant="outline" size="sm">
                  see all
                </Button>
              </div>
            </div>
          )}
          
          {/* Comments Section */}
          <CommentsSection tokenSymbol={token.symbol} />
        </div>

        {/* Right Sidebar - Trading Panel */}
        <div className="order-3 xl:order-3">
          <TradingPanel token={token} />
        </div>
      </div>

      {/* Mobile: Additional Stats */}
      <div className="xl:hidden bg-background-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-text-primary">
              {token.holders}
            </div>
            <div className="text-sm text-text-muted">Holders</div>
          </div>
          <div>
            <div className="text-lg font-bold text-text-primary">
              ${(token.volume24h / 1000).toFixed(1)}K
            </div>
            <div className="text-sm text-text-muted">24h Volume</div>
          </div>
        </div>
      </div>

      {/* Graduation Progress or Badge (Mobile) */}
      <div className="xl:hidden">
        {token.isGraduated || hasGraduated || graduationProgress >= 100 ? (
          <GraduatedBadge
            tokenAddress={token.address}
            tokenSymbol={token.symbol}
            graduationDate={token.createdAt}
          />
        ) : (
          <GraduationProgress
            tokenAddress={token.address}
            tokenName={token.name}
            tokenSymbol={token.symbol}
            graduationProgress={graduationProgress}
            isGraduated={token.isGraduated || hasGraduated || graduationProgress >= 100}
            onGraduate={() => setShowGraduationModal(true)}
          />
        )}
      </div>

      {/* Graduation Animation Modal */}
      {showGraduationModal && (
        <GraduationAnimation
          tokenAddress={token.address}
          tokenName={token.name}
          tokenSymbol={token.symbol}
          onComplete={handleGraduationComplete}
          onClose={() => setShowGraduationModal(false)}
        />
      )}
    </div>
  );
}