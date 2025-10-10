# F3: Bonding Curve Trading

**Feature ID**: F3
**Priority**: Critical (Must-Have)
**Phase**: 1 - Core Platform (MVP)
**Dependencies**: F1 (Wallet Connection), F2 (Token Creation)
**Status**: Specification

---

## Overview

Automated market maker (AMM) using a linear bonding curve for token price discovery. Users can buy and sell tokens directly from the curve with transparent pricing and instant liquidity. The bonding curve replaces traditional order books and liquidity pools.

### User Value
- **Instant Liquidity**: Trade immediately after token creation
- **Fair Pricing**: Transparent mathematical formula, no manipulation
- **No Slippage Surprises**: Price impact calculated before trade
- **Low Fees**: 1% platform fee + ~$0.002 gas cost
- **Automated Market Making**: No need for liquidity providers

---

## User Stories

### As a buyer
- I want to see the exact price and amount of tokens I'll receive before buying
- I want to set slippage tolerance to protect against front-running
- I want to know my transaction will succeed or fail before paying gas
- I want confirmation that my tokens arrived in my wallet

### As a seller
- I want to sell my tokens instantly without finding a buyer
- I want to see how much BNB I'll receive before selling
- I want my BNB to arrive in my wallet immediately after sale

### As a trader
- I want to see real-time price updates as supply changes
- I want to understand the price impact of large trades
- I want protection against MEV (Maximal Extractable Value) attacks

---

## Technical Requirements

### Smart Contract: BondingCurve.sol

#### Linear Bonding Curve Formula

```solidity
/**
 * Linear Bonding Curve Formula:
 * price = initialPrice + (tokensIssued * priceIncrement)
 *
 * totalCost = initialPrice * amount + (priceIncrement * amount^2 / 2)
 *
 * Where:
 * - initialPrice = $0.000001 (in BNB)
 * - priceIncrement = $0.000000001 per token
 * - tokensIssued = cumulative tokens sold from curve
 */

function calculateCost(uint256 amount) public view returns (uint256) {
    uint256 supply = tokensSold;
    uint256 baseCost = INITIAL_PRICE * amount;
    uint256 incrementCost = (PRICE_INCREMENT * amount * (2 * supply + amount)) / 2;
    return baseCost + incrementCost;
}

function calculateReturn(uint256 amount) public view returns (uint256) {
    uint256 supply = tokensSold;
    uint256 newSupply = supply - amount;
    uint256 returnAmount = calculateCost(supply) - calculateCost(newSupply);
    return returnAmount;
}
```

#### Core Functions

```solidity
contract BondingCurve {
    // Buy tokens with BNB
    function buy(uint256 minTokensOut) external payable returns (uint256);

    // Sell tokens for BNB
    function sell(uint256 tokenAmount, uint256 minBNBOut) external returns (uint256);

    // Calculate buy cost
    function getBuyPrice(uint256 tokenAmount) external view returns (uint256 bnbCost);

    // Calculate sell return
    function getSellReturn(uint256 tokenAmount) external view returns (uint256 bnbReturn);

    // Get current token price
    function getCurrentPrice() external view returns (uint256);

    // Check if graduation threshold reached
    function checkGraduation() external view returns (bool);
}
```

### Bonding Curve Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Initial Price** | $0.000001 (in BNB) | Affordable entry point |
| **Price Increment** | $0.000000001 per token | Gradual price increase |
| **Total Supply** | 1,000,000,000 tokens | Standard meme coin supply |
| **Bonding Curve Supply** | 800,000,000 tokens | 80% available for trading |
| **Creator Allocation** | 200,000,000 tokens | 20% locked until graduation |
| **Graduation Threshold** | $100,000 market cap | ~80M BNB raised |
| **Platform Fee** | 1.0% of transaction value | Revenue model |

### Fee Structure

```solidity
// 1% platform fee on all trades
uint256 public constant PLATFORM_FEE_BPS = 100; // 100 basis points = 1%

function _calculateFee(uint256 amount) internal pure returns (uint256) {
    return (amount * PLATFORM_FEE_BPS) / 10000;
}

// Fees collected in BondingCurve contract
function collectFees() external onlyOwner {
    uint256 fees = accumulatedFees;
    accumulatedFees = 0;
    payable(treasury).transfer(fees);
}
```

