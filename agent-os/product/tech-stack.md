# Tech Stack

## Smart Contracts

### Core Development
- **Framework:** Hardhat with TypeScript configuration
- **Language:** Solidity ^0.8.19
- **Network:** BNB Smart Chain (BSC) - EVM Compatible
- **Gas Price:** ~5 Gwei average

### Libraries & Dependencies
- **OpenZeppelin Contracts:** v4.9+ for secure base implementations (ERC20, Ownable, ReentrancyGuard)
- **Chainlink Price Feeds:** For BNB/USD price oracles
- **PancakeSwap V2 SDK:** For DEX integration and liquidity migration
- **Solidity Fixed Point Math:** PRBMath for precise calculations

### Testing & Security
- **Test Framework:** Hardhat Test Suite with TypeScript
- **Coverage Tool:** Solidity Coverage (target: 95%+)
- **Fuzz Testing:** Foundry for mathematical function testing
- **Static Analysis:** Slither for vulnerability detection
- **Security Scanner:** Mythril for bytecode analysis
- **Audit Tools:** OpenZeppelin Defender for monitoring

### Development Tools
- **Local Blockchain:** Hardhat Network with forking capability
- **Gas Optimization:** Hardhat Gas Reporter
- **Contract Verification:** BSCScan Etherscan plugin
- **Deployment:** Hardhat Deploy with deterministic addresses

## Frontend

### Core Framework
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript 5.0+
- **Build Tool:** Turbopack (Next.js built-in)
- **Package Manager:** pnpm for efficiency

### Web3 Integration
- **Web3 Library:** Wagmi v2 for React hooks
- **Ethereum Library:** Viem for TypeScript-first interaction
- **Wallet Connectors:** RainbowKit for multi-wallet support
  - MetaMask
  - Trust Wallet
  - Binance Chain Wallet
  - WalletConnect v2

### UI & Styling
- **CSS Framework:** TailwindCSS v3 with JIT compilation
- **Component Library:** Headless UI for accessible components
- **Icons:** Heroicons + Lucide React
- **Charts:** TradingView Lightweight Charts for price data
- **Animations:** Framer Motion for smooth transitions

### State & Data Management
- **State Management:** Zustand for global state
- **Data Fetching:** TanStack Query (React Query) v5
- **Form Handling:** React Hook Form with Zod validation
- **Real-time Updates:** Socket.io client for WebSocket connections

### Development Tools
- **Linting:** ESLint with Next.js config
- **Formatting:** Prettier with consistent rules
- **Type Checking:** TypeScript strict mode
- **Git Hooks:** Husky + lint-staged

## Backend

### Core Infrastructure
- **Runtime:** Node.js v20 LTS
- **Language:** TypeScript 5.0+
- **Framework:** Express.js with TypeScript
- **Process Manager:** PM2 for production

### API & Services
- **API Style:** RESTful with OpenAPI documentation
- **WebSocket:** Socket.io for real-time price feeds
- **GraphQL:** Optional Apollo Server for complex queries
- **Rate Limiting:** express-rate-limit with Redis store
- **Authentication:** JWT with refresh tokens
- **API Documentation:** Swagger/OpenAPI Spec

### Databases
- **Primary Database:** PostgreSQL 15 for transactional data
  - Token metadata
  - Trading history
  - User portfolios
  - Platform analytics
- **Document Store:** MongoDB 7.0 for flexible data
  - Token descriptions
  - Social metadata
  - Cached market data
- **ORM/ODM:**
  - Prisma for PostgreSQL
  - Mongoose for MongoDB

### Caching & Queue
- **Cache Layer:** Redis 7.0 for:
  - Session storage
  - API response caching
  - Rate limiting
  - Real-time price data
- **Message Queue:** Bull Queue (Redis-based) for:
  - Transaction processing
  - Notification dispatch
  - Analytics aggregation

### External Services
- **IPFS Storage:** Pinata for decentralized metadata
- **Blockchain RPC:** QuickNode / Ankr for reliable BSC access
- **Price Feeds:** Chainlink + CoinGecko API
- **Analytics:** Mixpanel for user behavior tracking

## Mobile (Phase 3)

### Framework
- **Core:** React Native 0.72+ with TypeScript
- **Navigation:** React Navigation v6
- **State:** Redux Toolkit + RTK Query
- **UI Kit:** React Native Elements + custom components

### Platform Specific
- **iOS:** Xcode 15+, iOS 14+ minimum
- **Android:** Android Studio, SDK 24+ minimum
- **Web3:** WalletConnect + custom deep linking

## DevOps & Infrastructure

### Hosting & Deployment
- **Smart Contracts:** BSC Mainnet + Testnet
- **Frontend:** Vercel with Edge Functions
- **Backend:** AWS EC2 / Railway for Node.js services
- **Databases:** AWS RDS (PostgreSQL), MongoDB Atlas
- **Cache:** AWS ElastiCache (Redis)
- **CDN:** Cloudflare for global distribution

### CI/CD Pipeline
- **Version Control:** Git with GitHub
- **CI/CD:** GitHub Actions for:
  - Automated testing
  - Contract deployment
  - Frontend preview deployments
  - Backend staging/production
- **Container Registry:** GitHub Container Registry

### Monitoring & Observability
- **Error Tracking:** Sentry for frontend and backend
- **APM:** Datadog for performance monitoring
- **Logging:** Winston + Datadog Logs
- **Uptime:** Better Uptime for service monitoring
- **On-chain:** Tenderly for smart contract monitoring

### Security & Compliance
- **WAF:** Cloudflare WAF for DDoS protection
- **Secrets Management:** AWS Secrets Manager
- **SSL/TLS:** Let's Encrypt via Cloudflare
- **Security Scanning:** Snyk for dependency vulnerabilities
- **Audit Logging:** Custom implementation with PostgreSQL

## Development Environment

### Required Tools
- **Node.js:** v20 LTS
- **Package Manager:** pnpm 8+
- **Code Editor:** VS Code with Solidity + TypeScript extensions
- **Git:** v2.40+
- **Docker:** For local services (PostgreSQL, Redis, MongoDB)

### Environment Variables
- **Management:** dotenv for development, AWS Secrets for production
- **Validation:** Zod schemas for type-safe env vars
- **Structure:** Separate .env files for each service

## Third-Party Integrations

### Blockchain Protocols
- **PancakeSwap V2:** Router and Factory contracts for DEX operations
- **Aster Protocol:** REST API + WebSocket for 100x leverage (Phase 3)
- **Chainlink:** Price feed oracles for BNB/USD rates

### Payment & Subscriptions
- **Stripe:** For fiat premium subscription payments
- **Crypto Payments:** Direct smart contract for crypto subscriptions

### Analytics & Marketing
- **Google Analytics 4:** User behavior tracking
- **Mixpanel:** Product analytics and funnels
- **SendGrid:** Transactional email service
- **Discord/Telegram Bots:** Community notifications

## Quality Assurance

### Testing Strategy
- **Unit Tests:** 95%+ coverage for smart contracts, 80%+ for backend
- **Integration Tests:** API endpoints and contract interactions
- **E2E Tests:** Cypress for critical user flows
- **Load Testing:** K6 for performance benchmarking
- **Security Testing:** Regular penetration testing

### Code Quality
- **Code Reviews:** Required for all PRs
- **Static Analysis:** ESLint, Prettier, Slither
- **Type Safety:** TypeScript strict mode throughout
- **Documentation:** JSDoc + markdown documentation