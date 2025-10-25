# Mythril Setup Guide for WSL (Windows Subsystem for Linux)

**Date**: October 24, 2025
**Target**: Run Mythril static analysis on PumpBNB smart contracts
**Environment**: Windows with WSL2 installed

---

## Prerequisites

- ✅ Windows 10/11 with WSL installed
- ✅ WSL2 (recommended for better performance)
- ✅ Project files accessible from Windows (F:\BNB_PumpFun)

---

## Step 1: Access WSL Terminal

Open Command Prompt or PowerShell and type:

```bash
wsl
```

This will open your default WSL distribution (likely Ubuntu).

---

## Step 2: Navigate to Your Project

From WSL, Windows drives are mounted under `/mnt/`. Navigate to your project:

```bash
cd /mnt/f/BNB_PumpFun
```

**Verify you're in the right place**:
```bash
ls -la
# You should see: contracts/, test/, hardhat.config.ts, etc.
```

---

## Step 3: Install Python and pip (if not already installed)

Check if Python 3 and pip are installed:

```bash
python3 --version
pip3 --version
```

If not installed, install them:

```bash
sudo apt update
sudo apt install python3 python3-pip -y
```

---

## Step 4: Install Mythril

Install Mythril using pip:

```bash
pip3 install mythril
```

**Add Mythril to PATH** (if needed):

