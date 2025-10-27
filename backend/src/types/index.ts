import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    address: string;
    nonce?: number;
  };
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export interface Token {
  address: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  creator: string;
  totalSupply: string;
  bondingCurve: string;
  createdAt: Date;
  graduatedAt?: Date;
  isGraduated: boolean;
  metadata: TokenMetadata;
}

export interface Trade {
  id: string;
  tokenAddress: string;
  trader: string;
  isBuy: boolean;
  amountIn: string;
  amountOut: string;
  fee: string;
  timestamp: Date;
  txHash: string;
  blockNumber: number;
}

export interface TokenStats {
  tokenAddress: string;
  price: string;
  marketCap: string;
  volume24h: string;
  trades24h: number;
  holders: number;
  liquidity: string;
  priceChange24h: string;
  updatedAt: Date;
}

export interface UserPortfolio {
  address: string;
  tokens: Array<{
    tokenAddress: string;
    balance: string;
    value: string;
    profitLoss: string;
    profitLossPercent: string;
  }>;
  totalValue: string;
  totalProfitLoss: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
