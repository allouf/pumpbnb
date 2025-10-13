# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PumpBNB** - A BNB Chain-based meme coin launchpad inspired by Pump.fun on Solana. The platform enables instant token creation and trading through automated bonding curves, with automatic graduation to PancakeSwap at $50K market cap.

**Key Value Proposition**: Cost-effective alternative to Solana-based platforms while maintaining comparable functionality.

## Project Status

Currently in **Specification & Research Phase**. The codebase contains:
- Comprehensive product requirements document (`project.md`)
- Technical feasibility research (`research/*.md`)
- Project planning documentation

**Development has not yet started** - no smart contracts, frontend, or backend code exists yet.

## Core Technical Architecture

### Smart Contract Design (Planned)

**TokenFactory.sol**
- Deploys new BEP-20 tokens using factory pattern
- Target gas cost: ~3,200,000 gas (cost-effective)
- Features: Anti-bot protection, standardized metadata

**BondingCurve.sol**
- Automated market maker for price discovery
- Constant product bonding curve formula (Uniswap V2 style): `x * y = k` where x=BNB reserves, y=token reserves
- Uses virtual reserves (0.3 BNB + 200M tokens) for instant liquidity
- Trading gas cost: ~180,000 gas per trade (low cost)
- 1.5% platform fee on all trades

**GraduationManager.sol**
- Automatic migration to PancakeSwap at $50K market cap
- Handles liquidity extraction and DEX pair creation
- Target gas cost: ~2,811,000 gas (affordable)

**AsterIntegration.sol** (Phase 3)
- Integration with Aster Protocol for 100x leverage trading
- API-based integration (REST/WebSocket)

### Technology Stack (Planned)

**Smart Contracts**
- Framework: Hardhat
- Language: Solidity ^0.8.19
- Libraries: OpenZeppelin, Chainlink Price Feeds, PancakeSwap V2 SDK
- Testing: Hardhat, Foundry
- Security: Slither, Mythril for static analysis

**Frontend**
- Framework: Next.js 14 with TypeScript
- Styling: TailwindCSS + Headless UI
- Web3: Wagmi + Viem
- State: Zustand
- Charts: TradingView Lightweight Charts

**Backend**
- Runtime: Node.js + TypeScript
- Framework: Express.js
- Database: PostgreSQL (transactions), MongoDB (metadata)
- Cache: Redis
- Storage: IPFS (via Pinata)

## Development Phases

### Phase 1: Core Platform (Months 1-3)
1. Smart contract development (TokenFactory, BondingCurve)
2. Frontend token creation and trading interface
3. PancakeSwap graduation mechanism
4. Security audits and testnet deployment

### Phase 2: Advanced Features (Months 4-6)
1. Analytics dashboard
2. Premium features and subscriptions
3. Mobile-responsive enhancements
4. Portfolio management

### Phase 3: Aster Integration (Months 7-9)
1. 100x leverage trading via Aster Protocol
2. Advanced order types (limit, stop-loss, take-profit)
3. Mobile application (React Native)

## Key Technical Constraints

### Cost Requirements
- Token creation: Cost-effective compared to Solana platforms
- Trading fees: Low per transaction
- Graduation to PancakeSwap: Affordable migration cost
- Platform fee: 1.5% of transaction value

### Bonding Curve Parameters
- Formula: Constant product (x*y=k) - Uniswap V2 style
- Virtual Reserves: 0.3 BNB + 200,000,000 tokens for initial liquidity depth
- Maximum Supply: 1,000,000,000 tokens
- Graduation Threshold: $50,000 market cap (≈40 BNB)
- Creator Allocation: 20% of tokens (locked during bonding curve phase)
- Trading Fee: 1.5% on all buy/sell transactions

### Security Requirements
- Minimum 2 independent smart contract audits before mainnet
- Bug bounty program with $100K fund
- Reentrancy protection on all state-changing functions
- Emergency pause functionality
- Multi-signature controls for admin functions

