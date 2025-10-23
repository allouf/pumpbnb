# Specification: Core Smart Contracts

## Goal
Implement the foundational smart contract infrastructure for PumpBNB, enabling permissionless token creation and automated price discovery through ASTER-based bonding curves with automatic graduation to PancakeSwap at 100 ASTER threshold.

## User Stories
- As a token creator, I want to deploy a new BEP-20 token with custom metadata so that I can launch my meme coin instantly
- As a trader, I want to buy and sell tokens using ASTER through the bonding curve so that I can participate in early price discovery
- As a platform operator, I want tokens to automatically graduate to PancakeSwap when 100 ASTER accumulates so that successful tokens gain DEX liquidity
- As a user, I want transparent fee collection in ASTER so that I understand the platform economics
- As a developer, I want comprehensive events emitted so that I can build frontends and indexers
- As a creator, I want my token allocation locked during bonding curve phase so that users trust the fair launch

## Core Requirements

### Functional Requirements
- Deploy BEP-20 tokens through factory pattern with standardized implementation
- Trade tokens with ASTER (not BNB) during bonding curve phase using constant product formula (x*y=k)
- Automatically migrate tokens to PancakeSwap when 100 ASTER accumulated in real reserves
- Collect 1% trading fee on bonding curve transactions in ASTER (0.3% to creator, 0.7% to protocol)
- Collect 0.3% trading fee post-graduation on PancakeSwap (0.15% to creator, 0.15% to protocol)
- Lock 20% creator allocation during bonding curve phase with vesting schedule
- Support slippage protection on all trades with minOut parameters
- Emit comprehensive events for all state changes and milestones
- Convert ASTER to WBNB during graduation for PancakeSwap pairing
- Burn LP tokens after graduation to permanently lock liquidity

### Non-Functional Requirements
- Gas optimization: Token creation < 3.2M gas, trades < 200K gas, graduation < 3M gas
- Support 1000+ concurrent token bonding curves without degradation
- 95% minimum test coverage for all smart contracts
- Implement reentrancy protection and emergency pause mechanisms
- Follow OpenZeppelin security standards and best practices
- Ensure upgradeable proxy architecture for future enhancements
- Sub-second price calculations for all view functions
- Full EVM compatibility for standard Web3 wallets

## Visual Design
Not applicable for smart contracts specification.

## Reusable Components

### Existing Code to Leverage
- Components: OpenZeppelin contracts library (installed in node_modules)
  - `@openzeppelin/contracts/token/ERC20/ERC20.sol` for token standard
  - `@openzeppelin/contracts/access/AccessControl.sol` for role management
  - `@openzeppelin/contracts/utils/ReentrancyGuard.sol` for security
  - `@openzeppelin/contracts/utils/Pausable.sol` for emergency controls
  - `@openzeppelin/contracts/proxy/utils/Initializable.sol` for upgradeable pattern
  - `@openzeppelin/contracts/utils/Create2.sol` for deterministic addresses
- Services: None (greenfield smart contract development)
- Patterns: Factory pattern and proxy patterns from OpenZeppelin

### New Components Required
- TokenFactory.sol: Factory for BEP-20 deployment with bonding curve initialization
- BondingCurve.sol: AMM implementation using ASTER as base pair
- GraduationManager.sol: Handles ASTER->WBNB conversion and PancakeSwap migration
- PlatformConfig.sol: Centralized configuration and fee management
- PumpToken.sol: Standardized BEP-20 with creator vesting logic

## Technical Approach

### Database
Not applicable - all state stored on-chain in smart contracts.

### API
Smart contracts expose public/external functions accessible via Web3 providers:
- Read functions via eth_call (no gas required) for price queries and state
- Write functions via eth_sendTransaction (requires gas) for trades and creation
- Event logs via eth_getLogs for historical data retrieval
- Real-time updates via eth_subscribe for new events

### Frontend
Contract integration requirements:
- ABIs for all deployed contracts
- Event topic definitions for filtering
- Multicall support for batch operations
- WebSocket connections for real-time updates

