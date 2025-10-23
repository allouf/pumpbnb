# PumpBNB - ASTER-Based Meme Coin Launchpad

A BNB Chain-based meme coin launchpad with automated bonding curves and PancakeSwap integration.

## 🚀 Project Status

**Current Phase**: Phase 3 - Unit Testing  
**Smart Contracts**: ✅ Complete  
**Testing**: 🔄 In Progress  

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for detailed tracking.

## 🎯 Key Features

- **FREE Token Creation** - No fees, only gas costs
- **ASTER-Based Trading** - Trade with ASTER during bonding curve
- **Auto-Graduation** - Migrates to PancakeSwap at 100 ASTER
- **Low Fees** - 1% bonding curve, 0.3% post-graduation
- **Gas Optimized** - <200K per trade, <3.2M creation

## 📊 Smart Contracts

| Contract | Size | Purpose |
|----------|------|---------|
| TokenFactory | 19.0 KiB | Create2 factory deployment |
| BondingCurve | 5.2 KiB | ASTER AMM (x*y=k) |
| GraduationManager | 6.3 KiB | PancakeSwap migration |
| PumpToken | 3.0 KiB | BEP-20 with vesting |
| PlatformConfig | 2.9 KiB | Configuration |

All compiled successfully with Solidity 0.8.20 + OpenZeppelin 5.4.0 ✅

## 🛠️ Quick Start

```bash
# Install
npm install

# Compile
npx hardhat compile

# Test (Phase 3)
npx hardhat test
```

## 📁 Structure

```
contracts/              Smart contracts
test/                   Tests (Phase 3)
agent-os/specs/         Specifications
CLAUDE.md               Project guidance
IMPLEMENTATION_STATUS.md Progress tracking
```

## 🔒 Security

- ✅ ReentrancyGuard
- ✅ AccessControl  
- ✅ Pausable
- 🔄 Testing in progress
- ⏳ Audits pending

## 📚 Documentation

- [CLAUDE.md](./CLAUDE.md) - Architecture overview
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Progress
- [Specification](./agent-os/specs/2025-10-13-core-smart-contracts/spec.md) - Full spec

## ⚠️ Disclaimer

Development software. Not audited. Do not use with real funds.

---

**For detailed information, see [CLAUDE.md](./CLAUDE.md) and [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)**
