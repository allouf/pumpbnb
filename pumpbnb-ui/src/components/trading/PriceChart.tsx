'use client';

import React, { useState } from 'react';
import { Token } from '@/lib/mock-data/tokens';

interface PriceChartProps {
  token: Token;
}

type TimeInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export function PriceChart({ token }: PriceChartProps) {
  const [activeInterval, setActiveInterval] = useState<TimeInterval>('5m');

  // Generate mock chart visualization
  const generateMockChartBars = () => {
    const bars = [];
    for (let i = 0; i < 50; i++) {
      const height = Math.random() * 200 + 20;
      const isGreen = Math.random() > 0.5;
      bars.push({
        height,
        color: isGreen ? '#00D4AA' : '#FF6B6B',
        id: i
      });
    }
    return bars;
  };

  const mockBars = generateMockChartBars();

  const intervals: { label: string; value: TimeInterval }[] = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' },
  ];

  return (
    <div className="bg-background-card border border-border rounded-lg p-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {token.symbol}/BNB
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-text-primary">
              ${token.price.toFixed(8)}
            </span>
            <span className={`text-sm font-medium ${
              token.priceChange24h >= 0 ? 'text-primary-green' : 'text-primary-red'
            }`}>
              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Time Interval Selector */}
        <div className="flex bg-background-dark rounded-lg p-1">
          {intervals.map((interval) => (
            <button
              key={interval.value}
              onClick={() => setActiveInterval(interval.value)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeInterval === interval.value
                  ? 'bg-primary-green text-black'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mock Chart Container */}
      <div className="w-full h-96 bg-background-dark rounded-lg p-4 flex items-end justify-center gap-1">
        {mockBars.map((bar) => (
          <div
            key={bar.id}
            className="w-2 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
            style={{
              height: `${bar.height}px`,
              backgroundColor: bar.color,
              minHeight: '20px'
            }}
          />
        ))}
      </div>

      {/* Chart Stats */}
      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
        <div>
          <div className="text-xs text-text-muted">24h Volume</div>
          <div className="text-sm font-semibold text-text-primary">
            ${(token.volume24h / 1000).toFixed(1)}K
          </div>
        </div>
        <div>
          <div className="text-xs text-text-muted">Market Cap</div>
          <div className="text-sm font-semibold text-text-primary">
            ${(token.marketCap / 1000).toFixed(1)}K
          </div>
        </div>
        <div>
          <div className="text-xs text-text-muted">Holders</div>
          <div className="text-sm font-semibold text-text-primary">
            {token.holders}
          </div>
        </div>
        <div>
          <div className="text-xs text-text-muted">Progress</div>
          <div className="text-sm font-semibold text-primary-green">
            {token.graduationProgress.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}