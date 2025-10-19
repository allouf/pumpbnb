'use client';

import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';
import {
  GraduationStep,
  GraduationResult,
  simulateGraduation,
  PANCAKESWAP_URLS,
} from '@/lib/mock-data/mockGraduation';
import { Button } from '@/components/ui/Button';

interface GraduationAnimationProps {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  onComplete?: (result: GraduationResult) => void;
  onClose?: () => void;
}

export function GraduationAnimation({
  tokenAddress,
  tokenName,
  tokenSymbol,
  onComplete,
  onClose,
}: GraduationAnimationProps) {
  const [currentStep, setCurrentStep] = useState<GraduationStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<GraduationResult | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const startGraduation = async () => {
    setIsStarted(true);
    setCompletedSteps([]);
    setIsComplete(false);

    await simulateGraduation(
      tokenAddress,
      (step) => {
        setCurrentStep(step);
        if (step.status === 'completed') {
          setCompletedSteps((prev) => [...prev, step.id]);
        }
      },
      (gradResult) => {
        setResult(gradResult);
        setIsComplete(true);
        onComplete?.(gradResult);
      }
    );
  };

  const getStepIcon = (stepId: number) => {
    if (completedSteps.includes(stepId)) {
      return <CheckCircleIcon className="w-6 h-6 text-primary-green" />;
    }
    if (currentStep?.id === stepId && currentStep.status === 'in_progress') {
      return <ArrowPathIcon className="w-6 h-6 text-accent-yellow animate-spin" />;
    }
    return (
      <div className="w-6 h-6 rounded-full border-2 border-border bg-background-dark" />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-green to-accent-yellow flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                {isComplete ? 'Graduation Complete! 🎉' : 'Token Graduation'}
              </h2>
              <p className="text-sm text-text-secondary">
                {tokenName} ({tokenSymbol})
              </p>
            </div>
          </div>

          {!isStarted && (
            <div className="mt-4 p-4 bg-background-dark rounded-lg">
              <p className="text-text-secondary text-sm mb-2">
                Your token has reached 100 ASTER! Time to graduate to PancakeSwap.
              </p>
              <p className="text-text-muted text-xs">
                This process will convert your ASTER reserves to WBNB and create a
                Token/WBNB trading pair on PancakeSwap.
              </p>
            </div>
          )}
        </div>

        {/* Graduation Steps */}
        <div className="p-6">
          {!isStarted ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-text-primary mb-4">
                Graduation Process:
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-background-dark rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-green text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Extract 100 ASTER
                    </p>
                    <p className="text-xs text-text-muted">
                      Remove accumulated ASTER from bonding curve
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-background-dark rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-accent-yellow/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-accent-yellow text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Convert to WBNB
                    </p>
                    <p className="text-xs text-text-muted">
                      Swap ASTER → WBNB on PancakeSwap (~0.5 WBNB)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-background-dark rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-accent-blue text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Create DEX Pair
                    </p>
                    <p className="text-xs text-text-muted">
                      Deploy Token/WBNB pair on PancakeSwap V2
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-background-dark rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-accent-purple text-xs font-bold">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Add Liquidity & Lock
                    </p>
                    <p className="text-xs text-text-muted">
                      Add liquidity and burn LP tokens for permanent lock
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-accent-yellow/10 border border-accent-yellow/20 rounded-lg">
                <p className="text-sm text-text-primary">
                  ⚡ <span className="font-semibold">Gas fees covered by platform</span>
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Estimated cost: ~$0.04 (paid by AsterFun)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Live Progress Steps */}
              {[1, 2, 3, 4, 5, 6].map((stepId) => {
                const isActive = currentStep?.id === stepId;
                const isCompleted = completedSteps.includes(stepId);

                return (
                  <div
                    key={stepId}
                    className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-green/10 border border-primary-green/30'
                        : isCompleted
                        ? 'bg-background-dark border border-border'
                        : 'bg-background-dark/50 border border-border/50 opacity-50'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStepIcon(stepId)}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isActive || isCompleted
                            ? 'text-text-primary'
                            : 'text-text-muted'
                        }`}
                      >
                        {currentStep?.id === stepId
                          ? currentStep.message
                          : `Step ${stepId}`}
                      </p>
                      {isActive && currentStep?.description && (
                        <p className="text-xs text-text-secondary mt-1">
                          {currentStep.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completion Message */}
          {isComplete && result?.success && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-primary-green/10 border border-primary-green/30 rounded-lg">
                <p className="text-primary-green font-semibold mb-2">
                  ✅ Graduation Successful!
                </p>
                <div className="space-y-1 text-sm text-text-secondary">
                  <p>• ASTER Converted: {result.asterAmount} ASTER</p>
                  <p>• WBNB Received: {result.wbnbAmount?.toFixed(4)} WBNB</p>
                  <p className="text-xs text-text-muted break-all">
                    • PancakeSwap Pair: {result.pancakeswapPair}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-background-dark rounded-lg">
                <h4 className="font-semibold text-text-primary mb-3">
                  Trade on PancakeSwap
                </h4>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      window.open(PANCAKESWAP_URLS.SWAP(result.pancakeswapPair!), '_blank')
                    }
                    className="flex-1"
                  >
                    Swap Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(PANCAKESWAP_URLS.INFO(result.pancakeswapPair!), '_blank')
                    }
                    className="flex-1"
                  >
                    View Pool Info
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border flex gap-3">
          {!isStarted ? (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={startGraduation} className="flex-1">
                Start Graduation
              </Button>
            </>
          ) : isComplete ? (
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          ) : (
            <div className="flex-1 text-center text-sm text-text-muted">
              Please wait while graduation completes...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
