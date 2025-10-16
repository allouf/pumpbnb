'use client';

import React, { useState } from 'react';
import { TokenCard } from '@/components/token/TokenCard';
import { getTokensByCategory } from '@/lib/mock-data/tokens';
import { Button } from '@/components/ui/Button';
import { 
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

// Mock trending data
const trendingTokens = [
  {
    id: 1,
    name: 'The Lion (LION)',
    description: 'The Lion Does Not Concern Himself with New All-Time Highs',
    marketCap: '$4.2M',
    replies: 417,
    image: '/api/placeholder/100/100'
  },
  {
    id: 2,
    name: 'All Roads Lead To Rome (Rome)',
    description: 'If You See This, Your Time is Coming',
    marketCap: '$1.6M',
    replies: 222,
    image: '/api/placeholder/100/100'
  },
  {
    id: 3,
    name: 'Cap (CAP)',
    description: 'X Users Bet Against Each Other on Anything with CAP',
    marketCap: '$2.0M',
    replies: 389,
    image: '/api/placeholder/100/100'
  },
  {
    id: 4,
    name: 'Telepath8 (P8BTC)',
    description: 'Neuralink Patient Launches Streamer Coin Via Telepathy',
    marketCap: '$321.9K',
    replies: 349,
    image: '/api/placeholder/100/100'
  },
  {
    id: 5,
    name: 'Arcade (ARC)',
    description: 'Arcade Livestream: Top Players Win',
    marketCap: '$156.3K',
    replies: 89,
    image: '/api/placeholder/100/100'
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'featured' | 'nsfw' | 'animations'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const tokenCategories = getTokensByCategory();
  const allTokens = [...tokenCategories.newlyCreated, ...tokenCategories.aboutToGraduate, ...tokenCategories.graduated];

  return (
    <div className="space-y-6 min-h-screen">
      {/* Now Trending Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Now trending</h2>
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-background-card rounded">
              <ChevronLeftIcon className="w-5 h-5 text-text-secondary" />
            </button>
            <button className="p-1 hover:bg-background-card rounded">
              <ChevronRightIcon className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>
        
        {/* Horizontal Scroll Container */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {trendingTokens.map((token) => (
            <div key={token.id} className="min-w-[300px] bg-background-card rounded-lg border border-border p-4 hover:border-primary-green/50 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-background-sidebar rounded-lg flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary text-sm mb-1">{token.name}</div>
                  <div className="text-xs text-text-secondary mb-2">market cap: {token.marketCap}</div>
                  <div className="text-xs text-text-secondary mb-2">replies {token.replies}</div>
                  <div className="text-xs text-text-primary line-clamp-2">{token.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex items-center justify-between">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('featured')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
        {allTokens.map((token) => (
          <TokenCard key={token.address} token={token} compact={viewMode === 'list'} />
        ))}
      </div>
    </div>
  );
}
