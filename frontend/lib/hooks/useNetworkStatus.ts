import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isAPIAvailable: boolean;
  lastChecked: Date | null;
  retryCount: number;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isAPIAvailable: true,
    lastChecked: null,
    retryCount: 0,
  });

  // Check API availability
  const checkAPIAvailability = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      console.warn('[NetworkStatus] API check failed:', error);
      return false;
    }
  };

  // Update network status
  const updateStatus = async () => {
    const isOnline = navigator.onLine;
    let isAPIAvailable = false;
    
    if (isOnline) {
      isAPIAvailable = await checkAPIAvailability();
    }
    
    setStatus(prev => ({
      ...prev,
      isOnline,
      isAPIAvailable,
      lastChecked: new Date(),
      retryCount: isAPIAvailable ? 0 : prev.retryCount + 1,
    }));
  };

  // Manual retry function
  const retry = () => {
    updateStatus();
  };

  useEffect(() => {
    // Initial check
    updateStatus();

    // Set up online/offline listeners
    const handleOnline = () => {
      console.log('[NetworkStatus] Network connection restored');
      updateStatus();
    };

    const handleOffline = () => {
      console.log('[NetworkStatus] Network connection lost');
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isAPIAvailable: false,
        lastChecked: new Date(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic API health check (every 30 seconds if API was unavailable)
    const healthCheckInterval = setInterval(() => {
      if (!status.isAPIAvailable && navigator.onLine) {
        console.log('[NetworkStatus] Periodic API health check...');
        updateStatus();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(healthCheckInterval);
    };
  }, [status.isAPIAvailable]);

  return {
    ...status,
    retry,
  };
}