'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  SparklesIcon,
  FireIcon,
  ChartBarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import {
  getGraduationStatusMessage,
  isReadyToGraduate,
} from '@/lib/mock-data/mockGraduation';

interface GraduationProgressProps {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  graduationProgress: number; // 0-100 (represents ASTER accumulated)
  isGraduated: boolean;
  onGraduate?: () => void;
  className?: string;
}

export function GraduationProgress({
  graduationProgress,
  isGraduated,
  onGraduate,
  className = '',
  tokenSymbol,
}: GraduationProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If already graduated, don&apos;t show progress
  if (isGraduated) {
    return null;
  }

  const status = getGraduationStatusMessage(graduationProgress);
  const ready = isReadyToGraduate(graduationProgress);
  const remaining = Math.max(0, 100 - graduationProgress);

  // Determine color scheme based on progress
  const getProgressColor = () => {
    if (ready) return 'from-primary-green to-accent-yellow';
    if (graduationProgress >= 75) return 'from-accent-yellow to-accent-orange';
    if (graduationProgress >= 50) return 'from-accent-blue to-accent-purple';
    return 'from-accent-purple to-accent-blue';
  };

  // Determine urgency icon
  const getIcon = () => {
    if (ready) return <SparklesIcon className="w-6 h-6 text-primary-green animate-pulse" />;
    if (status.urgency === 'high') return <FireIcon className="w-6 h-6 text-accent-yellow" />;
    return <ChartBarIcon className="w-6 h-6 text-accent-blue" />;
  };

  return (
    <div className={`bg-background-card border border-border rounded-lg ${className}`}>
      {/* Compact Progress Bar (Always Visible) */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getIcon()}
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Graduation Progress
              </h3>
              <p className="text-xs text-text-muted">
                {ready ? 'Ready to Graduate!' : `${remaining.toFixed(1)} ASTER needed`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary-green">
              {graduationProgress.toFixed(1)}%
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-text-muted hover:text-text-primary text-xs"
            >
              {isExpanded ? 'Hide' : 'Details'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-background-dark rounded-full h-3 relative overflow-hidden">
          <div
            className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 relative`}
            style={{ width: `${Math.min(graduationProgress, 100)}%` }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>

          {/* Milestone markers */}
          <div className="absolute inset-0 flex items-center justify-between px-1">
            <div
              className={`w-1 h-3 ${
                graduationProgress >= 25 ? 'bg-white/50' : 'bg-border'
              }`}
              style={{ marginLeft: '25%' }}
            />
            <div
              className={`w-1 h-3 ${
                graduationProgress >= 50 ? 'bg-white/50' : 'bg-border'
              }`}
              style={{ marginLeft: '50%' }}
            />
            <div
              className={`w-1 h-3 ${
                graduationProgress >= 75 ? 'bg-white/50' : 'bg-border'
              }`}
              style={{ marginLeft: '75%' }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs text-text-muted mt-2">
          <span>{graduationProgress.toFixed(1)} ASTER</span>
          <span>100 ASTER Goal</span>
        </div>

        {/* Ready to Graduate CTA */}
        {ready && onGraduate && (
          <Button
            onClick={onGraduate}
            className="w-full mt-3 bg-gradient-to-r from-primary-green to-accent-yellow hover:opacity-90"
          >
            <SparklesIcon className="w-4 h-4 mr-2" />
            Graduate to PancakeSwap Now
          </Button>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* What is Graduation? */}
          <div className="bg-background-dark/50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-primary-green" />
              What is Graduation?
            </h4>
            <p className="text-xs text-text-secondary">
              When a token reaches 100 ASTER, it automatically graduates from the bonding
              curve to PancakeSwap DEX. This enables trading with WBNB and access to deeper
              liquidity.
            </p>
          </div>

          {/* Graduation Process Steps */}
          <div>
            <h4 className="text-xs font-semibold text-text-primary mb-2">
              Graduation Process:
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary-green text-[10px] font-bold">1</span>
                </div>
                <div>
                  <p className="text-text-primary font-medium">Extract 100 ASTER</p>
                  <p className="text-text-muted">Remove ASTER reserves from bonding curve</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-accent-yellow/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent-yellow text-[10px] font-bold">2</span>
                </div>
                <div>
                  <p className="text-text-primary font-medium">Convert to WBNB</p>
                  <p className="text-text-muted">Swap ASTER → WBNB on PancakeSwap</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent-blue text-[10px] font-bold">3</span>
                </div>
                <div>
                  <p className="text-text-primary font-medium">Create DEX Pair</p>
                  <p className="text-text-muted">Deploy {tokenSymbol}/WBNB pair on PancakeSwap</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent-purple text-[10px] font-bold">4</span>
                </div>
                <div>
                  <p className="text-text-primary font-medium">Lock Liquidity</p>
                  <p className="text-text-muted">Burn LP tokens for permanent liquidity</p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-primary-green/10 border border-primary-green/20 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-text-primary mb-2">Benefits:</h4>
            <ul className="space-y-1 text-xs text-text-secondary">
              <li>• Trade with WBNB (more liquid than ASTER)</li>
              <li>• Access to full PancakeSwap ecosystem</li>
              <li>• Creator&apos;s 20% allocation unlocks</li>
              <li>• Permanent liquidity (LP tokens burned)</li>
              <li>• Eligible for 1001x leverage trading (Phase 3)</li>
            </ul>
          </div>

          {/* Gas Fee Info */}
          <div className="flex items-start gap-2 text-xs p-2 bg-background-dark/30 rounded">
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-text-muted">
              <span className="font-semibold text-text-primary">Gas fees covered:</span>{' '}
              AsterFun pays all graduation gas costs (~$0.04). The process is completely
              free for token creators and holders.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Add shimmer animation to global CSS or Tailwind config
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
