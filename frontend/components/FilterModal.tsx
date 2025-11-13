'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { RangeSlider } from './RangeSlider';

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
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Market Cap (ASTER)
          </label>
          <RangeSlider
            min={0}
            max={1000}
            step={10}
            minValue={filters.minMcap}
            maxValue={filters.maxMcap}
            onChange={(min, max) => setFilters({ ...filters, minMcap: min, maxMcap: max })}
            unit="ASTER"
          />
        </div>

        {/* 24h Volume Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-4">
            24h Volume (ASTER)
          </label>
          <RangeSlider
            min={0}
            max={500}
            step={5}
            minValue={filters.minVolume}
            maxValue={filters.maxVolume}
            onChange={(min, max) => setFilters({ ...filters, minVolume: min, maxVolume: max })}
            unit="ASTER"
          />
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
    </div>
  );
}
