# Spec Requirements: Core Smart Contracts

## Initial Description
Core Smart Contracts (TokenFactory and BondingCurve) - The foundational smart contract infrastructure for PumpBNB (branded as "Aster Fun"), a BNB Chain-based meme coin launchpad. This includes deploying new BEP-20 tokens using factory pattern and implementing an automated market maker for price discovery using ASTER tokens as the base trading pair, based on Pump.fun's architecture adapted for the Aster Protocol ecosystem.

## Reference Implementation: Pump.fun Architecture

### Pump.fun's Core Components
Based on analysis of Pump.fun's implementation on Solana, the following components form the foundation:

1. **Bonding Curve Formula**: Uniswap V2 constant product formula (x*y=k) with virtual and real reserves
2. **Token Creation**: Permissionless creation with custom metadata (name, symbol, URI)
3. **Trading Mechanism**: Buy/sell through bonding curve using ASTER tokens with 1% fee (100 basis points: 30bps to creator, 70bps to protocol)
4. **Graduation System**: Automatic migration to PancakeSwap when 100 ASTER accumulated in real reserves, with ASTER→WBNB conversion for Token/WBNB pairing
5. **Fee Distribution**: Fixed split during bonding curve (0.3% creator, 0.7% protocol); post-graduation (0.15% creator, 0.15% protocol)
6. **State Management**: Global config, per-token bonding curve accounts, volume tracking

## Contract Architecture

### Core Contracts Structure

**1. TokenFactory.sol**
- Purpose: Deploy new BEP-20 tokens with standardized implementation
- Key Functions:
  - `createToken(string name, string symbol, string uri, address creator)` - Deploy new token
  - `registerToken(address token, address bondingCurve)` - Register token with bonding curve
- State Variables:
  - Mapping of token addresses to bonding curves
  - Token creation counter
  - Platform fee recipient address
  - Note: Token creation is FREE (no creation fee, only gas costs)

**2. BondingCurve.sol**
- Purpose: Implement constant product AMM for price discovery using ASTER as base trading pair
- Key Functions:
  - `initialize(address token, address creator, uint256 virtualAsterReserve, uint256 virtualTokenReserve)`
  - `buyWithAster(uint256 asterIn, uint256 minTokensOut)` - Purchase tokens with ASTER
  - `sellForAster(uint256 tokenAmount, uint256 minAsterOut)` - Sell tokens for ASTER
  - `getPrice()` - Calculate current token price in ASTER
  - `getBuyAmount(uint256 asterIn)` - Calculate tokens received for ASTER
  - `getSellAmount(uint256 tokensIn)` - Calculate ASTER received for tokens
- State Variables:
  - ASTER token address: 0x000Ae314E2A2172a039B26378814C252734f556A
  - Virtual ASTER reserve (initial liquidity simulation)
  - Virtual token reserve (initial supply simulation)
  - Real ASTER reserve (actual ASTER in contract)
  - Real token reserve (actual tokens in contract)
  - Total tokens sold
  - Trading volume
  - Creator address
  - Fee recipient addresses (creator and protocol)
  - Graduation threshold: 100 ASTER (100e18)

**3. GraduationManager.sol**
- Purpose: Handle migration to PancakeSwap when 100 ASTER threshold reached, including ASTER→WBNB conversion
- Key Functions:
  - `checkGraduationEligibility(address bondingCurve)` - Verify 100 ASTER threshold reached
  - `executeGraduation(address bondingCurve)` - Execute full migration process
  - `swapAsterToWBNB(uint256 asterAmount)` - Convert ASTER to WBNB via PancakeSwap
  - `createPancakePair()` - Create Token/WBNB liquidity pool on PancakeSwap
  - `lockLiquidity()` - Burn LP tokens permanently (address(0))

