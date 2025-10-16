'use client';

import React from 'react';
import { Token, formatTimeAgo, formatMarketCap } from '@/lib/mock-data/tokens';
import { 
  ClipboardIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface TokenInfoProps {
  token: Token;
}

export function TokenInfo({ token }: TokenInfoProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="w-full xl:w-80 space-y-4">
      
      {/* Token Header */}
      <div className="bg-background-card border border-border rounded-lg p-6">
        <div className="text-center space-y-4">
          {/* Token Image */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-green to-accent-blue flex items-center justify-center text-black font-bold text-2xl mx-auto">
            <span>{token.symbol.charAt(0)}</span>
          </div>
          
          {/* Token Details */}
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{token.name}</h1>
            <p className="text-lg text-text-secondary">${token.symbol}</p>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-sm text-text-muted">Market Cap</div>
              <div className="text-lg font-semibold text-text-primary">
                {formatMarketCap(token.marketCap)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-text-muted">24h Volume</div>
              <div className="text-lg font-semibold text-text-primary">
                {formatMarketCap(token.volume24h)}
              </div>
            </div>
          </div>

          {/* Price Change */}
          <div className={`text-center p-3 rounded-lg ${
            token.priceChange24h >= 0 
              ? 'bg-primary-green/10 border border-primary-green/20'
              : 'bg-primary-red/10 border border-primary-red/20'
          }`}>
            <span className={`text-sm font-medium ${
              token.priceChange24h >= 0 ? 'text-primary-green' : 'text-primary-red'
            }`}>
              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}% (24h)
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {token.description && (
        <div className="bg-background-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Description</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {token.description}
          </p>
        </div>
      )}

      {/* Social Links */}
      {(token.socialLinks.website || token.socialLinks.twitter || token.socialLinks.telegram) && (
        <div className="bg-background-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Links</h3>
          <div className="space-y-2">
            {token.socialLinks.website && (
              <a
                href={token.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-dark transition-colors group"
              >
                <GlobeAltIcon className="w-5 h-5 text-text-muted group-hover:text-text-primary" />
                <span className="text-sm text-text-secondary group-hover:text-text-primary">
                  Website
                </span>
              </a>
            )}
            {token.socialLinks.twitter && (
              <a
                href={token.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-dark transition-colors group"
              >
                <div className="w-5 h-5 text-text-muted group-hover:text-text-primary">🐦</div>
                <span className="text-sm text-text-secondary group-hover:text-text-primary">
                  Twitter
                </span>
              </a>
            )}
            {token.socialLinks.telegram && (
              <a
                href={token.socialLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-dark transition-colors group"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-text-muted group-hover:text-text-primary" />
                <span className="text-sm text-text-secondary group-hover:text-text-primary">
                  Telegram
                </span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Contract Info */}
      <div className="bg-background-card border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Contract Info</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Contract Address</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-text-secondary">
                {formatAddress(token.address)}
              </span>
              <button
                onClick={() => copyToClipboard(token.address)}
                className="p-1 hover:bg-background-dark rounded transition-colors"
              >
                <ClipboardIcon className="w-4 h-4 text-text-muted hover:text-text-primary" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Creator</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-text-secondary">
                {formatAddress(token.creator)}
              </span>
              <button
                onClick={() => copyToClipboard(token.creator)}
                className="p-1 hover:bg-background-dark rounded transition-colors"
              >
                <ClipboardIcon className="w-4 h-4 text-text-muted hover:text-text-primary" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Created</span>
            <span className="text-sm text-text-secondary">
              {formatTimeAgo(token.createdAt)} ago
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Total Supply</span>
            <span className="text-sm text-text-secondary">
              1,000,000,000 {token.symbol}
            </span>
          </div>
        </div>
      </div>

      {/* Community Stats */}
      <div className="bg-background-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Community</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <UserGroupIcon className="w-6 h-6 text-text-muted mx-auto mb-1" />
            <div className="text-lg font-semibold text-text-primary">{token.holders}</div>
            <div className="text-xs text-text-muted">Holders</div>
          </div>
          <div className="text-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-text-muted mx-auto mb-1" />
            <div className="text-lg font-semibold text-text-primary">
              {Math.floor(Math.random() * 50) + 10}
            </div>
            <div className="text-xs text-text-muted">Comments</div>
          </div>
        </div>
      </div>

      {/* Join Community Button */}
      <div className="bg-background-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-primary-green to-accent-blue rounded-full flex items-center justify-center text-black text-xs font-bold">
            U
          </div>
          <span className="text-sm font-medium text-text-primary">UMAYBOTS chat</span>
        </div>
        <p className="text-xs text-text-muted mb-3">
          Join the community
        </p>
        <button className="w-full bg-primary-green text-black font-semibold py-2 px-4 rounded-lg hover:bg-green-400 transition-colors">
          Join chat
        </button>
      </div>
    </div>
  );
}