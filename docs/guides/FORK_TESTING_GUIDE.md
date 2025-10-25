# BSC Mainnet Fork Testing Guide

**Purpose**: Test GraduationManager with real PancakeSwap and ASTER contracts
**Target Coverage**: 22.45% → 95%+ for GraduationManager

---

## Overview

Fork testing allows us to test against **real BSC mainnet contracts** without spending real money. This is essential for GraduationManager because 75% of its functions interact with immutable external contracts (PancakeSwap, ASTER) that cannot be mocked effectively.

### What Gets Tested

1. **ASTER → WBNB Swap** - Real PancakeSwap Router swap
2. **Pair Creation** - Real PancakeSwap Factory pair deployment
3. **Liquidity Addition** - Real liquidity pool interaction
4. **LP Token Burning** - Permanent liquidity lock verification
5. **Complete Graduation Flow** - End-to-end validation

---

## Prerequisites

### 1. RPC Provider

You need a BSC mainnet RPC endpoint. Options:

**Free (Rate Limited)**:
```bash
https://bsc-dataseed1.binance.org
https://bsc-dataseed2.binance.org
https://bsc-dataseed3.binance.org
```

**Paid (Recommended for Development)**:
- **Ankr**: https://www.ankr.com/rpc/bsc/
- **QuickNode**: https://www.quicknode.com/
- **Moralis**: https://moralis.io/
- **GetBlock**: https://getblock.io/

### 2. Environment Setup

Create `.env` file from template:
```bash
cp .env.example .env
```

Edit `.env` and add:
```env
# Enable fork testing
FORK_MAINNET=true

# BSC Mainnet RPC (use your provider)
BSC_MAINNET_RPC=https://bsc-dataseed1.binance.org

# Optional: Pin to specific block for consistency
# FORK_BLOCK_NUMBER=12345678
```

---

## Running Fork Tests

### Quick Start

```bash
# Run all fork tests
FORK_MAINNET=true npx hardhat test test/integration/GraduationManager.fork.test.ts

# Or set in .env and run
npx hardhat test test/integration/GraduationManager.fork.test.ts
```

### With Specific Block

Pin to a specific block for reproducible tests:

```bash
FORK_MAINNET=true FORK_BLOCK_NUMBER=35000000 npx hardhat test test/integration/GraduationManager.fork.test.ts
```

### With Gas Reporting

```bash
FORK_MAINNET=true REPORT_GAS=true npx hardhat test test/integration/GraduationManager.fork.test.ts
```

---

## Test Suites

### 1. ASTER to WBNB Swap (2 tests)

**Tests**:
- Real PancakeSwap Router swap execution
- Swap quote accuracy validation

**What's Validated**:
- ASTER tokens converted to WBNB
- Swap amounts match expectations
- PancakeSwap quote API works

**Example Output**:
```
✓ should swap ASTER to WBNB using real PancakeSwap
  Swapped 100 ASTER for 0.456 WBNB
✓ should get accurate swap quote from PancakeSwap
  100 ASTER → 0.456 WBNB (quote)
```

### 2. PancakeSwap Pair Creation (2 tests)

**Tests**:
- Token/WBNB pair creation on Factory
- Pair address verification

**What's Validated**:
- Pair contract deployed correctly
- Pair is a valid PancakeSwap LP token
- Factory returns correct address

**Example Output**:
```
✓ should create Token/WBNB pair on real PancakeSwap Factory
  Created PancakeSwap pair at: 0x1234...
✓ should return correct pair address from factory
  Pair total supply: 100.0 LP tokens
```

### 3. Liquidity Addition (2 tests)

**Tests**:
- Token/WBNB ratio correctness
- Complete token transfer to pool

**What's Validated**:
- Liquidity added with correct ratio
- All bonding curve tokens transferred
- Pair has non-zero reserves

**Example Output**:
```
✓ should add liquidity with correct token/WBNB ratio
  Liquidity added: 500000 tokens, 0.5 WBNB
✓ should transfer all remaining tokens to liquidity pool
  Transferred 500000 tokens to LP
```

### 4. LP Token Burning (2 tests)