**4. PlatformConfig.sol**
- Purpose: Centralized configuration and fee management
- Key Functions:
  - `setFeeRecipient(address)` - Update fee recipient
  - `setTradingFee(uint256)` - Update trading fee (basis points)
  - `setCreationFee(uint256)` - Update token creation fee
  - `pause()` / `unpause()` - Emergency controls
- State Variables:
  - Bonding curve trading fee: 100 basis points (1%) split as 30bps creator, 70bps protocol
  - Post-graduation trading fee: 30 basis points (0.3%) split as 15bps creator, 15bps protocol
  - Creator fee recipient address
  - Protocol fee recipient address
  - ASTER token address
  - Graduation threshold: 100 ASTER (100e18)
  - Emergency pause state

## Token Creation Process

### Flow Specification
1. User calls `TokenFactory.createToken()` with metadata
2. Factory deploys new BEP-20 token contract
3. Factory deploys dedicated BondingCurve contract for token
4. Initial token supply minted to BondingCurve contract
5. Creator allocation (20%) locked in separate vesting contract
6. Bonding curve initialized with virtual reserves
7. Token registered in factory mapping
8. Creation event emitted with token and curve addresses

### Token Metadata Requirements
- Name: 1-32 characters
- Symbol: 2-10 uppercase alphanumeric characters
- Total Supply: Fixed at 1,000,000,000 tokens
- Decimals: 18 (standard for BEP-20)
- URI: IPFS hash for extended metadata (image, description)

## Bonding Curve Mechanics

### Constant Product Formula Implementation
Unlike the initial linear formula assumption, we follow Pump.fun's approach using constant product:

```
Price Discovery Formula: (x + dx) * (y - dy) = x * y = k

Where:
- x = ASTER reserves (virtual + real)
- y = Token reserves (virtual + real)
- k = constant product
- dx = ASTER input
- dy = Token output
```

### Virtual Reserves Initialization
- Virtual ASTER Reserve: Equivalent to 0.3 BNB in ASTER tokens (provides initial liquidity depth)
- Virtual Token Reserve: 200,000,000 tokens (20% of supply)
- Purpose: Prevent extreme price volatility at launch
- Graduation occurs when real ASTER reserves reach 100 ASTER threshold

### Price Calculation
```solidity
function getPrice() returns (uint256) {
    uint256 asterReserve = virtualAsterReserve + realAsterReserve;
    uint256 tokenReserve = virtualTokenReserve + realTokenReserve;
    return (asterReserve * 1e18) / tokenReserve; // Price in ASTER per token
}
```

## Trading Functions

### Buy Function Specification
```solidity
function buyWithAster(uint256 asterIn, uint256 minTokensOut) external {
    require(asterIn > 0, "Must send ASTER");
    require(!graduated, "Bonding curve completed");

    // Calculate fees: 1% total (0.3% creator, 0.7% protocol)
    uint256 creatorFee = (asterIn * 30) / 10000; // 0.3%
    uint256 protocolFee = (asterIn * 70) / 10000; // 0.7%
    uint256 asterAfterFee = asterIn - creatorFee - protocolFee;

    uint256 tokensOut = calculateBuyAmount(asterAfterFee);
    require(tokensOut >= minTokensOut, "Slippage exceeded");

    // Transfer ASTER from buyer
    asterToken.transferFrom(msg.sender, address(this), asterIn);

    // Update reserves
    realAsterReserve += asterAfterFee;
    realTokenReserve -= tokensOut;

    // Transfer tokens to buyer
    token.transfer(msg.sender, tokensOut);

    // Transfer fees
    asterToken.transfer(creator, creatorFee);
    asterToken.transfer(protocolFeeRecipient, protocolFee);

    // Check graduation (100 ASTER threshold)
    if (realAsterReserve >= 100e18) {
        triggerGraduation();
    }

    emit Buy(msg.sender, asterIn, tokensOut, creatorFee, protocolFee);
}
```

