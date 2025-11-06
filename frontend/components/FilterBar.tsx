'use client';

import { useState } from 'react';
import { Squares2X2Icon, ListBulletIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { FilterModal, FilterValues } from './FilterModal';

interface FilterBarProps {
  onFilterChange?: (filters: any) => void;
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onSortChange?: (sort: string) => void;
  onAdvancedFilterChange?: (filters: FilterValues) => void;
}

export function FilterBar({ onFilterChange, onViewModeChange, onSortChange, onAdvancedFilterChange }: FilterBarProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNsfw, setShowNsfw] = useState(false);
  const [showAnimations, setShowAnimations] = useState(true);
  const [sortOption, setSortOption] = useState('featured');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>({
    minMcap: 0,
    maxMcap: 1000,
    minVolume: 0,
    maxVolume: 500,
  });
  
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };
  
  const handleNsfwToggle = () => {
    const newValue = !showNsfw;
    setShowNsfw(newValue);
    onFilterChange?.({ showNsfw: newValue, showAnimations, sortOption });
  };

  const handleAnimationsToggle = () => {
    const newValue = !showAnimations;
    setShowAnimations(newValue);
    onFilterChange?.({ showNsfw, showAnimations: newValue, sortOption });
  };
  
  const handleSortChange = (value: string) => {
    setSortOption(value);
    onSortChange?.(value);
    onFilterChange?.({ showNsfw, showAnimations, sortOption: value });
  };

  const handleAdvancedFilterApply = (filters: FilterValues) => {
    setAdvancedFilters(filters);
    onAdvancedFilterChange?.(filters);
  };
  
  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filter section */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort Dropdown */}
          <select
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-4 py-2 bg-secondary-light text-white rounded-lg text-sm border border-gray-700 focus:border-primary focus:outline-none font-medium"
          >
            <option value="featured">Featured 🔥</option>
            <option value="createdAt">Newly Created</option>
            <option value="lastTraded">Last Traded</option>
            <option value="oldestCoins">Oldest Coins</option>
            <option value="lastReply">Last Reply</option>
            <option value="currentlyLive">Currently Live</option>
            <option value="highestMcap">Highest MCap</option>
            <option value="topGainers">Top Gainers</option>
          </select>
          
          {/* NSFW Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showNsfw}
              onChange={handleNsfwToggle}
              className="w-4 h-4 rounded bg-secondary-light border-gray-700 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-400">NSFW</span>
          </label>

          {/* Animations Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAnimations}
              onChange={handleAnimationsToggle}
              className="w-4 h-4 rounded bg-secondary-light border-gray-700 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-400">Animations</span>
          </label>
        </div>
      
        {/* View mode toggle and filter button */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-secondary-light rounded-lg transition-colors"
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

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleAdvancedFilterApply}
        initialFilters={advancedFilters}
      />
    </>
  );
}
