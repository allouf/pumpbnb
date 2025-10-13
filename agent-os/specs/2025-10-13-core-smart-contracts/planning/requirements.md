# Spec Requirements: Core Smart Contracts

## Initial Description
Core Smart Contracts (TokenFactory and BondingCurve) - The foundational smart contract infrastructure for PumpBNB, a BNB Chain-based meme coin launchpad. This includes deploying new BEP-20 tokens using factory pattern and implementing an automated market maker for price discovery based on Pump.fun's architecture.

## Reference Implementation: Pump.fun Architecture

### Pump.fun's Core Components
Based on analysis of Pump.fun's implementation on Solana, the following components form the foundation:

1. **Bonding Curve Formula**: Uniswap V2 constant product formula (x*y=k) with virtual and real reserves
2. **Token Creation**: Permissionless creation with custom metadata (name, symbol, URI)
3. **Trading Mechanism**: Buy/sell through bonding curve with 1.5% fee (150 basis points)
4. **Graduation System**: Automatic migration when bonding curve completes (zero real reserves)
5. **Fee Distribution**: Dynamic tiers based on market cap milestones
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
  - Minimum creation fee (anti-spam)

**2. BondingCurve.sol**
- Purpose: Implement constant product AMM for price discovery
- Key Functions:
  - `initialize(address token, address creator, uint256 virtualBNBReserve, uint256 virtualTokenReserve)`
  - `buy(uint256 minTokensOut)` - Purchase tokens with BNB
  - `sell(uint256 tokenAmount, uint256 minBNBOut)` - Sell tokens for BNB
  - `getPrice()` - Calculate current token price
  - `getBuyAmount(uint256 bnbIn)` - Calculate tokens received for BNB
  - `getSellAmount(uint256 tokensIn)` - Calculate BNB received for tokens
- State Variables:
  - Virtual BNB reserve (initial liquidity simulation)
  - Virtual token reserve (initial supply simulation)
  - Real BNB reserve (actual BNB in contract)
  - Real token reserve (actual tokens in contract)
  - Total tokens sold
  - Trading volume
  - Creator address
  - Graduation threshold

**3. GraduationManager.sol**
- Purpose: Handle migration to PancakeSwap when graduation conditions met
- Key Functions:
  - `checkGraduationEligibility(address bondingCurve)` - Verify graduation conditions
  - `migrate(address bondingCurve)` - Execute migration to PancakeSwap
  - `createPancakePair()` - Create liquidity pool on PancakeSwap
  - `lockLiquidity()` - Lock LP tokens for specified period

**4. PlatformConfig.sol**
- Purpose: Centralized configuration and fee management
- Key Functions:
  - `setFeeRecipient(address)` - Update fee recipient
  - `setTradingFee(uint256)` - Update trading fee (basis points)
  - `setCreationFee(uint256)` - Update token creation fee
  - `pause()` / `unpause()` - Emergency controls
- State Variables:
  - Platform fee percentage (100 basis points = 1%)
  - Creation fee amount
  - Fee recipient address
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
- x = BNB reserves (virtual + real)
- y = Token reserves (virtual + real)
- k = constant product
- dx = BNB input
- dy = Token output
```

### Virtual Reserves Initialization
- Virtual BNB Reserve: 0.3 BNB (provides initial liquidity depth)
- Virtual Token Reserve: 200,000,000 tokens (20% of supply)
- Purpose: Prevent extreme price volatility at launch
- Graduation occurs when real reserves reach target thresholds

### Price Calculation
```solidity
function getPrice() returns (uint256) {
    uint256 bnbReserve = virtualBNBReserve + realBNBReserve;
    uint256 tokenReserve = virtualTokenReserve + realTokenReserve;
    return (bnbReserve * 1e18) / tokenReserve;
}
```

## Trading Functions

### Buy Function Specification
```solidity
function buy(uint256 minTokensOut) external payable {
    require(msg.value > 0, "Must send BNB");
    require(!graduated, "Bonding curve completed");

    uint256 fee = (msg.value * tradingFee) / 10000;
    uint256 bnbAfterFee = msg.value - fee;

    uint256 tokensOut = calculateBuyAmount(bnbAfterFee);
    require(tokensOut >= minTokensOut, "Slippage exceeded");

    // Update reserves
    realBNBReserve += bnbAfterFee;
    realTokenReserve -= tokensOut;

    // Transfer tokens to buyer
    token.transfer(msg.sender, tokensOut);

    // Check graduation conditions
    if (checkGraduation()) {
        triggerGraduation();
    }

    emit Buy(msg.sender, msg.value, tokensOut);
}
```

### Sell Function Specification
```solidity
function sell(uint256 tokenAmount, uint256 minBNBOut) external {
    require(tokenAmount > 0, "Must sell tokens");
    require(!graduated, "Bonding curve completed");

    uint256 bnbOut = calculateSellAmount(tokenAmount);
    uint256 fee = (bnbOut * tradingFee) / 10000;
    uint256 bnbAfterFee = bnbOut - fee;

    require(bnbAfterFee >= minBNBOut, "Slippage exceeded");

    // Transfer tokens from seller
    token.transferFrom(msg.sender, address(this), tokenAmount);

    // Update reserves
    realTokenReserve += tokenAmount;
    realBNBReserve -= bnbOut;

    // Send BNB to seller
    payable(msg.sender).transfer(bnbAfterFee);

    emit Sell(msg.sender, tokenAmount, bnbAfterFee);
}
```

## Fee Collection and Distribution

### Fee Structure
- **Trading Fee**: 1.5% (150 basis points) on all trades
- **Creation Fee**: 0.01 BNB (anti-spam measure)
- **Graduation Fee**: 0.5% of liquidity migrated

### Fee Distribution Model
```
Total Trading Fee (1.5%) splits:
- 40% to Platform Treasury
- 30% to Creator (if token reaches certain milestones)
- 20% to Liquidity Providers (post-graduation)
- 10% to Referrers (if applicable)
```

### Milestone-Based Creator Rewards
- Tier 1: $10K market cap - Creator gets 10% of fees
- Tier 2: $30K market cap - Creator gets 20% of fees
- Tier 3: $50K market cap (graduation) - Creator gets 30% of fees

## Graduation Trigger and Migration

### Graduation Conditions
Token graduates from bonding curve to PancakeSwap when:
1. Market cap reaches $50,000 (approximately 40 BNB at current prices)
2. Minimum 50 unique holders
3. Minimum 500 transactions completed
4. 80% of non-creator supply distributed

### Migration Process
1. **Trigger Detection**: Buy transaction pushes market cap over threshold
2. **Liquidity Extraction**: Remove all BNB and tokens from bonding curve
3. **PancakeSwap Pair Creation**: Create new pair if doesn't exist
4. **Liquidity Addition**: Add extracted liquidity to PancakeSwap
5. **LP Token Locking**: Lock LP tokens for 30 days minimum
6. **State Update**: Mark bonding curve as graduated
7. **Event Emission**: Notify indexers and frontend of migration

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