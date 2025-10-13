# Tech Stack

## Smart Contracts
- **Framework:** Hardhat
- **Language:** Solidity ^0.8.19
- **Libraries:** OpenZeppelin, Chainlink Price Feeds, PancakeSwap V2 SDK
- **Testing:** Hardhat, Foundry
- **Security:** Slither, Mythril for static analysis

## Frontend
- **Framework:** Next.js 14 with TypeScript
- **Styling:** TailwindCSS + Headless UI
- **Web3:** Wagmi + Viem
- **Wallet Support:** MetaMask, Trust Wallet, Binance Chain Wallet
- **State:** Zustand
- **Charts:** TradingView Lightweight Charts
- **Real-time:** Socket.io client for WebSocket connections

## Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (transactions), MongoDB (metadata)
- **Cache:** Redis
- **Queue:** Bull Queue (Redis-based)
- **Storage:** IPFS (via Pinata)
- **API Documentation:** Swagger/OpenAPI Spec

## Mobile (Phase 3)
- **Framework:** React Native with TypeScript
- **Navigation:** React Navigation v6
- **State:** Redux Toolkit + RTK Query
- **Platforms:** iOS 14+, Android SDK 24+

## Infrastructure
- **Blockchain:** BNB Smart Chain (BSC)
- **RPC Provider:** QuickNode / Ankr
- **Frontend Hosting:** Vercel with Edge Functions
- **Backend Hosting:** AWS EC2 / Railway
- **Database Hosting:** AWS RDS (PostgreSQL), MongoDB Atlas
- **CDN:** Cloudflare
- **CI/CD:** GitHub Actions

## External Integrations
- **DEX:** PancakeSwap V2 for liquidity migration
- **Leverage:** Aster Protocol API for 100x trading (Phase 3)
- **Oracles:** Chainlink for BNB/USD price feeds
- **Analytics:** Mixpanel for user behavior tracking
- **Error Tracking:** Sentry for frontend and backend
- **Monitoring:** Datadog for performance monitoring

## Development Tools
- **Version Control:** Git with GitHub
- **Package Manager:** pnpm
- **Linting:** ESLint with TypeScript rules
- **Formatting:** Prettier
- **Git Hooks:** Husky + lint-staged
- **Environment Variables:** dotenv for development, AWS Secrets for production

## Security & Testing
- **Smart Contract Audits:** Minimum 2 independent audits
- **Test Coverage:** 95%+ for contracts, 80%+ for backend
- **E2E Testing:** Cypress for critical user flows
- **Load Testing:** K6 for performance benchmarking
- **Security Scanning:** Snyk for dependency vulnerabilities
- **WAF:** Cloudflare WAF for DDoS protection