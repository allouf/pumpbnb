'use client';

import { useState } from 'react';
import { Squares2X2Icon, ListBulletIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { FilterModal, FilterValues } from './FilterModal';

interface ExploreSectionProps {
  onFilterChange?: (filters: any) => void;
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onSortChange?: (sort: string) => void;
  onAdvancedFilterChange?: (filters: FilterValues) => void;
  onTabChange?: (tab: 'explore' | 'watchlist') => void;
}

export function ExploreSection({
  onFilterChange,
  onViewModeChange,
  onSortChange,
  onAdvancedFilterChange,
  onTabChange
}: ExploreSectionProps) {
  const [activeTab, setActiveTab] = useState<'explore' | 'watchlist'>('explore');
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

  const handleTabChange = (tab: 'explore' | 'watchlist') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

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
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-800">
          <button
            onClick={() => handleTabChange('explore')}
            className={`pb-2 px-1 font-medium transition-colors relative ${
              activeTab === 'explore'
                ? 'text-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Explore
            {activeTab === 'explore' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => handleTabChange('watchlist')}
            className={`pb-2 px-1 font-medium transition-colors relative ${
              activeTab === 'watchlist'
                ? 'text-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Watchlist
            {activeTab === 'watchlist' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Filter Buttons - All on One Line */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {/* Filter Pills */}
          <button
            onClick={() => handleSortChange('featured')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              sortOption === 'featured'
                ? 'bg-primary text-black'
                : 'bg-secondary-light text-white hover:bg-secondary-light/80'
            }`}
          >
            <span className="text-sm">🔥</span>
            Featured
          </button>

          <button
            onClick={() => handleSortChange('mayhem')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              sortOption === 'mayhem'
                ? 'bg-primary text-black'
                : 'bg-secondary-light text-white hover:bg-secondary-light/80'
            }`}
          >
            <span className="text-sm">🔥</span>
            Mayhem
          </button>

          <button
            onClick={() => handleSortChange('currentlyLive')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              sortOption === 'currentlyLive'
                ? 'bg-primary text-black'
                : 'bg-secondary-light text-white hover:bg-secondary-light/80'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Live now
          </button>

          <button
            onClick={() => handleSortChange('highestMcap')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              sortOption === 'highestMcap'
                ? 'bg-primary text-black'
                : 'bg-secondary-light text-white hover:bg-secondary-light/80'
            }`}
          >
            <span className="text-sm">💰</span>
            Most valuable
          </button>

          <button
            onClick={() => handleSortChange('createdAt')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              sortOption === 'createdAt'
                ? 'bg-primary text-black'
                : 'bg-secondary-light text-white hover:bg-secondary-light/80'
            }`}
          >
            <span className="text-sm">✨</span>
            New coins
          </button>

          <button
            onClick={() => handleSortChange('oldestCoins')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              sortOption === 'oldestCoins'
                ? 'bg-primary text-black'
                : 'bg-secondary-light text-white hover:bg-secondary-light/80'
            }`}
          >
            <span className="text-sm">🚀</span>
            Oldest coins
          </button>

          <button
            onClick={() => handleSortChange('lastReply')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              sortOption === 'lastReply'
                ? 'bg-primary text-black'
                : 'bg-secondary-light text-white hover:bg-secondary-light/80'
            }`}
          >
            <span className="text-sm">💬</span>
            Last reply
          </button>

          {/* NSFW Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 bg-secondary-light rounded-md hover:bg-secondary-light/80 transition-colors whitespace-nowrap flex-shrink-0">
            <span className="text-xs text-white font-medium">Nsfw</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showNsfw}
                onChange={handleNsfwToggle}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:start-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </label>

          {/* Animations Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 bg-secondary-light rounded-md hover:bg-secondary-light/80 transition-colors whitespace-nowrap flex-shrink-0">
            <span className="text-xs text-white font-medium">Animations</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showAnimations}
                onChange={handleAnimationsToggle}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:start-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </label>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-700 flex-shrink-0"></div>

          {/* Filter Button */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:bg-secondary-light rounded-md transition-colors whitespace-nowrap flex-shrink-0"
          >
            <FunnelIcon className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          {/* View Mode Toggles */}
          <div className="flex border border-gray-700 rounded-md overflow-hidden flex-shrink-0">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-primary text-black font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-secondary-light'
              }`}
              aria-label="Grid view"
              title="Grid view"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-primary text-black font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-secondary-light'
              }`}
              aria-label="List view"
              title="List view"
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