### Testing
- Unit tests using Hardhat with 95% coverage target
- Integration tests for complete token lifecycle
- Fuzz testing with Foundry for mathematical operations
- Gas consumption benchmarks for optimization
- Mainnet fork testing with real PancakeSwap and ASTER contracts
- Security analysis with Slither and Mythril

## Contract Architecture Details

### TokenFactory.sol
Purpose: Deploy new BEP-20 tokens and initialize bonding curves
```
Functions:
- createToken(string name, string symbol, string uri) payable
  - Deploys PumpToken contract
  - Deploys BondingCurve contract
  - Transfers initial supply to bonding curve
  - Locks creator allocation
  - Emits TokenCreated event

- getTokenInfo(address token) view returns (TokenInfo)
  - Returns metadata and bonding curve address

State:
- mapping(address => address) tokenToBondingCurve
- mapping(address => TokenMetadata) tokenMetadata
- address platformConfig
- uint256 tokenCounter
Note: Token creation is FREE (only gas costs required)
```

### BondingCurve.sol
Purpose: Implement constant product AMM with ASTER base pair
```
Functions:
- initialize(address token, address creator, uint256 initialAsterValue)
  - Sets up virtual reserves
  - Configures graduation threshold
  - Sets creator address

- buyWithAster(uint256 minTokensOut) external
  - Requires ASTER approval
  - Calculates tokens out using constant product
  - Updates reserves
  - Checks graduation condition
  - Emits Buy event

- sellForAster(uint256 tokenAmount, uint256 minAsterOut) external
  - Transfers tokens from seller
  - Calculates ASTER out
  - Updates reserves
  - Transfers ASTER to seller
  - Emits Sell event

- getPrice() view returns (uint256)
  - Returns current price in ASTER per token

- getBuyAmount(uint256 asterIn) view returns (uint256)
  - Calculates tokens received for ASTER input

- getSellAmount(uint256 tokensIn) view returns (uint256)
  - Calculates ASTER received for token input

State:
- address asterToken = 0x000Ae314E2A2172a039B26378814C252734f556A
- uint256 virtualAsterReserve (equivalent to 0.3 BNB in ASTER)
- uint256 virtualTokenReserve (200,000,000 tokens)
- uint256 realAsterReserve
- uint256 realTokenReserve
- uint256 graduationThreshold = 100 ASTER
- bool graduated
- address creator
- address feeRecipient
- uint256 totalVolume
- uint256 tradingFee = 100 (1% total: 0.3% creator, 0.7% protocol in basis points)
- uint256 creatorFeeBps = 30 (0.3%)
- uint256 protocolFeeBps = 70 (0.7%)
```

### GraduationManager.sol
Purpose: Handle migration from bonding curve to PancakeSwap
```
Functions:
- checkGraduationEligibility(address bondingCurve) view returns (bool)
  - Verifies 100 ASTER threshold reached
  - Returns eligibility status

- executeGraduation(address bondingCurve) external
  - Extracts ASTER and tokens from bonding curve
  - Swaps ASTER to WBNB via PancakeSwap
  - Creates Token/WBNB pair if not exists
  - Adds liquidity to PancakeSwap
  - Burns LP tokens permanently
  - Marks bonding curve as graduated
  - Emits GraduationCompleted event

- swapAsterToWBNB(uint256 asterAmount) internal returns (uint256)
  - Uses PancakeSwap Router for ASTER->WBNB swap
  - Returns WBNB amount received

Integration:
- PancakeSwap Factory: 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73
- PancakeSwap Router: 0x10ED43C718714eb63d5aA57B78B54704E256024E
- WBNB: 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
- ASTER: 0x000Ae314E2A2172a039B26378814C252734f556A
```

