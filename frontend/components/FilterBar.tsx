'use client';

import { useState } from 'react';
import { Squares2X2Icon, ListBulletIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface FilterBarProps {
  onFilterChange?: (filters: any) => void;
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onSortChange?: (sort: string) => void;
}

export function FilterBar({ onFilterChange, onViewModeChange, onSortChange }: FilterBarProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNsfw, setShowNsfw] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onFilterChange?.({ tab, showNsfw });
  };
  
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };
  
  const handleNsfwToggle = () => {
    const newValue = !showNsfw;
    setShowNsfw(newValue);
    onFilterChange?.({ tab: activeTab, showNsfw: newValue });
  };
  
  const handleSortChange = (value: string) => {
    setSortBy(value);
    onSortChange?.(value);
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => handleTabChange('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'all' 
              ? 'bg-primary text-black' 
              : 'bg-secondary-light text-gray-400 hover:text-white'
          }`}
        >
          All
        </button>
        
        <button
          onClick={() => handleTabChange('featured')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'featured' 
              ? 'bg-primary text-black' 
              : 'bg-secondary-light text-gray-400 hover:text-white'
          }`}
        >
          Featured 🔥
        </button>
        
        {/* NSFW Toggle */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleNsfwToggle}
            className={`w-10 h-6 rounded-full transition-colors ${
              showNsfw ? 'bg-primary' : 'bg-gray-600'
            }`}
            aria-label="Toggle NSFW"
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
              showNsfw ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </button>
          <span className="text-sm text-gray-400">NSFW</span>
        </div>
        
        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-3 py-2 bg-secondary-light text-gray-400 rounded-lg text-sm border border-gray-700 focus:border-primary focus:outline-none"
        >
          <option value="recent">Most Recent</option>
          <option value="marketcap">Market Cap</option>
          <option value="volume">Volume</option>
          <option value="price">Price Change</option>
        </select>
      </div>
      
      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <button 
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <FunnelIcon className="w-4 h-4" />
          <span>Filter</span>
        </button>
        
        <div className="flex border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => handleViewModeChange('grid')}
            className={`p-2 transition-colors ${
              viewMode === 'grid' 
                ? 'bg-primary text-black' 
                : 'text-gray-400 hover:text-white hover:bg-secondary-light'
            }`}
            aria-label="Grid view"
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`p-2 transition-colors ${
              viewMode === 'list' 
                ? 'bg-primary text-black' 
                : 'text-gray-400 hover:text-white hover:bg-secondary-light'
            }`}
            aria-label="List view"
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