**Tests**:
- LP tokens burned to address(0)
- Liquidity permanently locked

**What's Validated**:
- LP tokens sent to zero address
- GraduationManager holds no LP tokens
- Liquidity is permanently locked

**Example Output**:
```
✓ should burn LP tokens to address(0) for permanent lock
  Burned 99.999 LP tokens (permanently locked)
✓ should make liquidity permanently locked (unretrievable)
  Total LP: 100.0, Burned: 99.999
```

### 5. Complete Graduation Flow (3 tests)

**Tests**:
- End-to-end graduation process
- Exact threshold handling
- Event emissions

**What's Validated**:
- All graduation steps execute correctly
- Bonding curve marked as graduated
- Creator allocation unlocked
- All events emitted

**Example Output**:
```
✓ should execute complete end-to-end graduation successfully
  ✅ Complete Graduation Flow Verified:
    - Gas used: 2,450,000
    - Pair created: 0x5678...
    - Liquidity: 500000 tokens
    - LP burned: 99.999
    - Creator received: 200000 tokens
```

### 6. Gas Costs (1 test)

**Tests**:
- Graduation within 3M gas target

**What's Validated**:
- Total gas cost acceptable
- Within project requirements

**Example Output**:
```
✓ should complete graduation within 3M gas target
  Graduation gas used: 2,450,000 (target: 3,000,000)
```

---

## Troubleshooting

### Issue: "Cannot find ASTER whale address"

**Problem**: The ASTER_WHALE address in the test doesn't have ASTER tokens

**Solutions**:
1. Find a current ASTER holder on BSCScan
2. Update ASTER_WHALE constant in test file
3. Or use a different approach to get ASTER (see below)

**Alternative ASTER Setup**:
```typescript
// Instead of whale transfer, use storage manipulation
await network.provider.send("hardhat_setStorageAt", [
  ASTER_ADDRESS,
  ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256"],
      [await owner.getAddress(), 0]
    )
  ),
  ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256"],
    [ethers.parseEther("10000")]
  ),
]);
```

### Issue: "RPC rate limit exceeded"

**Problem**: Free RPC providers have strict rate limits

**Solutions**:
1. Use paid RPC provider (Ankr, QuickNode, etc.)
2. Add delays between tests
3. Run fewer tests at once
4. Pin to specific block to use cached state

### Issue: "Fork tests taking too long"

**Problem**: Forking downloads chain state which is slow

**Solutions**:
1. **Use block pinning** - Hardhat caches forked state
   ```env
   FORK_BLOCK_NUMBER=35000000
   ```
2. **Run specific test suites**:
   ```bash
   npx hardhat test --grep "ASTER to WBNB"
   ```
3. **Increase timeout** in hardhat.config.ts:
   ```typescript
   mocha: {
     timeout: 300000, // 5 minutes
   }
   ```

### Issue: "Pair already exists"

**Problem**: Tests create pairs that persist in fork

**Solutions**:
1. Create new tokens in `beforeEach` (already implemented)
2. Reset fork between tests:
   ```typescript
   await network.provider.request({
     method: "hardhat_reset",
     params: [{
       forking: {
         jsonRpcUrl: process.env.BSC_MAINNET_RPC,
         blockNumber: 35000000,
       },
     }],
   });
   ```

### Issue: "Insufficient funds for gas"

**Problem**: Test accounts don't have BNB for gas

**Solutions**:
Already handled in test setup:
```typescript
// Fund test accounts with BNB
await owner.sendTransaction({
  to: ASTER_WHALE,
  value: ethers.parseEther("10"),
});
```

---

## Best Practices

### 1. Use Block Pinning

Always pin to a recent block for:
- Faster test execution (caching)
- Reproducible results
- Consistent state

```env
FORK_BLOCK_NUMBER=35000000
```

Update block number monthly to stay current.

### 2. Separate Fork Tests

Keep fork tests separate from unit tests:
- Different execution speed
- Different resource requirements
- Different CI/CD strategy

Current structure:
```
test/
├── *.test.ts              # Unit tests (fast)
├── integration/
│   ├── *.test.ts          # Integration tests (medium)
│   └── *.fork.test.ts     # Fork tests (slow)
```