### PlatformConfig.sol
Purpose: Centralized configuration and access management
```
Functions:
- setTradingFee(uint256 basisPoints) onlyAdmin
  - Updates platform trading fee
  - Maximum 500 basis points (5%)

- setFeeRecipient(address recipient) onlyAdmin
  - Updates fee collection address

- setAsterToken(address aster) onlyAdmin
  - Updates ASTER token address

- setGraduationThreshold(uint256 asterAmount) onlyAdmin
  - Updates graduation trigger amount

- pause() / unpause() onlyPauser
  - Emergency circuit breaker

- grantRole(bytes32 role, address account) onlyAdmin
  - Role-based access control

State:
- uint256 bondingCurveTradingFee = 100 (1%)
- uint256 bondingCurveCreatorFeeBps = 30 (0.3%)
- uint256 bondingCurveProtocolFeeBps = 70 (0.7%)
- uint256 postGraduationTradingFee = 30 (0.3%)
- uint256 postGraduationCreatorFeeBps = 15 (0.15%)
- uint256 postGraduationProtocolFeeBps = 15 (0.15%)
- address protocolFeeRecipient
- address asterToken
- uint256 graduationThreshold = 100e18 (100 ASTER)
- bool paused
- mapping(bytes32 => mapping(address => bool)) roles
```

### PumpToken.sol
Purpose: Standardized BEP-20 implementation for deployed tokens
```
Constructor:
- name, symbol, totalSupply, decimals, uri, creator

Features:
- Fixed supply of 1,000,000,000 tokens
- 18 decimals standard
- 20% creator allocation with vesting
- 80% to bonding curve for trading
- No owner functions after deployment
- Metadata URI for extended information
- Transfer restrictions during vesting period
```

## Implementation Flow

### Token Creation Flow
1. User calls TokenFactory.createToken() (FREE - only gas costs)
2. Factory deploys new PumpToken contract using CREATE2
3. Factory deploys new BondingCurve contract
4. Initial supply minted: 800M to bonding curve, 200M locked for creator
5. BondingCurve initialized with virtual reserves
6. TokenCreated event emitted with addresses
7. Token immediately tradeable with ASTER

### Trading Flow
1. User approves ASTER spending to BondingCurve
2. User calls buyWithAster() with slippage protection
3. Contract calculates tokens out using constant product formula
4. ASTER transferred from user, tokens transferred to user
5. Reserves updated, fees collected: 0.3% to creator, 0.7% to protocol (all in ASTER)
6. Buy event emitted with transaction details
7. Graduation check performed after each buy

### Graduation Flow
1. Buy transaction pushes real ASTER reserves to 100 ASTER
2. GraduationManager.executeGraduation() called
3. All ASTER and remaining tokens extracted from bonding curve
4. ASTER swapped to WBNB via PancakeSwap Router
5. Token/WBNB pair created on PancakeSwap Factory
6. Liquidity added with WBNB and proportional tokens
7. LP tokens burned to lock liquidity permanently
8. Bonding curve marked as graduated, trading disabled
9. Creator allocation begins vesting schedule
10. GraduationCompleted event emitted with pair address

## Out of Scope
- Advanced order types (limit, stop-loss) - Phase 2
- Aster Protocol 100x leverage integration - Phase 3
- Frontend and backend implementations - Separate specs
- Off-chain indexing and analytics - Separate infrastructure
- Governance and DAO mechanisms - Future enhancement
- Cross-chain bridge functionality - Not planned
- NFT or staking features - Not planned
- Mobile applications - Phase 3

## Success Criteria
- Deploy 100+ tokens without security incidents
- Process 10,000+ trades with < 200K gas per transaction
- Graduate 10+ tokens to PancakeSwap successfully
- Achieve 95% test coverage with all tests passing
- Pass security audits from 2 independent firms
- Handle $1M+ TVL without vulnerabilities
- Maintain sub-second response for price calculations
- Zero critical bugs in first 3 months mainnet
- Collect and distribute fees accurately: 1% during bonding curve (0.3% creator, 0.7% protocol), 0.3% post-graduation (0.15% creator, 0.15% protocol)
- Successfully convert ASTER to WBNB during graduation