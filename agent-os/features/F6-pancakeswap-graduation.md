# F6: PancakeSwap Graduation

**Feature ID**: F6
**Priority**: Critical (Must-Have)
**Phase**: 1 - Core Platform (MVP)
**Dependencies**: F3 (Bonding Curve Trading)
**Status**: Specification

---

## Overview

Automatic migration of tokens from bonding curve to PancakeSwap DEX when market cap reaches $100,000. Liquidity is extracted from the bonding curve and added to a PancakeSwap pair, enabling broader trading access and price discovery.

### User Value
- **Automatic Process**: Zero user intervention required
- **Price Continuity**: Seamless transition with minimal price impact
- **Enhanced Liquidity**: Access to PancakeSwap's larger liquidity pool
- **DEX Ecosystem**: Integration with aggregators and advanced trading tools

---

## User Stories

### As a token creator
- I want my token to automatically graduate to PancakeSwap when successful
- I want my locked creator allocation (20%) to unlock upon graduation
- I want to receive LP tokens representing my share of liquidity

### As a token holder
- I want graduation to happen automatically without needing to do anything
- I want to continue trading on PancakeSwap after graduation
- I want the graduation process to be transparent

### As a trader
- I want to know when a token is close to graduation
- I want to be notified when graduation occurs
- I want to see the PancakeSwap pair link immediately

---

## Technical Requirements

### Smart Contract: GraduationManager.sol

#### Graduation Threshold
```solidity
uint256 public constant GRADUATION_THRESHOLD = 100_000 ether; // $100,000 in BNB
// At current BNB price ($1,251.49), this is approximately 80 BNB
```

#### Core Functions

```solidity
contract GraduationManager {
    // Check if token is ready to graduate
    function checkGraduation(address tokenAddress)
        external view returns (bool);

    // Execute graduation process
    function graduate(address tokenAddress)
        external returns (address pairAddress);

    // Create PancakeSwap pair
    function createPair(address tokenAddress)
        internal returns (address);

    // Add liquidity to PancakeSwap
    function addLiquidity(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 bnbAmount
    ) internal returns (uint256 liquidity);

    // Distribute LP tokens
    function distributeLPTokens(
        address tokenAddress,
        address creator,
        uint256 lpTokens
    ) internal;
}
```

---

## Graduation Process Flow

### Automatic Graduation (5 Steps)

```
Step 1: Threshold Check
   - Monitor bonding curve market cap
   - When >= $100,000, trigger graduation
   ↓
Step 2: Pause Trading
   - Pause bonding curve buy/sell
   - Prevent price changes during migration
   ↓
Step 3: Extract Liquidity
   - Calculate BNB in bonding curve
   - Calculate tokens in bonding curve
   - Transfer to GraduationManager
   ↓
Step 4: Create PancakeSwap Pair
   - Call PancakeSwap factory.createPair()
   - Add liquidity: BNB + Tokens
   - Receive LP tokens
   ↓
Step 5: Finalize
   - Unlock creator's 20% allocation
   - Distribute LP tokens (to creator or burn)
   - Update token status to "graduated"
   - Emit GraduationComplete event
   ↓
Result: Token now trades on PancakeSwap!
```

### Graduation Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Graduation Threshold** | $100,000 market cap | ~80 BNB raised |
| **BNB to Add** | All BNB from bonding curve | ~80-90 BNB |
| **Tokens to Add** | Remaining bonding curve supply | ~200M-400M tokens |
| **LP Token Distribution** | 100% burned or 50/50 creator/burn | TBD by governance |
| **Creator Unlock** | 200M tokens (20% supply) | Immediate unlock |

---

## Liquidity Calculation

### Example Graduation Scenario

```typescript
// At graduation threshold:
const marketCap = 100_000; // $100,000
const bnbRaised = 80; // BNB
const tokensSold = 800_000_000; // 800M tokens sold
const tokensRemaining = 200_000_000; // 200M tokens left in curve

// Current bonding curve price
const currentPrice = marketCap / (tokensSold + tokensRemaining);
// = $100,000 / 1,000,000,000 = $0.0001 per token

// Liquidity to add to PancakeSwap:
const bnbForLP = bnbRaised; // 80 BNB
const tokensForLP = tokensRemaining; // 200M tokens

// Expected PancakeSwap price (should match bonding curve)
const pancakeswapPrice = bnbForLP / tokensForLP;
// = 80 BNB / 200M tokens = 0.0000004 BNB per token
```

