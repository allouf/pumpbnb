'use client';

import { useRef, useState, useEffect } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
  label?: string;
  unit?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  minValue,
  maxValue,
  onChange,
  label,
  unit = ''
}: RangeSliderProps) {
  const [localMinValue, setLocalMinValue] = useState(minValue);
  const [localMaxValue, setLocalMaxValue] = useState(maxValue);
  const [isDraggingMin, setIsDraggingMin] = useState(false);
  const [isDraggingMax, setIsDraggingMax] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Sync with external changes
  useEffect(() => {
    setLocalMinValue(minValue);
    setLocalMaxValue(maxValue);
  }, [minValue, maxValue]);

  const getPercentage = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const getValueFromPosition = (clientX: number) => {
    if (!trackRef.current) return min;

    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const rawValue = min + (percentage / 100) * (max - min);

    // Round to step
    return Math.round(rawValue / step) * step;
  };

  const handleMinThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingMin(true);
  };

  const handleMaxThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingMax(true);
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (isDraggingMin || isDraggingMax) return;

    const value = getValueFromPosition(e.clientX);
    const midPoint = (localMinValue + localMaxValue) / 2;

    if (value < midPoint) {
      // Clicked on left side - adjust min
      const newMin = Math.min(value, localMaxValue - step);
      setLocalMinValue(newMin);
      onChange(newMin, localMaxValue);
    } else {
      // Clicked on right side - adjust max
      const newMax = Math.max(value, localMinValue + step);
      setLocalMaxValue(newMax);
      onChange(localMinValue, newMax);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingMin) {
        const value = getValueFromPosition(e.clientX);
        const newMin = Math.max(min, Math.min(value, localMaxValue - step));
        setLocalMinValue(newMin);
        onChange(newMin, localMaxValue);
      } else if (isDraggingMax) {
        const value = getValueFromPosition(e.clientX);
        const newMax = Math.min(max, Math.max(value, localMinValue + step));
        setLocalMaxValue(newMax);
        onChange(localMinValue, newMax);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingMin(false);
      setIsDraggingMax(false);
    };

    if (isDraggingMin || isDraggingMax) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingMin, isDraggingMax, localMinValue, localMaxValue, min, max, step, onChange]);

  const minPercentage = getPercentage(localMinValue);
  const maxPercentage = getPercentage(localMaxValue);

  return (
    <div className="w-full">
      {/* Range Display */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">
          {localMinValue} {unit}
        </span>
        <span className="text-xs text-gray-400">
          {localMaxValue} {unit}
        </span>
      </div>

      {/* Slider Track */}
      <div
        ref={trackRef}
        className="relative h-2 bg-gray-700 rounded-full cursor-pointer"
        onClick={handleTrackClick}
      >
        {/* Active Range */}
        <div
          className="absolute h-full bg-primary rounded-full"
          style={{
            left: `${minPercentage}%`,
            right: `${100 - maxPercentage}%`
          }}
        />

        {/* Min Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-primary rounded-full border-2 border-black cursor-grab active:cursor-grabbing shadow-lg transition-transform ${
            isDraggingMin ? 'scale-110' : 'hover:scale-110'
          }`}
          style={{ left: `${minPercentage}%`, transform: 'translate(-50%, -50%)' }}
          onMouseDown={handleMinThumbMouseDown}
        />

        {/* Max Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-primary rounded-full border-2 border-black cursor-grab active:cursor-grabbing shadow-lg transition-transform ${
            isDraggingMax ? 'scale-110' : 'hover:scale-110'
          }`}
          style={{ left: `${maxPercentage}%`, transform: 'translate(-50%, -50%)' }}
          onMouseDown={handleMaxThumbMouseDown}
        />
      </div>

      {/* Range Labels */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-500">{min} {unit}</span>
        <span className="text-xs text-gray-500">{max} {unit}</span>
      </div>
    </div>
  );
}