---

## User Experience Flow

### Buy Flow

```
Step 1: Enter BNB Amount or Token Amount
   - Input field: "Buy X BNB worth" or "Buy Y tokens"
   - Live price calculation as user types
   ↓
Step 2: Review Transaction Preview
   - You pay: 0.5 BNB
   - You receive: ~450,000 DOGK
   - Current price: $0.000001234
   - Price impact: 0.5%
   - Platform fee (1%): 0.005 BNB
   - Total cost: 0.505 BNB
   ↓
Step 3: Set Slippage Tolerance (optional)
   - Default: 1%
   - Custom: 0.5% - 10%
   ↓
Step 4: Confirm in Wallet
   - MetaMask popup shows transaction
   - User approves
   ↓
Step 5: Transaction Processing
   - Pending state (show loading)
   - Block confirmation (~3 seconds)
   ↓
Step 6: Success!
   - "You bought 450,000 DOGK"
   - Tokens appear in wallet
   - Update portfolio
```

### Sell Flow

```
Step 1: Enter Token Amount
   - Input: "Sell X DOGK"
   - Shows max balance available
   ↓
Step 2: Review Return Amount
   - You sell: 450,000 DOGK
   - You receive: ~0.48 BNB
   - Current price: $0.000001234
   - Price impact: -0.5%
   - Platform fee (1%): 0.0048 BNB
   ↓
Step 3: Confirm in Wallet
   - Approve token spend (if first time)
   - Approve sell transaction
   ↓
Step 4: Success!
   - "You received 0.48 BNB"
   - BNB appears in wallet
```

---

## UI Components

### Trading Interface

```
┌─────────────────────────────────────────┐
│  [Buy] [Sell]                           │
├─────────────────────────────────────────┤
│                                          │
│  You pay:          [_________] BNB ▼    │
│                                          │
│         ⇅ (swap icon)                    │
│                                          │
│  You receive:      [_________] DOGK     │
│                                          │
│  Current Price:    $0.000001234          │
│  Price Impact:     +0.5% ↗               │
│  Platform Fee:     0.005 BNB (1%)        │
│  ─────────────────────────────────────  │
│  Total Cost:       0.505 BNB             │
│                                          │
│  Slippage:         [1%▼] Auto            │
│                                          │
│  [         Buy DOGK (0.505 BNB)       ] │
│                                          │
│  Balance: 2.5 BNB                        │
└─────────────────────────────────────────┘
```

### Transaction States

**Pending State:**
```
⏳ Transaction Pending...
Waiting for confirmation on BNB Chain
[View on BscScan]
```

**Success State:**
```
✅ Purchase Successful!
You bought 450,000 DOGK for 0.505 BNB
[View Transaction] [Trade More] [Add to Portfolio]
```

**Error State:**
```
❌ Transaction Failed
Error: Slippage tolerance exceeded
[Try Again] [Increase Slippage] [Get Help]
```

---

## Price Calculation Examples

### Example 1: First Buy (Starting from 0 supply)
```
Initial State:
- Tokens Sold: 0
- Current Price: $0.000001

User buys 1,000,000 tokens:
- Cost Calculation:
  baseCost = 0.000001 * 1,000,000 = $1.00
  incrementCost = (0.000000001 * 1M * (0 + 1M)) / 2 = $0.50
  Total = $1.50

- Platform Fee (1%): $0.015
- User Pays: $1.515 (in BNB)
- New Price: $0.000002
```

### Example 2: Sell After Price Increase
```
Current State:
- Tokens Sold: 50,000,000
- Current Price: $0.00005001

User sells 1,000,000 tokens:
- Return = Cost(50M) - Cost(49M)
- Return ≈ $50.50

- Platform Fee (1%): $0.505
- User Receives: $50.00 (in BNB)
- New Price: $0.00005000
```

---

## Smart Contract Security