### Price Continuity Verification

```solidity
function _verifyPriceContinuity(
    uint256 bondingCurvePrice,
    uint256 pancakeswapPrice
) internal pure {
    uint256 deviation = bondingCurvePrice > pancakeswapPrice
        ? bondingCurvePrice - pancakeswapPrice
        : pancakeswapPrice - bondingCurvePrice;

    uint256 maxDeviation = bondingCurvePrice / 100; // 1% max

    require(
        deviation <= maxDeviation,
        "Price deviation too high"
    );
}
```

---

## Smart Contract Implementation

### Integration with PancakeSwap

```solidity
import "@pancakeswap/v2-core/contracts/interfaces/IPancakeFactory.sol";
import "@pancakeswap/v2-core/contracts/interfaces/IPancakePair.sol";
import "@pancakeswap/v2-periphery/contracts/interfaces/IPancakeRouter02.sol";

contract GraduationManager {
    IPancakeFactory public immutable pancakeFactory;
    IPancakeRouter02 public immutable pancakeRouter;

    constructor(address _factory, address _router) {
        pancakeFactory = IPancakeFactory(_factory);
        pancakeRouter = IPancakeRouter02(_router);
    }

    function graduate(address tokenAddress) external returns (address) {
        require(checkGraduation(tokenAddress), "Not ready to graduate");

        // 1. Pause bonding curve
        IBondingCurve(bondingCurve).pause();

        // 2. Extract liquidity
        (uint256 bnb, uint256 tokens) = _extractLiquidity(tokenAddress);

        // 3. Create pair
        address pair = pancakeFactory.createPair(
            tokenAddress,
            pancakeRouter.WETH()
        );

        // 4. Add liquidity
        uint256 lpTokens = _addLiquidity(tokenAddress, bnb, tokens);

        // 5. Handle LP tokens (burn or distribute)
        _handleLPTokens(pair, lpTokens, tokenAddress);

        // 6. Unlock creator allocation
        IMemeToken(tokenAddress).unlockCreatorAllocation();

        // 7. Update status
        IMemeToken(tokenAddress).markGraduated(pair);

        emit TokenGraduated(tokenAddress, pair, bnb, tokens);

        return pair;
    }

    function _addLiquidity(
        address token,
        uint256 bnbAmount,
        uint256 tokenAmount
    ) internal returns (uint256 liquidity) {
        // Approve router
        IERC20(token).approve(address(pancakeRouter), tokenAmount);

        // Add liquidity
        (, , liquidity) = pancakeRouter.addLiquidityETH{value: bnbAmount}(
            token,
            tokenAmount,
            tokenAmount * 95 / 100, // 5% slippage tolerance
            bnbAmount * 95 / 100,
            address(this),
            block.timestamp + 300 // 5 min deadline
        );
    }
}
```

---

## Gas Cost Analysis

| Operation | Gas Units | Cost (5 Gwei) | Notes |
|-----------|-----------|---------------|-------|
| **Create Pair** | ~1,000,000 | $0.013 | PancakeSwap factory call |
| **Add Liquidity** | ~1,500,000 | $0.019 | Router + pair operations |
| **LP Distribution** | ~100,000 | $0.001 | Transfer or burn |
| **Status Update** | ~50,000 | $0.0006 | Storage writes |
| **Total** | **~2,650,000** | **$0.034** | Platform absorbs cost |

---

## Backend Implementation

### Graduation Monitoring Service

```typescript
// Cron job running every 1 minute
async function checkGraduations() {
  // Get tokens close to graduation (>= 95% of threshold)
  const candidates = await db.query(`
    SELECT token_address, market_cap
    FROM token_metrics
    WHERE graduated = false
    AND market_cap >= $1
    AND market_cap < $2
    ORDER BY market_cap DESC
  `, [THRESHOLD * 0.95, THRESHOLD * 2]);

  for (const token of candidates) {
    const onChainMarketCap = await getMarketCapFromChain(token.address);

    if (onChainMarketCap >= GRADUATION_THRESHOLD) {
      await executeGraduation(token.address);
    }
  }
}

async function executeGraduation(tokenAddress: string) {
  try {
    // Call graduation contract
    const tx = await graduationManager.graduate(tokenAddress);
    await tx.wait();

    // Update database
    await db.query(`
      UPDATE tokens
      SET graduated = true, graduation_tx = $1, pancakeswap_pair = $2
      WHERE address = $3
    `, [tx.hash, pairAddress, tokenAddress]);

    // Notify users
    await notifyGraduation(tokenAddress);

    // Update feed
    await updateFeed(tokenAddress, 'graduated');

  } catch (error) {
    console.error(`Graduation failed for ${tokenAddress}:`, error);
    await alertAdmin(tokenAddress, error);
  }
}
```

