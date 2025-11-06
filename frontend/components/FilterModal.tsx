'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  initialFilters: FilterValues;
}

export interface FilterValues {
  minMcap: number;
  maxMcap: number;
  minVolume: number;
  maxVolume: number;
}

export function FilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    const cleared = { minMcap: 0, maxMcap: 1000, minVolume: 0, maxVolume: 500 };
    setFilters(cleared);
    onApply(cleared);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-secondary border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Filter Tokens</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary-light rounded-lg transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Market Cap Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Market Cap (ASTER)
          </label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min</label>
              <input
                type="number"
                min="0"
                max="1000"
                value={filters.minMcap}
                onChange={(e) => setFilters({ ...filters, minMcap: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-secondary-light border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max</label>
              <input
                type="number"
                min="0"
                max="1000"
                value={filters.maxMcap}
                onChange={(e) => setFilters({ ...filters, maxMcap: parseFloat(e.target.value) || 1000 })}
                className="w-full px-3 py-2 bg-secondary-light border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          
          {/* MCap Slider */}
          <div className="px-1">
            <input
              type="range"
              min="0"
              max="1000"
              value={filters.minMcap}
              onChange={(e) => setFilters({ ...filters, minMcap: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
            <input
              type="range"
              min="0"
              max="1000"
              value={filters.maxMcap}
              onChange={(e) => setFilters({ ...filters, maxMcap: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb mt-2"
            />
          </div>
        </div>

        {/* 24h Volume Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            24h Volume (ASTER)
          </label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min</label>
              <input
                type="number"
                min="0"
                max="500"
                value={filters.minVolume}
                onChange={(e) => setFilters({ ...filters, minVolume: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-secondary-light border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max</label>
              <input
                type="number"
                min="0"
                max="500"
                value={filters.maxVolume}
                onChange={(e) => setFilters({ ...filters, maxVolume: parseFloat(e.target.value) || 500 })}
                className="w-full px-3 py-2 bg-secondary-light border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Volume Slider */}
          <div className="px-1">
            <input
              type="range"
              min="0"
              max="500"
              value={filters.minVolume}
              onChange={(e) => setFilters({ ...filters, minVolume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
            <input
              type="range"
              min="0"
              max="500"
              value={filters.maxVolume}
              onChange={(e) => setFilters({ ...filters, maxVolume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb mt-2"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-2 bg-secondary-light text-gray-300 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffc800;
          cursor: pointer;
          border: 2px solid #000;
        }

        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffc800;
          cursor: pointer;
          border: 2px solid #000;
        }
      `}</style>
    </div>
  );
}
