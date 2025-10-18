'use client';

import React, { useEffect, useState } from 'react';
import { useTokens } from '@/hooks/useTokens';
import { useAuth } from '@/hooks/useAuth';

export default function TestApiPage() {
  const { tokens, isLoading: tokensLoading, error: tokensError, fetchTokens } = useTokens();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Test API connectivity
    const testApi = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch (error) {
        setApiStatus('offline');
      }
    };

    testApi();
  }, []);

  useEffect(() => {
    // Fetch tokens when component mounts
    fetchTokens();
  }, []); // Empty dependency array to only run once

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">API Integration Test</h1>
      
      {/* API Status */}
      <div className="bg-background-card p-4 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-2">API Status</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            apiStatus === 'online' ? 'bg-green-500' : 
            apiStatus === 'offline' ? 'bg-red-500' : 
            'bg-yellow-500'
          }`}></div>
          <span className="capitalize">{apiStatus}</span>
        </div>
      </div>

      {/* Auth Status */}
      <div className="bg-background-card p-4 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
        {authLoading ? (
          <p>Loading auth state...</p>
        ) : (
          <div className="space-y-2">
            <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
            {user && (
              <div className="text-sm text-text-secondary">
                <p>User ID: {user.id}</p>
                <p>Username: {user.username}</p>
                <p>Wallet: {user.walletAddress}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tokens Data */}
      <div className="bg-background-card p-4 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-2">Tokens Data</h2>
        {tokensLoading ? (
          <p>Loading tokens...</p>
        ) : tokensError ? (
          <p className="text-red-500">Error: {tokensError}</p>
        ) : (
          <div className="space-y-2">
            <p>Total tokens: {tokens?.length || 0}</p>
            {tokens && tokens.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                <h3 className="font-medium mb-2">Sample tokens:</h3>
                {tokens.slice(0, 5).map((token) => (
                  <div key={token.address} className="text-sm bg-background-dark p-2 rounded mb-2">
                    <p><strong>Name:</strong> {token.name} ({token.symbol})</p>
                    <p><strong>Price:</strong> ${token.price}</p>
                    <p><strong>Market Cap:</strong> ${token.marketCap?.toLocaleString()}</p>
                    <p><strong>Address:</strong> {token.address}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">No tokens found</p>
            )}
          </div>
        )}
      </div>

      {/* Test Actions */}
      <div className="bg-background-card p-4 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
        <div className="space-y-2">
          <button
            onClick={() => fetchTokens()}
            className="px-4 py-2 bg-primary-green text-black rounded hover:bg-primary-green/90 transition-colors"
          >
            Refresh Tokens
          </button>
        </div>
      </div>
    </div>
  );
}