### Graduation Events

```typescript
// Listen for graduation events
graduationManager.on('TokenGraduated', async (
  tokenAddress,
  pairAddress,
  bnbAmount,
  tokenAmount
) => {
  // Update database
  // Send notifications
  // Update analytics
});
```

---

## User Interface

### Graduation Progress Bar (in Token Page)

```
┌────────────────────────────────────────┐
│  GRADUATION PROGRESS                   │
├────────────────────────────────────────┤
│  Market Cap: $85,234 / $100,000        │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░ 85.2%            │
│                                         │
│  BNB Raised: 68 / 80 BNB               │
│  Only $14,766 to go!                   │
│                                         │
│  🎯 This token is close to graduation! │
└────────────────────────────────────────┘
```

### Graduation Notification

```
🎉 TOKEN GRADUATED!

$DOGK has graduated to PancakeSwap!

Market Cap: $100,234
Trading Volume: $12,456
PancakeSwap Pair: 0xabcd...ef12

[Trade on PancakeSwap] [View Analytics]
```

---

## Acceptance Criteria

### Must Have
- [ ] Graduation triggers automatically at $100K market cap
- [ ] Bonding curve pauses during graduation
- [ ] Liquidity migrates to PancakeSwap correctly
- [ ] Price continuity maintained (< 1% deviation)
- [ ] Creator's 20% allocation unlocks
- [ ] Gas cost < $0.05 (platform pays)
- [ ] Database updates correctly
- [ ] Users notified of graduation

### Should Have
- [ ] Graduation progress bar shows % to threshold
- [ ] Email/push notifications for token owners
- [ ] Graduation countdown when > 90%
- [ ] Historical graduation data

### Nice to Have
- [ ] Graduation ceremony animation
- [ ] Social media auto-post on graduation
- [ ] Leaderboard of fastest graduations
- [ ] NFT badge for tokens that graduate

---

## Testing Requirements

### Smart Contract Tests
- [ ] Graduation executes at exact threshold
- [ ] Cannot graduate twice
- [ ] Liquidity calculations correct
- [ ] LP tokens distributed properly
- [ ] Creator allocation unlocks
- [ ] Price continuity verified
- [ ] Reversion if PancakeSwap call fails

### Integration Tests
- [ ] End-to-end graduation flow
- [ ] Monitoring service detects threshold
- [ ] Database sync with blockchain
- [ ] Notifications sent correctly
- [ ] Feed updates in real-time

---

## Security Considerations

### Reentrancy Protection
```solidity
modifier nonReentrant() {
    require(!_locked, "No reentrancy");
    _locked = true;
    _;
    _locked = false;
}
```

### Access Controls
```solidity
// Only bonding curve can trigger graduation
modifier onlyBondingCurve() {
    require(msg.sender == bondingCurve, "Unauthorized");
    _;
}
```

### Emergency Pause
```solidity
// Admin can pause graduations in emergency
function pauseGraduations() external onlyOwner {
    graduationsPaused = true;
}
```

---

## Implementation Checklist

### Week 1: Smart Contract
- [ ] Write GraduationManager.sol
- [ ] PancakeSwap integration
- [ ] Liquidity extraction logic
- [ ] LP token handling
- [ ] Unit tests

### Week 2: Monitoring Service
- [ ] Cron job for threshold checking
- [ ] Graduation execution service
- [ ] Error handling and retries
- [ ] Admin alerts

### Week 3: Frontend
- [ ] Progress bar component
- [ ] Graduation notification UI
- [ ] PancakeSwap link integration
- [ ] Real-time updates

### Week 4: Testing & Launch
- [ ] End-to-end testing
- [ ] Testnet graduation
- [ ] Security review
- [ ] Documentation

---

## Success Metrics

- **Graduation Success Rate**: 100%
- **Price Deviation**: < 1% from bonding curve
- **Execution Time**: < 30 seconds
- **User Satisfaction**: > 90% positive feedback
- **Gas Cost**: < $0.05 per graduation

---

**Next Steps**: Review specification, begin smart contract development with PancakeSwap integration.
