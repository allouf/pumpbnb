// Token Page Types

export interface Token {
  id: string;
  address: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  creator: string;
  totalSupply: string;
  bondingCurve: string;
  createdAt: Date;
  blockNumber: number;
  graduatedAt?: Date;
  isGraduated: boolean;
  ipfsHash?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
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
  price: string;
  marketCap?: string;
  asterAmount: string;
  tokenAmount: string;
}

export interface TokenHolder {
  id: string;
  tokenAddress: string;
  holderAddress: string;
  balance: string;
  percentage: number;
  isCreator: boolean;
  firstTxAt: Date;
  lastTxAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  tokenAddress: string;
  userAddress: string;
  content: string;
  replyTo?: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  isLiked?: boolean; // Client-side only
  replies?: Comment[]; // Client-side only
}

export interface CommentLike {
  id: string;
  commentId: string;
  userAddress: string;
  createdAt: Date;
}

export interface UserFavorite {
  id: string;
  userAddress: string;
  tokenAddress: string;
  timeframe: string;
  createdAt: Date;
}

export interface OHLCVData {
  id: string;
  tokenAddress: string;
  timeframe: string;
  timestamp: Date;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  trades: number;
}

export interface UserSession {
  id: string;
  userAddress: string;
  nonce: string;
  signature?: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
}

// API Response Types

export interface TokenPageData {
  token: Token;
  stats: TokenStats;
  recentTrades: Trade[];
  topHolders: TokenHolder[];
  recentComments: Comment[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface TradeFilter {
  type?: 'all' | 'my' | 'dev' | 'tracked';
  traderAddress?: string;
  minAmount?: string;
  maxAmount?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface HolderFilter {
  minBalance?: string;
  minPercentage?: number;
  includeCreator?: boolean;
}

export interface CommentFilter {
  userAddress?: string;
  sortBy?: 'newest' | 'oldest' | 'mostLiked';
  includeReplies?: boolean;
}

// WebSocket Event Types

export interface WSTradeEvent {
  type: 'trade';
  data: Trade;
}

export interface WSPriceUpdateEvent {
  type: 'price_update';
  data: {
    tokenAddress: string;
    price: string;
    marketCap: string;
    volume24h: string;
    priceChange24h: string;
  };
}

export interface WSCommentEvent {
  type: 'comment_added';
  data: Comment;
}

export interface WSHolderUpdateEvent {
  type: 'holder_update';
  data: TokenHolder;
}

export interface WSGraduationEvent {
  type: 'graduation';
  data: {
    tokenAddress: string;
    asterCollected: string;
    wbnbReceived: string;
    pancakeSwapPair: string;
    timestamp: Date;
  };
}

export interface WSChatMessageEvent {
  type: 'chat_message';
  data: ChatMessage;
}

export type WSEvent =
  | WSTradeEvent
  | WSPriceUpdateEvent
  | WSCommentEvent
  | WSHolderUpdateEvent
  | WSGraduationEvent
  | WSChatMessageEvent;

// Chat Types (MongoDB)

export interface ChatMessage {
  _id: string;
  tokenAddress: string;
  userAddress: string;
  username?: string;
  content: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
}

export interface ChatRoom {
  _id: string;
  tokenAddress: string;
  members: string[];
  createdAt: Date;
  messageCount: number;
  lastMessageAt?: Date;
}

// Chart Types

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface ChartData {
  timestamp: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeBubble {
  timestamp: number;
  price: number;
  volume: number;
  isBuy: boolean;
  trader: string;
  txHash: string;
}

export interface ChartConfig {
  timeframe: Timeframe;
  showVolume: boolean;
  showBubbles: boolean;
  bubbleFilter: 'all' | 'my' | 'dev' | 'tracked';
  priceScale: 'ASTER' | 'USD';
}

// Request/Response Types

export interface CreateCommentRequest {
  tokenAddress: string;
  content: string;
  replyTo?: string;
}

export interface LikeCommentRequest {
  commentId: string;
}

export interface AuthRequest {
  userAddress: string;
  signature: string;
  nonce: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: Date;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
