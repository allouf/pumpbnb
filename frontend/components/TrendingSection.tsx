'use client';

import { useRef } from 'react';
import { TokenCard } from './TokenCard';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TrendingSectionProps {
  tokens: any[];
}

export function TrendingSection({ tokens }: TrendingSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320; // Card width + gap
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };
  
  if (!tokens || tokens.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Now trending 🔥</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 hover:bg-secondary-light rounded-lg transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 hover:bg-secondary-light rounded-lg transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {tokens.map(token => (
          <div key={token.address} className="min-w-[260px] sm:min-w-[300px] flex-shrink-0">
            <TokenCard token={token} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