### Sell Function Specification
```solidity
function sellForAster(uint256 tokenAmount, uint256 minAsterOut) external {
    require(tokenAmount > 0, "Must sell tokens");
    require(!graduated, "Bonding curve completed");

    uint256 asterOut = calculateSellAmount(tokenAmount);

    // Calculate fees: 1% total (0.3% creator, 0.7% protocol)
    uint256 creatorFee = (asterOut * 30) / 10000; // 0.3%
    uint256 protocolFee = (asterOut * 70) / 10000; // 0.7%
    uint256 asterAfterFee = asterOut - creatorFee - protocolFee;

    require(asterAfterFee >= minAsterOut, "Slippage exceeded");

    // Transfer tokens from seller
    token.transferFrom(msg.sender, address(this), tokenAmount);

    // Update reserves
    realTokenReserve += tokenAmount;
    realAsterReserve -= asterOut;

    // Send ASTER to seller
    asterToken.transfer(msg.sender, asterAfterFee);

    // Transfer fees
    asterToken.transfer(creator, creatorFee);
    asterToken.transfer(protocolFeeRecipient, protocolFee);

    emit Sell(msg.sender, tokenAmount, asterAfterFee, creatorFee, protocolFee);
}
```

## Fee Collection and Distribution

### Fee Structure
- **Bonding Curve Trading Fee**: 1% (100 basis points) on all ASTER trades
  - 0.3% (30 basis points) to Creator
  - 0.7% (70 basis points) to Protocol
- **Post-Graduation Trading Fee**: 0.3% (30 basis points) on PancakeSwap
  - 0.15% (15 basis points) to Creator
  - 0.15% (15 basis points) to Protocol
- **Token Creation Fee**: FREE (only gas costs, no platform fee)
- **Graduation Fee**: No separate fee (included in ASTER→WBNB swap slippage)

### Fee Distribution Model
**During Bonding Curve Phase:**
- Fixed 1% total fee collected in ASTER tokens
- 30% of fee (0.3% of trade) goes to token creator immediately
- 70% of fee (0.7% of trade) goes to protocol treasury immediately

**Post-Graduation (PancakeSwap):**
- Fixed 0.3% total fee on Token/WBNB trades
- 50% of fee (0.15% of trade) goes to token creator
- 50% of fee (0.15% of trade) goes to protocol treasury

## Graduation Trigger and Migration

### Graduation Conditions
Token graduates from bonding curve to PancakeSwap when:
1. **Real ASTER reserves reach 100 ASTER (100e18)** - ONLY condition required

Note: Unlike the original design with multiple conditions, PumpBNB uses a single, simple threshold for graduation to maintain consistency with CLAUDE.md specifications.

