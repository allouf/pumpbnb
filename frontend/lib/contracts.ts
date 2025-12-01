// Centralized contract addresses (single source of truth)
export { CONTRACTS } from '@/lib/contracts/addresses'

// BSC Testnet configuration
export const BSC_TESTNET = {
  id: 97,
  name: "BSC Testnet",
  network: "bsc-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "tBNB",
    symbol: "tBNB",
  },
  rpcUrls: {
    default: { http: ["https://data-seed-prebsc-1-s1.binance.org:8545"] },
    public: { http: ["https://data-seed-prebsc-1-s1.binance.org:8545"] },
  },
  blockExplorers: {
    default: { name: "BscScan", url: "https://testnet.bscscan.com" },
  },
  testnet: true,
} as const;

// Token creation constants
export const TOKEN_CONSTANTS = {
  TOTAL_SUPPLY: BigInt("1000000000000000000000000000"), // 1 billion tokens
  BONDING_CURVE_SUPPLY: BigInt("800000000000000000000000000"), // 800M tokens
  CREATOR_SUPPLY: BigInt("200000000000000000000000000"), // 200M tokens
  GRADUATION_THRESHOLD: BigInt("100000000000000000000"), // 100 ASTER
  TRADING_FEE_BPS: 100, // 1% (100 basis points)
  POST_GRAD_FEE_BPS: 30, // 0.3% (30 basis points)
} as const;