### Reentrancy Protection

```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BondingCurve is ReentrancyGuard {
    function buy(uint256 minTokensOut)
        external
        payable
        nonReentrant
        returns (uint256)
    {
        // Safe from reentrancy attacks
    }
}
```

### Slippage Protection

```solidity
function buy(uint256 minTokensOut) external payable returns (uint256) {
    uint256 tokenAmount = calculateTokensOut(msg.value);

    require(
        tokenAmount >= minTokensOut,
        "Slippage: Output less than minimum"
    );

    // Execute trade
}
```

### MEV Resistance

```solidity
// Limit max transaction size to prevent manipulation
uint256 public constant MAX_BUY_PERCENTAGE = 5; // 5% of remaining supply

function buy(uint256 minTokensOut) external payable returns (uint256) {
    uint256 remainingSupply = BONDING_CURVE_SUPPLY - tokensSold;
    uint256 maxBuyAmount = (remainingSupply * MAX_BUY_PERCENTAGE) / 100;

    uint256 tokenAmount = calculateTokensOut(msg.value);
    require(tokenAmount <= maxBuyAmount, "Exceeds max buy limit");

    // Execute trade
}
```

### Emergency Pause

```solidity
import "@openzeppelin/contracts/security/Pausable.sol";

contract BondingCurve is Pausable {
    function buy(...) external payable whenNotPaused {
        // Trading logic
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
```

---

## Backend Implementation

### API Endpoints

```typescript
// Get current bonding curve state
GET /api/bonding-curve/:tokenAddress
Response: {
  tokensSold: "50000000",
  currentPrice: "0.00005001",
  marketCap: "250500",
  graduationProgress: 25.05,
  totalBNBRaised: "2505"
}

// Calculate buy quote
POST /api/bonding-curve/quote/buy
Request: { tokenAddress, bnbAmount }
Response: {
  tokensOut: "450000",
  price: "0.000001234",
  priceImpact: 0.5,
  platformFee: "0.005",
  totalCost: "0.505"
}

// Calculate sell quote
POST /api/bonding-curve/quote/sell
Request: { tokenAddress, tokenAmount }
Response: {
  bnbOut: "0.48",
  price: "0.000001234",
  priceImpact: -0.5,
  platformFee: "0.0048"
}

// Get trade history
GET /api/bonding-curve/:tokenAddress/trades
Query: { limit, offset }
Response: [{ type, amount, price, from, timestamp }]
```

### WebSocket for Real-Time Updates

```typescript
// Subscribe to token trades
socket.on('subscribe:trades', { tokenAddress });

// Receive trade updates
socket.on('trade', {
  type: 'buy',
  amount: '450000',
  price: '0.000001234',
  from: '0x742d...',
  timestamp: 1696944000
});

// Price updates every trade
socket.on('price-update', {
  tokenAddress: '0x...',
  currentPrice: '0.000001234',
  priceChange24h: 5.2
});
```

---

## Gas Optimization

### Estimated Gas Costs

| Operation | Gas Units | Cost (5 Gwei) | Notes |
|-----------|-----------|---------------|-------|
| **First Buy** | ~180,000 | $0.0023 | Includes storage writes |
| **Subsequent Buy** | ~100,000 | $0.0013 | Optimized path |
| **First Sell** | ~160,000 | $0.0021 | Includes approval |
| **Subsequent Sell** | ~85,000 | $0.0011 | Optimized path |

### Optimization Techniques

```solidity
// Pack state variables to save storage slots
struct BondingCurveState {
    uint128 tokensSold;           // Fits in 128 bits
    uint128 accumulatedFees;      // Fits in 128 bits
    // Both fit in 1 storage slot (256 bits)
}

// Use unchecked for safe arithmetic
function _calculateCost(uint256 amount) internal view returns (uint256) {
    unchecked {
        // Safe because values are bounded
        uint256 baseCost = INITIAL_PRICE * amount;
        // ... rest of calculation
    }
}

// Cache storage reads
function buy(...) external payable {
    uint256 _tokensSold = tokensSold; // Load once from storage
    // Use _tokensSold in calculations
    tokensSold = _tokensSold + amount; // Write once to storage
}
```