## Economic Model

### Revenue Streams
- Trading fees: 1.5% per bonding curve transaction (80% of revenue)
- Token creation: Small fee per deployment (5% of revenue)
- Graduation fees: Small fee per DEX migration (3% of revenue)
- Premium subscriptions: $10-100/month (7% of revenue)
- API access: Usage-based tiers (3% of revenue)
- Aster revenue share: 20% of generated fees (2% of revenue)

### Break-Even Requirements
- Monthly operating costs: $50,000
- Required monthly volume: Target volume based on 1.5% fee
- Target timeline: Month 3-4

## Development Standards

### Smart Contract Development
- Use OpenZeppelin contracts as base implementations
- All external functions must have proper access controls
- Include natspec documentation for all public/external functions
- Gas optimization is critical - aim for minimal gas consumption
- Follow checks-effects-interactions pattern to prevent reentrancy
- Use fixed-point arithmetic (avoid floating point in Solidity)

### Testing Requirements
- Minimum 95% code coverage for smart contracts
- Include edge case and failure scenario tests
- Test gas consumption for all operations
- Integration tests with PancakeSwap contracts
- Fuzz testing for mathematical functions (bonding curve)

### Frontend Development
- Mobile-first responsive design
- Support MetaMask, Trust Wallet, Binance Chain Wallet
- Real-time price updates via WebSocket
- Transaction status tracking with user-friendly messages
- Clear fee breakdown before transaction confirmation
- Slippage protection for trades

## Critical Differences from Pump.fun

1. **Network**: BNB Smart Chain (EVM) vs Solana (different programming model)
2. **DEX Integration**: PancakeSwap vs Pump Swap (requires different APIs)
3. **Leverage**: Aster Protocol integration (100x) vs standard pools
4. **Cost Structure**: More cost-effective, different economic incentives
5. **Speed**: 3-second confirmation vs 400ms (but more reliable during congestion)

## Risk Areas

### Technical Risks
- Smart contract vulnerabilities (HIGH priority - requires extensive auditing)
- BNB network congestion (MEDIUM - less likely than Solana)
- Integration failures with PancakeSwap (MEDIUM - well-documented APIs)
- Aster Protocol API changes (MEDIUM - external dependency)

### Market Risks
- Competition from established Pump.fun (HIGH - first-mover advantage needed)
- User adoption slower than projected (MEDIUM - strong value proposition)
- Regulatory changes (LOW-MEDIUM - geo-restriction capability)

## Important Notes

### What NOT to Do
- Never implement presale or early investor allocations (fair launch only)
- Avoid complex tokenomics that could be classified as securities
- Don't skip security audits even for minor contract changes
- Never store private keys or sensitive data in code
- Don't implement features that could enable rug pulls

### Aster Protocol Integration
Aster is a perpetual DEX with 100x leverage - significantly more advanced than standard DEXs:
- Research their factory contracts for pool creation
- Understand margin requirements and liquidation mechanisms
- Study ASTER token integration in their ecosystem
- Account for cross-chain considerations (they support multiple chains)

## Key Documentation References

- Project specification: `project.md` (comprehensive PRD with architecture)
- Gas cost analysis: `research/01_BSC_Gas_Cost_Analysis.md`
- Bonding curve research: `research/02_Bonding_Curve_Cost_Analysis.md`
- Feasibility report: `research/08_Final_Feasibility_Report.md`
- Pump.fun background: `Info.txt` (original inspiration)

## Next Immediate Steps (When Development Starts)

1. Set up Hardhat project structure with TypeScript
2. Implement TokenFactory.sol with BEP-20 standard
3. Develop BondingCurve.sol with constant product formula (x*y=k)
4. Create comprehensive test suite for core contracts
5. Set up Next.js project with Wagmi/Viem integration
6. Build token creation form with IPFS metadata upload
