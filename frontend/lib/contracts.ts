// Contract addresses on BSC Testnet
export const CONTRACTS = {
  TokenFactory: "0x0d4D25e0239e689D7856c9760e74Ee12a2758866",
  PlatformConfig: "0x2FdB3697Bb6ef63F7c5dF5EAA9F78d4d2fa51479",
  GraduationManager: "0x459313EbBb829b0a39a71806C022F25891332E53",
  MockASTER: "0x311ECE533632bca662E100B8c4E0EB927EFE2588",
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
