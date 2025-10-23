# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PumpBNB** - A BNB Chain-based meme coin launchpad inspired by Pump.fun on Solana. The platform enables instant token creation and trading through automated bonding curves, with automatic graduation to PancakeSwap at $50K market cap.

**Key Value Proposition**: Cost-effective alternative to Solana-based platforms while maintaining comparable functionality.

## Project Status

Currently in **Phase 2 Complete - Testing Phase**. The codebase contains:
- ✅ Comprehensive specifications (`agent-os/specs/2025-10-13-core-smart-contracts/`)
- ✅ Core smart contracts implemented and compiled (Phase 2: Tasks 5-17 complete)
- ✅ All 5 core contracts deployed: PlatformConfig, PumpToken, BondingCurve, GraduationManager, TokenFactory
- ✅ Interface contracts for PancakeSwap integration
- 🔄 Next: Phase 3 - Unit testing (Tasks 18-22) targeting 95% coverage
- ❌ Frontend and backend not yet started

**Smart Contracts Status**: All core contracts compiled successfully with Solidity 0.8.20 and OpenZeppelin 5.4.0

## Core Technical Architecture

### Trading Flow Architecture

**Phase 1: Bonding Curve Trading (Pre-Graduation)**
- Base Pair: Token/ASTER (users trade with ASTER tokens)
- ASTER Contract: 0x000Ae314E2A2172a039B26378814C252734f556A (BNB Chain)
- Users need ASTER to buy tokens during bonding curve phase
- Platform collects fees in ASTER
- Graduation trigger: 100 ASTER accumulated in reserves

**Phase 2: PancakeSwap Trading (Post-Graduation)**
- Base Pair: Token/WBNB (standard DEX trading)
- Migration process:
  1. Extract 100 ASTER from bonding curve
  2. Swap ASTER → WBNB via PancakeSwap
  3. Create Token/WBNB pair on PancakeSwap
  4. Add liquidity with converted WBNB + remaining tokens
  5. Burn LP tokens (permanent liquidity lock)

**Why ASTER for Bonding Curve?**
- Integrates with Aster Protocol ecosystem
- Creates demand for ASTER token
- Users can later use graduated tokens for 1001x leverage trading on Aster
- Platform revenue collected in ASTER (can be staked for APY)
- Differentiates from BNB/SOL-based competitors

### Smart Contract Design (✅ Implemented)

**PlatformConfig.sol** (2.9 KiB deployed)
- Centralized configuration management with AccessControl
- Role-based permissions (ADMIN, PAUSER)
- Pausable for emergency stops
- Fee management and graduation threshold configuration

**TokenFactory.sol** (19.0 KiB deployed)
- Deploys new BEP-20 tokens using Create2 factory pattern
- **Token creation is FREE** (no creation fee, only gas costs)
- Deterministic addresses for tokens and bonding curves
- Compiled size: 18.973 KiB (under 24KB limit ✅)

**PumpToken.sol** (3.0 KiB deployed)
- Standard BEP-20 token with metadata URI
- Fixed supply: 1 billion tokens (18 decimals)
- Creator allocation: 200M tokens (20%) locked until graduation
- Bonding curve allocation: 800M tokens (80%)

**BondingCurve.sol** (5.2 KiB deployed)
- Automated market maker using ASTER token as base pair
- Constant product formula: `(virtualAster + realAster) * (virtualToken + realToken) = k`
- Virtual reserves: 200M tokens for initial liquidity depth
- Trading fee: **1%** (0.3% creator, 0.7% protocol) collected in ASTER
- ReentrancyGuard protection on all state-changing functions
- Target gas cost: <200K per trade

**GraduationManager.sol** (6.3 KiB deployed)
- Automatic migration to PancakeSwap at **100 ASTER threshold** (single condition)
- ASTER → WBNB swap via PancakeSwap Router
- Creates Token/WBNB pair on PancakeSwap
- Burns LP tokens to address(0) for permanent liquidity lock
- Post-graduation fee: **0.3%** (0.15% creator, 0.15% protocol)
- Target gas cost: <3M for full graduation

**Constants.sol** (0.6 KiB)
- Centralized constants library
- ASTER token: 0x000Ae314E2A2172a039B26378814C252734f556A
- PancakeSwap contracts (Factory, Router)
- Default fee structures and supply allocations

**Interface Contracts** (✅ Implemented)
- IPancakeRouter.sol - PancakeSwap V2 Router interface
- IPancakeFactory.sol - PancakeSwap V2 Factory interface
- IWBNB.sol - Wrapped BNB interface
- IASTER.sol - ASTER token interface (standard IERC20)

**AsterIntegration.sol** (Phase 3 - Not yet started)
- Integration with Aster Protocol for 100x leverage trading
- API-based integration (REST/WebSocket)