### Migration Process
1. **Trigger Detection**: Buy transaction pushes real ASTER reserves to 100 ASTER threshold
2. **Liquidity Extraction**: Extract all ASTER (100 ASTER) and remaining tokens from bonding curve
3. **ASTER to WBNB Swap**: Convert 100 ASTER to WBNB via PancakeSwap Router (ASTER→WBNB path)
4. **PancakeSwap Pair Creation**: Create Token/WBNB pair on PancakeSwap (if doesn't exist)
5. **Liquidity Addition**: Add WBNB (from swap) + proportional tokens to PancakeSwap
6. **LP Token Burning**: Burn all LP tokens to address(0) for permanent liquidity lock
7. **State Update**: Mark bonding curve as graduated, disable further trading
8. **Creator Allocation**: Unlock creator's 20% token allocation for vesting
9. **Event Emission**: Emit GraduationCompleted event with pair address and amounts

### Post-Graduation Handling
- Bonding curve contract remains but rejects new trades
- Redirects users to PancakeSwap router
- Maintains historical data for analytics
- Creator fees continue through PancakeSwap volume tracking

## Security Considerations

### Access Control
- Use OpenZeppelin AccessControl for role management
- ADMIN_ROLE: Platform operators only
- PAUSER_ROLE: Emergency response team
- No admin functions that can drain user funds

### Reentrancy Protection
- OpenZeppelin ReentrancyGuard on all state-changing functions
- Checks-Effects-Interactions pattern strictly followed
- No external calls before state updates

### Integer Overflow Protection
- Solidity 0.8.19+ automatic overflow protection
- SafeMath for any unchecked blocks
- Explicit bounds checking for user inputs

### Front-Running Mitigation
- Commit-reveal pattern for large trades (optional)
- Maximum transaction size limits
- Slippage protection parameters required

### Emergency Controls
- Pausable pattern for circuit breaker
- Time-locked admin functions (48-hour delay)
- Multi-signature requirement for critical operations

## Testing Requirements

### Unit Testing Coverage
- Minimum 95% code coverage for all contracts
- Test all happy paths and edge cases
- Specific test scenarios:
  - Token creation with various parameters
  - Buy/sell at different reserve ratios
  - Graduation trigger at exact threshold
  - Fee calculation precision
  - Slippage protection enforcement

### Integration Testing
- Full end-to-end token lifecycle
- PancakeSwap integration after graduation
- Multi-user trading scenarios
- Gas optimization verification

### Security Testing
- Fuzzing with Foundry for mathematical operations
- Static analysis with Slither and Mythril
- Formal verification for critical invariants
- Professional audit before mainnet deployment

### Performance Testing
- Gas cost analysis for all operations:
  - Token creation: Target < 3,500,000 gas
  - Buy transaction: Target < 200,000 gas
  - Sell transaction: Target < 180,000 gas
  - Graduation: Target < 3,000,000 gas

## Solana to EVM Adaptation Notes

### Account Model Differences
**Solana**: Program Derived Addresses (PDAs) for deterministic account creation
**EVM Adaptation**: Use CREATE2 for deterministic contract addresses

### Token Standard
**Solana**: SPL Token Program with associated token accounts
**EVM Adaptation**: ERC-20/BEP-20 standard with approve/transferFrom pattern

### State Storage
**Solana**: Separate account structs for each data type
**EVM Adaptation**: Contract storage variables with mappings and structs

### Instruction vs Function Calls
**Solana**: Instructions with serialized data
**EVM Adaptation**: Function selectors with ABI-encoded parameters

### Cross-Program Invocation
**Solana**: CPI (Cross-Program Invocation) for composability
**EVM Adaptation**: External contract calls via interfaces

### Fee Payment
**Solana**: Transaction fees in SOL paid by transaction signer
**EVM Adaptation**: Gas fees in BNB, can be meta-transactions for gasless UX

## Requirements Summary

### Functional Requirements
- Permissionless token creation with customizable metadata
- Constant product bonding curve for price discovery
- Buy and sell functions with slippage protection
- Automatic graduation to PancakeSwap at market cap threshold
- Dynamic fee distribution based on milestones
- Creator token vesting during bonding curve phase
- Real-time price calculation based on reserves

### Non-Functional Requirements
- Gas-optimized operations (< 200K gas per trade)
- Sub-second price calculations
- Support for 1000+ concurrent tokens
- 99.9% uptime with emergency pause capability
- Full EVM compatibility for standard wallets
- Comprehensive event emission for indexing

### Scope Boundaries

**In Scope:**
- TokenFactory for BEP-20 deployment
- BondingCurve with constant product AMM
- GraduationManager for PancakeSwap migration
- PlatformConfig for fee management
- Basic security controls and pausability

**Out of Scope:**
- Advanced order types (limit, stop-loss) - Phase 2
- Aster Protocol integration - Phase 3
- Frontend implementation - Separate spec
- Off-chain indexing and analytics - Separate spec
- Governance mechanisms - Future enhancement

### Technical Considerations
- Must integrate with PancakeSwap V2 Router and Factory
- Requires Chainlink price feeds for USD valuations
- IPFS integration for token metadata storage
- Event-driven architecture for real-time updates
- Upgradeable proxy pattern for future enhancements