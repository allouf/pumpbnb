export interface Token {
  address: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  creator: string;
  createdAt: string;
  marketCap: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  holders: number;
  graduationProgress: number;
  isGraduated: boolean;
  socialLinks: {
    website?: string;
    twitter?: string;
    telegram?: string;
  };
  trades?: Trade[];
}

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  from: string;
  timestamp: string;
  txHash: string;
}

export interface User {
  address: string;
  avatar: string;
  username?: string;
}

export const mockTokens: Token[] = [
  // Newly Created Tokens
  {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'FlipDip',
    symbol: 'FLIPDIP',
    description: 'Flip The Dip - When the market dips, we flip!',
    image: '/api/placeholder/400/400',
    creator: '0xabcdef1234567890abcdef1234567890abcdef12',
    createdAt: '2024-10-15T14:30:00Z',
    marketCap: 5500,
    price: 0.000055,
    priceChange24h: 12.5,
    volume24h: 2300,
    holders: 45,
    graduationProgress: 5.5,
    isGraduated: false,
    socialLinks: {
      twitter: 'https://twitter.com/flipdip',
      telegram: 'https://t.me/flipdip'
    },
  },
  {
    address: '0x2345678901bcdef12345678901bcdef123456789',
    name: 'Real World Asset',
    symbol: 'RWA',
    description: 'Tokenizing real world assets on BNB Chain',
    image: '/api/placeholder/400/400',
    creator: '0xbcdef12345678901bcdef12345678901bcdef123',
    createdAt: '2024-10-15T13:45:00Z',
    marketCap: 10000,
    price: 0.0001,
    priceChange24h: -3.2,
    volume24h: 8700,
    holders: 87,
    graduationProgress: 10.0,
    isGraduated: false,
    socialLinks: {
      website: 'https://realworldasset.com',
      twitter: 'https://twitter.com/rwa_token'
    },
  },
  {
    address: '0x3456789012cdef123456789012cdef1234567890',
    name: 'GirlfwifStyle',
    symbol: '$GWIF',
    description: 'The girlfriend wife meme coin',
    image: '/api/placeholder/400/400',
    creator: '0xcdef123456789012cdef123456789012cdef1234',
    createdAt: '2024-10-15T12:20:00Z',
    marketCap: 3000,
    price: 0.00003,
    priceChange24h: 45.6,
    volume24h: 1250,
    holders: 23,
    graduationProgress: 3.0,
    isGraduated: false,
    socialLinks: {
      twitter: 'https://twitter.com/gwifstyle'
    },
  },

  // About to Graduate Tokens
  {
    address: '0x4567890123def1234567890123def12345678901',
    name: 'DogeVader',
    symbol: 'DOGEVADER',
    description: 'Doge Vader - The dark side of meme coins',
    image: '/api/placeholder/400/400',
    creator: '0xdef123456789012def123456789012def12345678',
    createdAt: '2024-10-15T10:00:00Z',
    marketCap: 64800,
    price: 0.000648,
    priceChange24h: 15.3,
    volume24h: 25400,
    holders: 233,
    graduationProgress: 64.8,
    isGraduated: false,
    socialLinks: {
      website: 'https://dogevader.com',
      twitter: 'https://twitter.com/dogevader'
    },
  },
  {
    address: '0x5678901234ef12345678901234ef123456789012',
    name: 'STAKE.US',
    symbol: 'STAKE',
    description: 'Staking rewards for everyone',
    image: '/api/placeholder/400/400',
    creator: '0xef123456789012ef123456789012ef123456789012',
    createdAt: '2024-10-15T09:30:00Z',
    marketCap: 57000,
    price: 0.00057,
    priceChange24h: 8.7,
    volume24h: 18900,
    holders: 335,
    graduationProgress: 57.0,
    isGraduated: false,
    socialLinks: {
      website: 'https://stake.us',
      telegram: 'https://t.me/stakeus'
    },
  },
  {
    address: '0x6789012345f123456789012345f1234567890123',
    name: 'NVIDIA MEME Token',
    symbol: 'NVIDIA',
    description: 'AI-powered meme coin',
    image: '/api/placeholder/400/400',
    creator: '0xf123456789012345f123456789012345f1234567',
    createdAt: '2024-10-15T08:15:00Z',
    marketCap: 52100,
    price: 0.000521,
    priceChange24h: -2.4,
    volume24h: 15600,
    holders: 223,
    graduationProgress: 52.1,
    isGraduated: false,
    socialLinks: {
      twitter: 'https://twitter.com/nvidiameme'
    },
  },

  // Graduated Tokens
  {
    address: '0x7890123456f1234567890123456f12345678901234',
    name: 'Depressol',
    symbol: 'DEPRESSOL',
    description: 'When you need something stronger than hopium',
    image: '/api/placeholder/400/400',
    creator: '0x123456789012345f123456789012345f123456789',
    createdAt: '2024-10-14T16:45:00Z',
    marketCap: 125000,
    price: 0.00125,
    priceChange24h: 25.8,
    volume24h: 45000,
    holders: 495,
    graduationProgress: 100,
    isGraduated: true,
    socialLinks: {
      website: 'https://depressol.meme',
      twitter: 'https://twitter.com/depressol',
      telegram: 'https://t.me/depressol'
    },
  },
  {
    address: '0x8901234567f12345678901234567f123456789012',
    name: 'JesusSSS',
    symbol: 'JESUSSS',
    description: 'Solana Savior - The holy meme coin',
    image: '/api/placeholder/400/400',
    creator: '0x234567890123456f234567890123456f234567890',
    createdAt: '2024-10-14T14:20:00Z',
    marketCap: 110000,
    price: 0.0011,
    priceChange24h: 18.9,
    volume24h: 38500,
    holders: 367,
    graduationProgress: 100,
    isGraduated: true,
    socialLinks: {
      website: 'https://jesusss.faith',
      twitter: 'https://twitter.com/jesusss_coin'
    },
  },
  {
    address: '0x9012345678f123456789012345678f1234567890',
    name: 'UmayRobots',
    symbol: 'UMAYBOTS',
    description: 'Umay Robots - AI-powered trading bots',
    image: '/api/placeholder/400/400',
    creator: '0x345678901234567f345678901234567f345678901',
    createdAt: '2024-10-14T12:00:00Z',
    marketCap: 162700,
    price: 0.001627,
    priceChange24h: -5.2,
    volume24h: 52000,
    holders: 655,
    graduationProgress: 100,
    isGraduated: true,
    socialLinks: {
      website: 'https://umaybots.ai',
      twitter: 'https://twitter.com/umaybots',
      telegram: 'https://t.me/umaybots'
    },
  }
];

export const mockTrades: Trade[] = [
  {
    id: '1',
    type: 'buy',
    amount: 1000000,
    price: 0.000055,
    from: '0xabcd1234',
    timestamp: '2024-10-15T14:25:00Z',
    txHash: '0x1234567890abcdef'
  },
  {
    id: '2',
    type: 'sell',
    amount: 500000,
    price: 0.000053,
    from: '0xefgh5678',
    timestamp: '2024-10-15T14:20:00Z',
    txHash: '0xabcdef1234567890'
  },
];

// Utility functions
export function getTokensByCategory() {
  return {
    newlyCreated: mockTokens.filter(token => !token.isGraduated && token.graduationProgress < 30),
    aboutToGraduate: mockTokens.filter(token => !token.isGraduated && token.graduationProgress >= 30),
    graduated: mockTokens.filter(token => token.isGraduated)
  };
}

export function formatPrice(price: number): string {
  return price.toFixed(8).replace(/\.?0+$/, '');
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1000000) {
    return `$${(marketCap / 1000000).toFixed(1)}M`;
  } else if (marketCap >= 1000) {
    return `$${(marketCap / 1000).toFixed(1)}K`;
  }
  return `$${marketCap}`;
}

export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
}