---

## Acceptance Criteria

### Must Have
- [ ] Buy function executes in < 5 seconds
- [ ] Sell function executes in < 5 seconds
- [ ] Price calculations are accurate to 18 decimal places
- [ ] Slippage protection works correctly
- [ ] Platform fee (1%) collected accurately
- [ ] Gas cost < $0.003 per trade
- [ ] Real-time price updates via WebSocket
- [ ] Transaction reverts if insufficient balance
- [ ] MEV protection limits max trade size

### Should Have
- [ ] Price impact warning for trades > 2%
- [ ] Transaction history for each user
- [ ] Retry mechanism for failed transactions
- [ ] Gas price estimation
- [ ] Multiple slippage presets (0.5%, 1%, 2%, 5%)

### Nice to Have
- [ ] Limit order simulation
- [ ] Chart integration showing user's entry price
- [ ] Trade analytics (avg buy price, total invested)
- [ ] Bot detection and rate limiting

---

## Testing Requirements

### Smart Contract Tests
- [ ] Buy increases tokensSold correctly
- [ ] Sell decreases tokensSold correctly
- [ ] Fees calculated and collected properly
- [ ] Slippage protection triggers correctly
- [ ] Cannot buy more than available supply
- [ ] Cannot sell more than owned balance
- [ ] Reentrancy protection works
- [ ] Price calculations match formula
- [ ] Graduation threshold detection

### Integration Tests
- [ ] Frontend → Contract → Wallet flow
- [ ] WebSocket real-time updates
- [ ] API quote endpoints accuracy
- [ ] Database trade history sync
- [ ] Multiple concurrent trades

### Performance Tests
- [ ] 100 consecutive trades
- [ ] Gas usage optimization verified
- [ ] Price calculation performance (< 1ms)
- [ ] WebSocket message latency (< 100ms)

---

## Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| **Trade Execution Time** | < 5 seconds | BSC block time |
| **Price Calculation** | < 1ms | Off-chain calculation |
| **Quote API Response** | < 100ms | Backend response |
| **WebSocket Latency** | < 100ms | Real-time updates |
| **Gas Cost** | < $0.003 | Per trade |

---

## Implementation Checklist

### Week 1: Smart Contract Core
- [ ] Implement bonding curve math
- [ ] Buy function with fee collection
- [ ] Sell function with slippage protection
- [ ] Quote calculation functions
- [ ] Unit tests for all functions

### Week 2: Security & Optimization
- [ ] Add reentrancy protection
- [ ] MEV protection mechanisms
- [ ] Gas optimization
- [ ] Emergency pause functionality
- [ ] Security audit preparation

### Week 3: Backend Integration
- [ ] Quote API endpoints
- [ ] Trade history tracking
- [ ] WebSocket server setup
- [ ] Real-time price updates
- [ ] Database schema for trades

### Week 4: Frontend & Testing
- [ ] Trading interface UI
- [ ] Transaction flow components
- [ ] Error handling and retries
- [ ] Integration testing
- [ ] User acceptance testing

---

## Dependencies for Other Features

**This feature enables:**
- F5 (Price Charts) - trades generate chart data
- F6 (PancakeSwap Graduation) - bonding curve triggers graduation
- F7 (Analytics) - trade data for analytics
- F8 (Portfolio) - user holdings from trades

---

## Open Questions

- [ ] Should we implement dutch auction for initial price discovery?
- [ ] Do we need a "buy and sell" swap feature?
- [ ] Should large trades require multi-sig approval?
- [ ] Do we need cross-token swaps (DOGK → PEPE)?

---

## Success Metrics

- **Trade Success Rate**: > 99%
- **Average Trade Time**: < 5 seconds
- **Gas Cost**: < $0.003 per trade
- **Slippage Events**: < 1% of trades
- **Daily Trading Volume**: Target $100K+ (Month 1)

---

**Next Steps**: Review specification, begin smart contract development with mathematical formula implementation and comprehensive testing.
