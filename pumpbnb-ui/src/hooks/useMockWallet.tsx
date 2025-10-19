'use client';

import { useState, useEffect, useCallback } from 'react';
import { addAsterToToken, removeAsterFromToken } from '@/lib/mock-data/tokenGraduationTracker';

export interface WalletBalance {
  asterBalance: number;
  bnbBalance: number;
  tokenBalances: Record<string, number>;
}

export interface Transaction {
  hash: string;
  type: 'buy' | 'sell';
  tokenAddress: string;
  tokenSymbol: string;
  tokenAmount: number;
  asterAmount: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
}

const MOCK_WALLET_STORAGE_KEY = 'asterfun_mock_wallet';
const MOCK_TX_STORAGE_KEY = 'asterfun_mock_transactions';

const DEFAULT_WALLET: WalletBalance = {
  asterBalance: 1000, // Start with 1000 ASTER
  bnbBalance: 0.5, // 0.5 BNB for gas
  tokenBalances: {},
};

const MOCK_ADDRESSES = [
  '0xABCD1234567890ABCD1234567890ABCD12345678',
  '0xDEF9876543210DEF9876543210DEF987654321',
  '0x1111222233334444555566667777888899990000',
];

export function useMockWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<WalletBalance>(DEFAULT_WALLET);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load wallet state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MOCK_WALLET_STORAGE_KEY);
      const savedTxs = localStorage.getItem(MOCK_TX_STORAGE_KEY);

      if (saved) {
        const data = JSON.parse(saved);
        setIsConnected(data.isConnected);
        setAddress(data.address);
        setBalance(data.balance);
      }

      if (savedTxs) {
        setTransactions(JSON.parse(savedTxs));
      }
    }
  }, []);

  // Save wallet state to localStorage
  const saveWalletState = useCallback((state: {
    isConnected: boolean;
    address: string | null;
    balance: WalletBalance;
  }) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(MOCK_WALLET_STORAGE_KEY, JSON.stringify(state));
    }
  }, []);

  // Save transactions to localStorage
  const saveTransactions = useCallback((txs: Transaction[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(MOCK_TX_STORAGE_KEY, JSON.stringify(txs));
    }
  }, []);

  // Connect wallet (simulated)
  const connect = useCallback(async (walletType: 'metamask' | 'trustwallet' | 'walletconnect' = 'metamask') => {
    setIsLoading(true);

    // Simulate connection delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Select random mock address
    const mockAddress = MOCK_ADDRESSES[Math.floor(Math.random() * MOCK_ADDRESSES.length)];

    setIsConnected(true);
    setAddress(mockAddress);

    const newState = {
      isConnected: true,
      address: mockAddress,
      balance: balance,
    };

    saveWalletState(newState);
    setIsLoading(false);

    return mockAddress;
  }, [balance, saveWalletState]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);

    saveWalletState({
      isConnected: false,
      address: null,
      balance: balance,
    });
  }, [balance, saveWalletState]);

  // Buy tokens with ASTER
  const buyToken = useCallback(async (
    tokenAddress: string,
    tokenSymbol: string,
    asterAmount: number,
    mockPrice: number = 0.5 // Default: 0.5 ASTER per token
  ): Promise<Transaction> => {
    if (!isConnected) throw new Error('Wallet not connected');
    if (asterAmount > balance.asterBalance) throw new Error('Insufficient ASTER balance');

    setIsLoading(true);

    // Calculate tokens received
    const platformFee = asterAmount * 0.015; // 1.5% platform fee
    const asterAfterFee = asterAmount - platformFee;
    const tokensReceived = asterAfterFee / mockPrice;

    // Generate transaction
    const tx: Transaction = {
      hash: '0x' + Math.random().toString(16).substring(2, 66),
      type: 'buy',
      tokenAddress,
      tokenSymbol,
      tokenAmount: tokensReceived,
      asterAmount,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    // Add pending transaction
    const newTransactions = [tx, ...transactions];
    setTransactions(newTransactions);
    saveTransactions(newTransactions);

    // Simulate blockchain confirmation (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    // Update balances
    const newBalance = {
      ...balance,
      asterBalance: balance.asterBalance - asterAmount,
      tokenBalances: {
        ...balance.tokenBalances,
        [tokenAddress]: (balance.tokenBalances[tokenAddress] || 0) + tokensReceived,
      },
    };

    setBalance(newBalance);

    // Update token graduation progress (add ASTER to bonding curve)
    const newProgress = addAsterToToken(tokenAddress, asterAmount);
    console.log(`Token ${tokenSymbol}: Added ${asterAmount} ASTER, new progress: ${newProgress.toFixed(2)} ASTER`);

    // Mark transaction as confirmed
    tx.status = 'confirmed';
    const updatedTxs = newTransactions.map(t => t.hash === tx.hash ? tx : t);
    setTransactions(updatedTxs);
    saveTransactions(updatedTxs);

    saveWalletState({
      isConnected,
      address,
      balance: newBalance,
    });

    setIsLoading(false);
    return tx;
  }, [isConnected, balance, transactions, address, saveWalletState, saveTransactions]);

  // Sell tokens for ASTER
  const sellToken = useCallback(async (
    tokenAddress: string,
    tokenSymbol: string,
    tokenAmount: number,
    mockPrice: number = 0.5 // Default: 0.5 ASTER per token
  ): Promise<Transaction> => {
    if (!isConnected) throw new Error('Wallet not connected');

    const currentTokenBalance = balance.tokenBalances[tokenAddress] || 0;
    if (tokenAmount > currentTokenBalance) throw new Error('Insufficient token balance');

    setIsLoading(true);

    // Calculate ASTER received
    const asterBeforeFee = tokenAmount * mockPrice;
    const platformFee = asterBeforeFee * 0.015; // 1.5% platform fee
    const asterReceived = asterBeforeFee - platformFee;

    // Generate transaction
    const tx: Transaction = {
      hash: '0x' + Math.random().toString(16).substring(2, 66),
      type: 'sell',
      tokenAddress,
      tokenSymbol,
      tokenAmount,
      asterAmount: asterReceived,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    // Add pending transaction
    const newTransactions = [tx, ...transactions];
    setTransactions(newTransactions);
    saveTransactions(newTransactions);

    // Simulate blockchain confirmation (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    // Update balances
    const newBalance = {
      ...balance,
      asterBalance: balance.asterBalance + asterReceived,
      tokenBalances: {
        ...balance.tokenBalances,
        [tokenAddress]: currentTokenBalance - tokenAmount,
      },
    };

    setBalance(newBalance);

    // Update token graduation progress (remove ASTER from bonding curve)
    const newProgress = removeAsterFromToken(tokenAddress, asterBeforeFee);
    console.log(`Token ${tokenSymbol}: Removed ${asterBeforeFee} ASTER, new progress: ${newProgress.toFixed(2)} ASTER`);

    // Mark transaction as confirmed
    tx.status = 'confirmed';
    const updatedTxs = newTransactions.map(t => t.hash === tx.hash ? tx : t);
    setTransactions(updatedTxs);
    saveTransactions(updatedTxs);

    saveWalletState({
      isConnected,
      address,
      balance: newBalance,
    });

    setIsLoading(false);
    return tx;
  }, [isConnected, balance, transactions, address, saveWalletState, saveTransactions]);

  // Reset wallet (for testing)
  const reset = useCallback(() => {
    setBalance(DEFAULT_WALLET);
    setTransactions([]);
    saveWalletState({
      isConnected,
      address,
      balance: DEFAULT_WALLET,
    });
    saveTransactions([]);
  }, [isConnected, address, saveWalletState, saveTransactions]);

  // Get token balance
  const getTokenBalance = useCallback((tokenAddress: string): number => {
    return balance.tokenBalances[tokenAddress] || 0;
  }, [balance.tokenBalances]);

  // Get recent transactions
  const getRecentTransactions = useCallback((limit: number = 10): Transaction[] => {
    return transactions.slice(0, limit);
  }, [transactions]);

  return {
    // State
    isConnected,
    address,
    asterBalance: balance.asterBalance,
    bnbBalance: balance.bnbBalance,
    tokenBalances: balance.tokenBalances,
    transactions,
    isLoading,

    // Actions
    connect,
    disconnect,
    buyToken,
    sellToken,
    reset,

    // Helpers
    getTokenBalance,
    getRecentTransactions,
  };
}

// Helper function to format ASTER amount
export function formatAster(amount: number, decimals: number = 2): string {
  return amount.toFixed(decimals);
}

// Helper function to shorten address
export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}