### Technology Stack

**Smart Contracts** (✅ Implemented)
- Framework: Hardhat with TypeScript
- Language: Solidity ^0.8.20 (compiled with 0.8.20)
- Libraries: OpenZeppelin 5.4.0, PancakeSwap V2 interfaces
- Testing: Hardhat, Chai, Mocha (Phase 3 in progress)
- Security: Slither, Mythril for static analysis (Phase 4)
- Optimizer: Enabled (200 runs)
- TypeScript bindings: Typechain with ethers-v6

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
- Token creation: **FREE** (no creation fee, only gas costs ~3.2M gas)
- Trading fees during bonding curve: **1%** (0.3% creator, 0.7% protocol)
- Trading fees post-graduation: **0.3%** (0.15% creator, 0.15% protocol)
- Graduation to PancakeSwap: Included in graduation transaction (~3M gas)

### Bonding Curve Parameters (✅ Implemented)
- Formula: Constant product (x*y=k) - Uniswap V2 style
- Base Trading Pair: **ASTER token** (0x000Ae314E2A2172a039B26378814C252734f556A)
- Virtual Reserves: 200,000,000 tokens for initial liquidity depth
- Total Supply: 1,000,000,000 tokens (1 billion)
- Bonding Curve Allocation: 800,000,000 tokens (80%)
- Creator Allocation: 200,000,000 tokens (20% - locked during bonding curve phase)
- Graduation Threshold: **100 ASTER** (single condition - no holder/transaction requirements)
- Post-Graduation Pair: **Token/WBNB** on PancakeSwap (ASTER converted to WBNB)
- Trading Fee During Bonding Curve: **1%** total (30 bps creator, 70 bps protocol) collected in ASTER
- Trading Fee Post-Graduation: **0.3%** total (15 bps creator, 15 bps protocol)

### Security Requirements
- Minimum 2 independent smart contract audits before mainnet
- Bug bounty program with $100K fund
- Reentrancy protection on all state-changing functions
- Emergency pause functionality
- Multi-signature controls for admin functions

## Economic Model

### Revenue Streams
- Trading fees during bonding curve: **1%** per transaction (85% of revenue)
  - Protocol receives 0.7% of all bonding curve trades (collected in ASTER)
  - Creators receive 0.3% of their token's trades
- Post-graduation trading fees: **0.3%** per PancakeSwap transaction (10% of revenue)
  - Protocol receives 0.15% of post-graduation trades
  - Creators receive 0.15% of their token's trades
- Token creation: **FREE** (no revenue, only gas costs paid by users)
- Premium subscriptions: $10-100/month (3% of revenue)
- API access: Usage-based tiers (2% of revenue)

### Break-Even Requirements
- Monthly operating costs: $50,000
- Required monthly volume: Target volume based on 0.7% protocol fee (bonding curve)
- Target timeline: Month 3-4
- Revenue primarily from ASTER tokens collected as protocol fees

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

## Current Progress & Next Steps

### ✅ Completed (Phase 1-2)
1. ✅ Hardhat project structure with TypeScript configured
2. ✅ All 5 core contracts implemented:
   - PlatformConfig.sol - Configuration management
   - PumpToken.sol - BEP-20 token with vesting
   - BondingCurve.sol - ASTER-based AMM
   - GraduationManager.sol - PancakeSwap migration
   - TokenFactory.sol - Create2 factory deployment
3. ✅ Interface contracts for PancakeSwap integration
4. ✅ All contracts compiled successfully (Solidity 0.8.20, OpenZeppelin 5.4.0)
5. ✅ Contract sizes verified (all under 24KB limit)

### 🔄 In Progress (Phase 3)
**Unit Testing - Tasks 18-22** (Target: 95% coverage)
1. PlatformConfig.sol tests (Task 18)
2. PumpToken.sol tests (Task 19)
3. BondingCurve.sol tests (Task 20)
4. GraduationManager.sol tests (Task 21)
5. TokenFactory.sol tests (Task 22)

### 📋 Upcoming (Phase 4-6)
**Phase 4: Security & Auditing** (Tasks 28-35)
- Reentrancy attack testing
- Access control testing
- Economic attack scenarios
- Slither & Mythril static analysis
- Manual security review
- External audit preparation

**Phase 5: Deployment & Documentation** (Tasks 36-43)
- Testnet deployment scripts
- Mainnet deployment scripts
- Contract documentation (NatSpec)
- Developer guide
- ABI and TypeScript bindings

**Phase 6: Frontend & Backend** (Not yet started)
- Next.js frontend with Wagmi/Viem
- Token creation interface
- Trading interface
- Backend API (Node.js + Express)
- IPFS metadata storage integration
