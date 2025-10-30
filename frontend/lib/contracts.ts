// Contract addresses on BSC Testnet
// UPDATED: October 30, 2025 - Fixed ASTER address configuration
export const CONTRACTS = {
  TokenFactory: "0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10",
  PlatformConfig: "0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5",
  GraduationManager: "0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5",
  MockASTER: "0xB1c4267412EAc792973261CC450ce7902b33a42D",
  SampleToken: "0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723",
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
