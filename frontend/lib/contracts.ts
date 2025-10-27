// Contract addresses on BSC Testnet
// UPDATED: October 27, 2025 - Redeployed due to bug fixes
export const CONTRACTS = {
  TokenFactory: "0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2",
  PlatformConfig: "0x0e4ED6983Bc8100936C42e5D98F9f1fEbF76b58E",
  GraduationManager: "0xeE147bc2307b645c59033B7A0b16EC5E68b2A5d3",
  MockASTER: "0x2e5bEffE46eAADAb062ED2b520a0d95654CEdF5A",
  SampleToken: "0xcFE6968c3427EcA3641d7132E03F53E7096d370e",
  // External contracts (unchanged)
  WBNB: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
  PancakeFactory: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
  PancakeRouter: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
} as const;

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
