# Specification: Core Smart Contracts

## Goal
Implement the foundational smart contract infrastructure for PumpBNB, enabling permissionless token creation and automated price discovery through constant product bonding curves on BNB Chain.

## User Stories
- As a meme coin creator, I want to deploy a new token instantly without technical knowledge so that I can launch my project quickly
- As a trader, I want to buy and sell tokens through an automated bonding curve so that I can trade without waiting for liquidity providers
- As a token holder, I want automatic graduation to PancakeSwap at $50K market cap so that my tokens gain broader market access
- As a platform user, I want transparent and predictable pricing so that I can make informed trading decisions
- As a creator, I want to earn fees from my token's success so that I'm incentivized to build community

## Core Requirements

### Functional Requirements
- Deploy BEP-20 tokens through factory pattern with customizable metadata (name, symbol, URI)
- Implement constant product bonding curve (x*y=k) for automated market making
- Enable instant buy/sell trading with 1.5% platform fee
- Automatically graduate tokens to PancakeSwap at $50K market cap
- Lock creator allocation (20% of supply) during bonding curve phase
- Calculate real-time prices based on virtual and real reserves
- Distribute fees dynamically based on market cap milestones
- Provide slippage protection on all trades
- Emit comprehensive events for off-chain indexing

### Non-Functional Requirements
- Gas optimization: < 3.5M gas for token creation, < 200K gas per trade
- Support 1000+ concurrent token bonding curves
- Maintain 99.9% uptime with emergency pause capability
- Full compatibility with MetaMask, Trust Wallet, and standard Web3 wallets
- Sub-second price calculation response times
- Comprehensive security controls and access management

## Visual Design
No visual mockups provided for smart contracts (backend infrastructure).

## Reusable Components

### Existing Code to Leverage
- Components: None (greenfield project)
- Services: None (no existing codebase)
- Patterns: None (first implementation)

### New Components Required
- TokenFactory.sol: Factory pattern for BEP-20 token deployment
- BondingCurve.sol: Constant product AMM implementation
- GraduationManager.sol: PancakeSwap migration handler
- PlatformConfig.sol: Centralized configuration management
- BEP20Token.sol: Standard token implementation with custom features

## Technical Approach

### Smart Contract Architecture

**TokenFactory.sol**
- Deploys BEP-20 tokens using CREATE2 for deterministic addresses
- Functions:
  - `createToken(name, symbol, uri, creator)`: Deploy new token with bonding curve
  - `getTokenInfo(address)`: Retrieve token metadata and curve address
  - `setCreationFee(uint256)`: Admin function to update creation fee
- State Variables:
  - `mapping(address => address) public tokenToBondingCurve`
  - `uint256 public creationFee = 0.01 ether`
  - `uint256 public tokenCounter`
  - `address public platformConfig`

**BondingCurve.sol**
- Implements Uniswap V2 constant product formula with virtual reserves
- Functions:
  - `initialize(token, creator, virtualBNB, virtualToken)`: Setup curve parameters
  - `buy(minTokensOut)`: Purchase tokens with BNB
  - `sell(tokenAmount, minBNBOut)`: Sell tokens for BNB
  - `getPrice()`: Current token price in BNB
  - `getBuyAmount(bnbIn)`: Calculate tokens received
  - `getSellAmount(tokensIn)`: Calculate BNB received
  - `checkGraduation()`: Verify graduation conditions
- State Variables:
  - `uint256 public virtualBNBReserve = 0.3 ether`
  - `uint256 public virtualTokenReserve = 200_000_000e18`
  - `uint256 public realBNBReserve`
  - `uint256 public realTokenReserve`
  - `bool public graduated`
  - `uint256 public totalVolume`
  - `address public creator`

**GraduationManager.sol**
- Handles migration from bonding curve to PancakeSwap
- Functions:
  - `migrate(bondingCurve)`: Execute graduation to DEX
  - `createPancakePair(token)`: Deploy new liquidity pair
  - `addLiquidity(token, bnbAmount, tokenAmount)`: Add initial liquidity
  - `lockLPTokens(pair, duration)`: Lock liquidity tokens
- Integration Points:
  - PancakeSwap Factory: 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73
  - PancakeSwap Router: 0x10ED43C718714eb63d5aA57B78B54704E256024E

**PlatformConfig.sol**
- Centralized configuration and access control
- Functions:
  - `setTradingFee(uint256)`: Update trading fee (basis points)
  - `setFeeRecipient(address)`: Update fee collection address
  - `pause()` / `unpause()`: Emergency circuit breaker
  - `setGraduationThreshold(uint256)`: Update market cap target
- Fee Distribution:
  - 40% to Platform Treasury
  - 30% to Creator (milestone-based)
  - 20% to LP Providers (post-graduation)
  - 10% to Referrers

### Database Models
Not applicable for smart contracts (all state on-chain).

### API Design
Smart contracts expose public/external functions as API:
- Read functions: View functions for price queries (no gas)
- Write functions: State-changing operations (require gas)
- Events: Real-time notifications for state changes

### Testing Strategy
- Unit tests: 95% coverage using Hardhat/Foundry
- Integration tests: Full token lifecycle testing
- Fuzz testing: Mathematical operations and edge cases
- Security audits: Slither, Mythril static analysis
- Gas profiling: Optimization for all operations

## Technical Implementation Details

### Bonding Curve Mathematics
```solidity
// Constant Product Formula: (x + dx) * (y - dy) = k
function calculateBuyAmount(uint256 bnbIn) public view returns (uint256) {
    uint256 bnbReserve = virtualBNBReserve + realBNBReserve;
    uint256 tokenReserve = virtualTokenReserve + realTokenReserve;
    uint256 k = bnbReserve * tokenReserve;

    uint256 newBnbReserve = bnbReserve + bnbIn;
    uint256 newTokenReserve = k / newBnbReserve;

    return tokenReserve - newTokenReserve;
}
```

### Graduation Conditions
Token graduates when ALL conditions are met:
1. Market cap reaches $50,000 (≈40 BNB)
2. Minimum 50 unique holders
3. Minimum 500 transactions
4. 80% of non-creator supply distributed

### Security Measures
- OpenZeppelin ReentrancyGuard on all state-changing functions
- AccessControl for role-based permissions
- Pausable for emergency stops
- Checks-Effects-Interactions pattern
- Slippage protection on all trades
- Maximum transaction limits for anti-whale protection

### Gas Optimization Strategies
- Use CREATE2 for deterministic addresses (saves storage reads)
- Pack struct variables to minimize storage slots
- Cache frequently accessed storage in memory
- Batch operations where possible
- Use unchecked blocks for safe arithmetic
- Optimize for common case (buying) over rare case (graduation)

## Out of Scope
- Advanced order types (limit orders, stop-loss)
- Aster Protocol 100x leverage integration
- Frontend implementation
- Off-chain indexing infrastructure
- Governance mechanisms
- Cross-chain functionality
- NFT integration
- Staking mechanisms

## Success Criteria
- Token creation completes in < 3.5M gas
- Buy/sell transactions complete in < 200K gas
- Price calculations accurate to 18 decimal places
- 100% of trades execute without reverting (valid inputs)
- Graduation triggers automatically at exact threshold
- All fees collected and distributed correctly
- Zero critical vulnerabilities in security audit
- Successfully graduate 10 test tokens to PancakeSwap
- Handle 100 concurrent trading tokens without performance degradation