```bash
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

**Verify installation**:

```bash
myth version
```

You should see output like:
```
Mythril version v0.24.8
```

---

## Step 5: Install Solidity Compiler

Mythril needs the Solidity compiler. Install solc-select to manage Solidity versions:

```bash
pip3 install solc-select
```

**Install Solidity 0.8.20** (matching your project):

```bash
solc-select install 0.8.20
solc-select use 0.8.20
```

**Verify**:

```bash
solc --version
```

Should show: `Version: 0.8.20`

---

## Step 6: Run Mythril on Individual Contracts

### Analyze BondingCurve.sol

```bash
myth analyze contracts/BondingCurve.sol --solc-json artifacts/build-info/*.json
```

### Analyze PlatformConfig.sol

```bash
myth analyze contracts/PlatformConfig.sol --solc-json artifacts/build-info/*.json
```

### Analyze PumpToken.sol

```bash
myth analyze contracts/PumpToken.sol --solc-json artifacts/build-info/*.json
```

### Analyze TokenFactory.sol

```bash
myth analyze contracts/TokenFactory.sol --solc-json artifacts/build-info/*.json
```

### Analyze GraduationManager.sol

```bash
myth analyze contracts/GraduationManager.sol --solc-json artifacts/build-info/*.json
```

---

## Step 7: Alternative - Analyze with Remappings

If the above fails due to import path issues, create a `remappings.txt`:

```bash
echo "@openzeppelin/=node_modules/@openzeppelin/" > remappings.txt
```

Then analyze:

```bash
myth analyze contracts/BondingCurve.sol \
  --solc-json artifacts/build-info/*.json \
  --solc-args="--allow-paths $(pwd)"
```

---

## Step 8: Comprehensive Analysis Script

Create a script to analyze all contracts:

```bash
nano analyze_all.sh
```

Paste this content:

```bash
#!/bin/bash

echo "==================================="
echo "Mythril Security Analysis"
echo "PumpBNB Smart Contracts"
echo "==================================="
echo ""

CONTRACTS=(
  "BondingCurve"
  "PlatformConfig"
  "PumpToken"
  "TokenFactory"
  "GraduationManager"
)

for contract in "${CONTRACTS[@]}"; do
  echo "Analyzing $contract.sol..."
  echo "-----------------------------------"

  myth analyze "contracts/$contract.sol" \
    --solc-json artifacts/build-info/*.json \
    --execution-timeout 300 \
    > "mythril-$contract-report.txt" 2>&1

  echo "Results saved to: mythril-$contract-report.txt"
  echo ""
done

echo "==================================="
echo "Analysis Complete!"
echo "==================================="
echo ""
echo "Review report files:"
for contract in "${CONTRACTS[@]}"; do
  echo "  - mythril-$contract-report.txt"
done
```

**Make it executable**:

```bash
chmod +x analyze_all.sh
```

**Run it**:

```bash
./analyze_all.sh
```

---

## Step 9: Review Results

Mythril outputs will show:

- **Issues Found**: Critical, High, Medium, Low severity
- **Line Numbers**: Exact locations in code
- **Issue Descriptions**: What vulnerability was detected
- **Confidence**: How confident Mythril is about the finding

**Check results**:

```bash
cat mythril-BondingCurve-report.txt
```

**Look for sections like**:

```
==== Integer Arithmetic Bugs ====
SWC ID: 101
Severity: High
Contract: BondingCurve
Function name: buyWithAster(uint256,uint256)
PC address: 1234
Estimated Gas Usage: 5000
...
```

---

## Step 10: Common Mythril Flags

### Basic Analysis
```bash
myth analyze contracts/BondingCurve.sol
```

### With Execution Timeout (prevent hangs)
```bash
myth analyze contracts/BondingCurve.sol --execution-timeout 300
```

### Max Transaction Depth (for complex flows)
```bash
myth analyze contracts/BondingCurve.sol --max-depth 20
```

### Verbose Output
```bash
myth analyze contracts/BondingCurve.sol -v 3
```

### Only Specific Modules
```bash
myth analyze contracts/BondingCurve.sol --modules reentrancy,integer
```

### Output to JSON
```bash
myth analyze contracts/BondingCurve.sol --json > mythril-report.json
```

---

## Step 11: Interpret Results

### Severity Levels

| Severity | Description | Action Required |
|----------|-------------|-----------------|
| **Critical** | Exploitable vulnerability, immediate risk | Fix immediately |
| **High** | Likely exploitable, significant risk | Fix before audit |
| **Medium** | Potential vulnerability, moderate risk | Review and fix |
| **Low** | Unlikely to be exploited, minor risk | Consider fixing |
| **Informational** | Code quality or gas optimization | Optional improvement |

### Common False Positives

1. **Integer Overflow** - Solidity 0.8.20+ has built-in protection
2. **Unchecked Low-Level Calls** - May be using SafeERC20
3. **Delegatecall** - If not using proxy patterns, can ignore

### Real Issues to Address

1. **Reentrancy** - Should be protected by ReentrancyGuard
2. **Access Control Bypass** - Verify role checks
3. **Timestamp Dependence** - Review if using block.timestamp
4. **Unprotected Self-Destruct** - Should not have selfdestruct
5. **Transaction Ordering Dependence** - Review MEV risks

---

## Step 12: Save Results to Windows

Copy Mythril reports back to Windows filesystem:

```bash
cp mythril-*.txt /mnt/f/BNB_PumpFun/mythril-reports/
```

---

## Troubleshooting

### Error: "solc not found"

```bash
pip3 install solc-select
solc-select install 0.8.20
solc-select use 0.8.20
```

### Error: "Module import error"

Make sure you're in the project root:

```bash
cd /mnt/f/BNB_PumpFun
pwd  # Should show: /mnt/f/BNB_PumpFun
```

### Error: "Timeout"

Increase timeout or reduce depth:

```bash
myth analyze contracts/BondingCurve.sol \
  --execution-timeout 600 \
  --max-depth 10
```

### Error: "Out of memory"

Mythril is memory-intensive. Close other applications or use a simpler contract first.

### Error: "Permission denied"

Add sudo:

```bash
sudo pip3 install mythril
```

---

## Example Full Analysis Session

```bash
# 1. Navigate to project
cd /mnt/f/BNB_PumpFun

# 2. Verify environment
python3 --version
solc --version
myth version

# 3. Analyze BondingCurve
myth analyze contracts/BondingCurve.sol \
  --execution-timeout 300 \
  --max-depth 15 \
  -v 2 \
  > mythril-BondingCurve-full.txt 2>&1

# 4. Check for critical issues
grep -i "critical\|high" mythril-BondingCurve-full.txt

# 5. Review full report
less mythril-BondingCurve-full.txt

# 6. Copy to Windows
mkdir -p mythril-reports
cp mythril-*.txt mythril-reports/
```

---

## Expected Analysis Time

| Contract | Lines of Code | Estimated Time | Complexity |
|----------|---------------|----------------|------------|
| PlatformConfig | ~150 | 2-5 minutes | Low |
| PumpToken | ~100 | 1-3 minutes | Low |
| BondingCurve | ~350 | 10-20 minutes | High |
| GraduationManager | ~280 | 10-20 minutes | High |
| TokenFactory | ~200 | 5-10 minutes | Medium |

**Total Expected Time**: 30-60 minutes for all contracts

---

## What to Document

After running Mythril, create a summary document including:

1. **Issues Found**:
   - Severity breakdown
   - Issue descriptions
   - Affected contracts and line numbers

2. **False Positives Identified**:
   - Why they're false positives
   - What protections are already in place

3. **Action Items**:
   - Critical/High issues to fix
   - Medium issues to review
   - Low/Info issues for consideration

4. **Comparison with Slither**:
   - Issues found by both tools (high confidence)
   - Issues unique to Mythril
   - Issues unique to Slither

---

## Quick Start Commands

Copy and paste these commands in WSL:

```bash
# Setup
cd /mnt/f/BNB_PumpFun
pip3 install mythril solc-select
solc-select install 0.8.20
solc-select use 0.8.20

# Analyze all contracts
for contract in BondingCurve PlatformConfig PumpToken TokenFactory GraduationManager; do
  echo "Analyzing $contract..."
  myth analyze "contracts/$contract.sol" --execution-timeout 300 > "mythril-$contract.txt" 2>&1
done

# Check for critical issues
echo "Critical and High Severity Issues:"
grep -i "critical\|high" mythril-*.txt

# Copy reports
mkdir -p mythril-reports
cp mythril-*.txt mythril-reports/
```

---

## Post-Analysis Next Steps

1. ✅ Review all Mythril reports
2. ✅ Document findings in `SECURITY_AUDIT_REPORT.md`
3. ✅ Address Critical and High severity issues
4. ✅ Compare with Slither results
5. ✅ Update `PHASE_4_PROGRESS_SUMMARY.md` with Mythril completion
6. ✅ Prepare comprehensive security report for external auditors

---

## Help Resources

- **Mythril Documentation**: https://mythril-classic.readthedocs.io/
- **SWC Registry** (vulnerability classifications): https://swcregistry.io/
- **Mythril GitHub**: https://github.com/ConsenSys/mythril

---

**Guide Created**: October 24, 2025
**Ready to Execute**: Yes
**Estimated Completion**: 1 hour (setup + analysis + documentation)

