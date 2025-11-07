'use client';

import React from 'react';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';

export function OfflineIndicator() {
  const { isOnline, isAPIAvailable, retry, retryCount } = useNetworkStatus();

  // Only show if there are connectivity issues
  if (isOnline && isAPIAvailable) {
    return null;
  }

  const getStatusMessage = () => {
    if (!isOnline) {
      return {
        title: 'No Internet Connection',
        message: 'Please check your internet connection and try again.',
        icon: '🌐',
        color: 'bg-red-500',
      };
    }
    
    if (!isAPIAvailable) {
      return {
        title: 'Service Temporarily Unavailable',
        message: 'Using offline data. Some features may be limited.',
        icon: '🔌',
        color: 'bg-orange-500',
      };
    }

    return {
      title: 'Connection Issues',
      message: 'Experiencing connectivity problems.',
      icon: '⚠️',
      color: 'bg-yellow-500',
    };
  };

  const status = getStatusMessage();

  return (
    <div className={`${status.color} text-white px-4 py-2 text-sm relative`}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{status.icon}</span>
          <div>
            <span className="font-medium">{status.title}</span>
            <span className="ml-2 opacity-90">{status.message}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {retryCount > 0 && (
            <span className="text-xs opacity-75">
              Attempt {retryCount}
            </span>
          )}
          
          <button
            onClick={retry}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}