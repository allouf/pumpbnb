import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Token, formatMarketCap, formatTimeAgo } from '@/lib/mock-data/tokens';

interface TokenCardProps {
  token: Token;
  compact?: boolean;
}

export function TokenCard({ token, compact = false }: TokenCardProps) {
  const progressPercentage = Math.min(token.graduationProgress, 100);
  const isNearGraduation = token.graduationProgress >= 80;
  const priceChangeColor = token.priceChange24h >= 0 ? 'text-primary-green' : 'text-primary-red';

  return (
    <div className="bg-background-card border border-border rounded-lg p-3 sm:p-4 hover:border-border-light transition-all duration-200 group">
      {/* Token Header */}
      <Link href={`/token/${token.address}`} className="block">
        <div className="flex items-start gap-3 mb-3">
          {/* Token Image */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-green to-accent-blue flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
            {token.symbol.charAt(0)}
          </div>

          {/* Token Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-text-primary truncate group-hover:text-primary-green transition-colors">
                  {token.name}
                </h3>
                <p className="text-sm text-text-secondary">
                  ${token.symbol}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-text-primary">
                  {formatMarketCap(token.marketCap)}
                </p>
                <p className={`text-xs font-medium ${priceChangeColor}`}>
                  {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                </p>
              </div>
            </div>
            
            {/* Time and Transaction Info */}
            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
              <span>{formatTimeAgo(token.createdAt)}</span>
              <span>•</span>
              <span>TX {token.holders}</span>
              {token.volume24h > 0 && (
                <>
                  <span>•</span>
                  <span>Vol {formatMarketCap(token.volume24h)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
          {token.description}
        </p>
      </Link>

      {/* Progress Bar (for non-graduated tokens) */}
      {!token.isGraduated && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-text-muted">
              {isNearGraduation ? 'Graduating soon!' : 'Bonding curve progress:'}
            </span>
            <span className="text-xs font-medium text-text-secondary">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-background-dark rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isNearGraduation 
                  ? 'bg-gradient-to-r from-primary-green to-accent-yellow animate-pulse-green' 
                  : 'bg-primary-green'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Graduated Badge */}
      {token.isGraduated && (
        <div className="mb-3">
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary-green/20 border border-primary-green/30">
            <div className="w-2 h-2 bg-primary-green rounded-full mr-2"></div>
            <span className="text-xs font-medium text-primary-green">Graduated</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          className="flex-1"
          variant="primary"
        >
          +0.01 BNB
        </Button>
        
        {/* Additional info */}
        <div className="flex items-center gap-1 text-xs text-text-muted">
          {token.socialLinks.website && (
            <a 
              href={token.socialLinks.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              🌐
            </a>
          )}
          {token.socialLinks.twitter && (
            <a 
              href={token.socialLinks.twitter} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              🐦
            </a>
          )}
          {token.socialLinks.telegram && (
            <a 
              href={token.socialLinks.telegram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              💬
            </a>
          )}
        </div>
      </div>
    </div>
  );
}