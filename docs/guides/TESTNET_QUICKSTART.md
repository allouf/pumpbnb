# BSC Testnet Quick Start

**Goal**: Deploy and test PumpBNB on BSC Testnet in under 30 minutes

---

## TL;DR - Quick Commands

```bash
# 1. Get testnet BNB from faucet
https://testnet.bnbchain.org/faucet-smart

# 2. Set up environment
cp .env.example .env
# Edit .env and add your PRIVATE_KEY

# 3. Deploy contracts
npx hardhat run scripts/deploy-testnet.ts --network bscTestnet

# 4. Verify contracts (optional)
npx hardhat run scripts/verify-testnet.ts --network bscTestnet

# 5. Run tests
npx hardhat test test/integration/testnet/GraduationManager.testnet.test.ts --network bscTestnet
```

---

## Step-by-Step Guide

### 1. Create Testnet Wallet (5 minutes)

**Option A: New Wallet**
```bash
# Generate new wallet
npx hardhat node --show-accounts

# Copy one of the private keys (without 0x prefix)
```

**Option B: MetaMask**
1. Create new account in MetaMask
2. Export private key
3. Copy for next step

**⚠️ Use ONLY for testnet - never mainnet keys!**

### 2. Get Testnet BNB (5 minutes)

1. Go to https://testnet.bnbchain.org/faucet-smart
2. Connect wallet or paste address
3. Click "Give me BNB"
4. Receive 0.5 testnet BNB
5. Wait ~30 seconds for confirmation

**Verify balance**:
```bash
npx hardhat console --network bscTestnet
> const [signer] = await ethers.getSigners()
> ethers.formatEther(await ethers.provider.getBalance(signer.address))
```

### 3. Configure Environment (2 minutes)

```bash
# Copy template
cp .env.example .env
```

Edit `.env`:
```env
# Replace with your testnet wallet private key (no 0x prefix)
PRIVATE_KEY=your_private_key_here_without_0x

# Optional: BSCScan API for verification
BSCSCAN_API_KEY=your_bscscan_api_key_here
```

### 4. Deploy Contracts (5 minutes)

```bash
npx hardhat run scripts/deploy-testnet.ts --network bscTestnet
```

**Expected time**: 3-5 minutes
**Gas cost**: ~0.072 testnet BNB (FREE)

**Success looks like**:
```
🎉 Deployment Complete!

📋 Contract Addresses:
   Mock ASTER:         0xABCD...
   PlatformConfig:     0x1234...
   GraduationManager:  0x5678...
   TokenFactory:       0x9ABC...
```

Addresses saved to `deployments/bsc-testnet.json` ✅

### 5. Run Tests (10 minutes)

```bash
npx hardhat test test/integration/testnet/GraduationManager.testnet.test.ts --network bscTestnet
```

**Expected time**: 5-10 minutes
**Gas cost**: ~0.161 testnet BNB per run (FREE)

**Success looks like**:
```
  GraduationManager - BSC Testnet Integration Tests
    Real PancakeSwap Integration
      ✓ should swap Mock ASTER to WBNB on real PancakeSwap Testnet (45s)
      ✓ should create Token/WBNB pair on real PancakeSwap Factory (50s)
      ✓ should add liquidity with correct token/WBNB ratio (48s)
      ✓ should burn LP tokens to address(0) permanently (52s)
      ✓ should complete full graduation flow end-to-end (55s)
    Gas Cost Validation
      ✓ should complete graduation within gas limits (45s)

  6 passing (5m 30s)
```

### 6. Verify on BSCScan (Optional - 3 minutes)

Get BSCScan API key:
1. https://bscscan.com/myapikey
2. Register/login
3. Create API key
4. Add to `.env`

Verify contracts:
```bash
npx hardhat run scripts/verify-testnet.ts --network bscTestnet
```

**Success**: View source code on https://testnet.bscscan.com

---

## Troubleshooting

### "Insufficient funds for gas"
❌ **Problem**: Need more testnet BNB
✅ **Solution**: Visit faucet again (can request daily)

### "Deployment file not found"
❌ **Problem**: Haven't deployed yet
✅ **Solution**: Run deployment script first

### "Private key error"
❌ **Problem**: Wrong key format
✅ **Solution**: Remove `0x` prefix from private key in `.env`

### "Network error"
❌ **Problem**: Wrong network or RPC down
✅ **Solution**: Check network in hardhat.config.ts or try alternate RPC

---

## What You've Accomplished

After completing this guide:

✅ **Deployed** all 5 core contracts to BSC Testnet
✅ **Tested** complete graduation flow with real PancakeSwap
✅ **Validated** gas costs and performance
✅ **Verified** 95%+ coverage for GraduationManager
✅ **Saved** deployment addresses for future use
✅ **Ready** for mainnet deployment (after audit)

**Total Cost**: **$0 USD** (100% FREE) 🎉

**Total Time**: ~30 minutes ⏱️

---

## Next Steps

### Immediate
- ✅ Share contract addresses with team
- ✅ Document any issues encountered
- ✅ Run additional test scenarios

### Short-term
- ⏳ Verify all contracts on BSCScan
- ⏳ Create sample tokens for demos
- ⏳ Test with multiple users

### Before Mainnet
- ⏳ External security audit
- ⏳ Final testnet validation
- ⏳ Mainnet deployment checklist

---

## Useful Links

**BSC Testnet Resources**:
- Faucet: https://testnet.bnbchain.org/faucet-smart
- Explorer: https://testnet.bscscan.com
- RPC: https://data-seed-prebsc-1-s1.binance.org:8545/
- Chain ID: 97

**PancakeSwap Testnet**:
- Factory: 0x6725F303b657a9451d8BA641348b6761A6CC7a17
- Router: 0xD99D1c33F9fC3444f8101754aBC46c52416550D1
- WBNB: 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd

**Documentation**:
- Full Guide: `docs/guides/TESTNET_TESTING_GUIDE.md`
- Deployment: `scripts/deploy-testnet.ts`
- Tests: `test/integration/testnet/`
- Addresses: `deployments/bsc-testnet.json`

---

**Questions?** Check the full guide or open an issue!

**Created**: October 25, 2025