### 3. Skip in CI by Default

Fork tests are slow and require RPC access:

```typescript
before(async function () {
  if (!process.env.FORK_MAINNET) {
    this.skip();
  }
});
```

Run manually or in dedicated CI job.

### 4. Monitor RPC Usage

Free RPC limits:
- BSC Dataseed: ~20 requests/second
- Ankr Free: ~30 requests/second

For heavy testing, use paid tier.

---

## Coverage Impact

### Before Fork Tests
```
GraduationManager.sol: 22.45% coverage
- Testable functions: 100% covered
- Immutable external calls: 0% covered
```

### After Fork Tests
```
GraduationManager.sol: 95%+ coverage
- All functions: 95%+ covered
- Real contract interactions: Validated ✅
```

### Overall Project Coverage
```
Before: 58.52%
After:  80%+ (estimated)
```

---

## Running in CI/CD

### GitHub Actions Example

```yaml
name: Fork Tests

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  workflow_dispatch:  # Manual trigger

jobs:
  fork-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install

      - name: Run Fork Tests
        env:
          FORK_MAINNET: true
          BSC_MAINNET_RPC: ${{ secrets.BSC_MAINNET_RPC }}
          FORK_BLOCK_NUMBER: 35000000
        run: npx hardhat test test/integration/GraduationManager.fork.test.ts
```

### Local CI Testing

```bash
# Simulate CI environment
docker run -it \
  -e FORK_MAINNET=true \
  -e BSC_MAINNET_RPC=$BSC_MAINNET_RPC \
  -v $(pwd):/app \
  -w /app \
  node:18 \
  npx hardhat test test/integration/GraduationManager.fork.test.ts
```

---

## Cost Analysis

### RPC Requests per Test Run

Approximate requests for full fork test suite:
- Initial fork setup: ~50 requests
- Per test: ~20-50 requests
- Total for 12 tests: ~500-1000 requests

### Pricing

**Free Tier**: Usually sufficient for development
**Paid Tier** ($50-100/month):
- Needed for: Heavy testing, CI/CD
- Benefits: Higher limits, faster responses, support

---

## Maintenance

### Monthly Updates

1. **Update block number** in .env.example
2. **Verify ASTER_WHALE** still has tokens
3. **Run full test suite** to catch any mainnet changes
4. **Update docs** if PancakeSwap upgrades to V3

### PancakeSwap V3 Migration

If PancakeSwap upgrades to V3:
1. Update contract addresses in Constants.sol
2. Update interface contracts (IPancake*)
3. Update fork tests for V3 functions
4. Test migration thoroughly

---

## Security Considerations

### Safe Practices

✅ **Use forked network** - Never test on mainnet
✅ **No real funds** - Fork uses simulated funds
✅ **Read-only operations** - Cannot affect mainnet
✅ **Separate RPC keys** - Use dedicated API keys for testing

### What's Safe

- Impersonating accounts (hardhat_impersonateAccount)
- Modifying storage (hardhat_setStorageAt)
- Advancing time (evm_increaseTime)
- Creating transactions

### What Affects Mainnet

**NOTHING** - Fork is completely isolated simulation.

---

## Summary

Fork testing is **essential** for GraduationManager because:

1. **Real Contract Validation** - Tests actual PancakeSwap behavior
2. **Coverage Improvement** - 22.45% → 95%+ coverage
3. **Production Confidence** - Validates against real DEX
4. **No Mocking Complexity** - Uses actual contracts
5. **Accurate Gas Costs** - Real-world gas measurements

**Cost**: Minimal (free RPC usually sufficient)
**Time**: ~2-3 minutes per full run
**Value**: CRITICAL for mainnet readiness

---

## Next Steps

1. ✅ Run fork tests locally
2. ✅ Verify all tests pass
3. ✅ Check coverage improvement
4. ⏳ Add to CI/CD pipeline
5. ⏳ Update before each release

---

**Created**: October 25, 2025
**Last Updated**: October 25, 2025
**Maintained By**: Development Team
