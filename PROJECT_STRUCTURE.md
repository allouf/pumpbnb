# PumpBNB Project Structure

**Last Updated**: October 25, 2025
**Status**: Organized and Clean ✅

---

## Directory Structure

```
PumpBNB/
├── .claude/                    # Claude Code configuration
│   ├── agents/                 # Custom agent definitions
│   └── settings.local.json     # Local settings
│
├── agent-os/                   # Agent OS framework
│   ├── product/                # Product planning docs
│   │   ├── mission.md
│   │   ├── roadmap.md
│   │   └── tech-stack.md
│   ├── roles/                  # Agent role definitions
│   │   ├── implementers.yml
│   │   └── verifiers.yml
│   └── specs/                  # Technical specifications
│       └── 2025-10-13-core-smart-contracts/
│           ├── spec.md
│           ├── tasks.md
│           ├── planning/
│           ├── implementation/
│           └── verification/
│
├── contracts/                  # Smart contracts (SOLIDITY)
│   ├── BondingCurve.sol
│   ├── Constants.sol
│   ├── GraduationManager.sol
│   ├── PlatformConfig.sol
│   ├── PumpToken.sol
│   ├── TokenFactory.sol
│   ├── interfaces/             # External contract interfaces
│   │   ├── IASTER.sol
│   │   ├── IPancakeFactory.sol
│   │   ├── IPancakeRouter.sol
│   │   └── IWBNB.sol
│   ├── mocks/                  # Mock contracts for testing
│   │   ├── MockERC20.sol
│   │   ├── MockPancakeFactory.sol
│   │   ├── MockPancakePair.sol
│   │   └── MockPancakeRouter.sol
│   └── test/                   # Test utility contracts
│       └── MaliciousContracts.sol
│
├── test/                       # Test suites (TYPESCRIPT)
│   ├── PlatformConfig.test.ts
│   ├── PumpToken.test.ts
│   ├── BondingCurve.test.ts
│   ├── GraduationManager.test.ts
│   ├── TokenFactory.test.ts
│   ├── integration/            # Integration tests
│   │   ├── TokenLifecycle.test.ts
│   │   ├── PancakeSwapIntegration.test.ts
│   │   └── GraduationManager.integration.test.ts
│   ├── fuzz/                   # Fuzz testing
│   │   └── BondingCurveFuzz.test.ts
│   ├── gas/                    # Gas benchmarking
│   │   └── GasBenchmarks.test.ts
│   └── security/               # Security tests
│       ├── AccessControl.test.ts
│       ├── EconomicAttacks.test.ts
│       └── ReentrancyAttacks.test.ts
│
├── docs/                       # Documentation
│   ├── API_REFERENCE.md
│   ├── DEVELOPMENT_STATE.md
│   ├── IMPLEMENTATION_STATUS.md
│   ├── project.md              # Original project spec
│   ├── Info.txt                # Pump.fun research
│   ├── guides/                 # How-to guides
│   │   ├── DEPLOYMENT_GUIDE.md
│   │   ├── NEXT_STEPS.md
│   │   ├── PUMPSWAP_COMPLETE.md
│   │   ├── TRADING_SYSTEM_COMPLETE.md
│   │   ├── UI_FIRST_DEVELOPMENT_GUIDE.md
│   │   ├── UI_FIRST_QUICKSTART.md
│   │   └── WSL_MYTHRIL_SETUP_GUIDE.md
│   ├── reports/                # Progress and analysis reports
│   │   ├── TEST_FIXING_PROGRESS.md
│   │   ├── TEST_FIXING_SESSION_SUMMARY.md
│   │   ├── SPEC_IMPLEMENTATION_COMPLETE.md
│   │   ├── OPTION_A_COMPLETION_SUMMARY.md
│   │   ├── GRADUATION_MANAGER_INTEGRATION_TESTS_SUMMARY.md
│   │   ├── phase3/
│   │   ├── phase4/
│   │   │   ├── PHASE_3_TESTING_SUMMARY.md
│   │   │   ├── PHASE_4_COMPLETION_SUMMARY.md
│   │   │   ├── PHASE_4_FINAL_COMPLETION.md
│   │   │   ├── PHASE_4_FINAL_STATUS.md
│   │   │   ├── PHASE_4_PROGRESS_SUMMARY.md
│   │   │   └── PHASE_4_SESSION_SUMMARY.md
│   │   └── security/
│   │       ├── MYTHRIL_ANALYSIS_COMPLETE.md
│   │       ├── SECURITY_AUDIT_REPORT.md
│   │       ├── SECURITY_REVIEW_CHECKLIST.md
│   │       └── SECURITY_TEST_FIXES_SUMMARY.md
│   └── images/                 # Screenshots and diagrams
│       ├── chat.png
│       ├── coin_page.png
│       ├── coin_page_2.png
│       ├── create.png
│       └── live_stream.png
│
├── analysis/                   # Static analysis and tools
│   ├── coverage.json           # Coverage reports
│   ├── mythril/                # Mythril symbolic execution
│   │   ├── mythril-BondingCurve.txt
│   │   ├── mythril-GraduationManager.txt
│   │   ├── mythril-PlatformConfig.txt
│   │   ├── mythril-PumpToken.txt
│   │   └── mythril-TokenFactory.txt
│   ├── slither/                # Slither static analysis
│   │   └── slither-report.json
│   └── flattened-contracts/    # Flattened for verification
│       ├── BondingCurve-flat.sol
│       ├── GraduationManager-flat.sol
│       ├── PlatformConfig-flat.sol
│       ├── PumpToken-flat.sol
│       └── TokenFactory-flat.sol
│
├── artifacts/                  # Compiled contracts (auto-generated)
├── cache/                      # Hardhat cache (auto-generated)
├── coverage/                   # Coverage reports (auto-generated)
├── node_modules/               # Dependencies (auto-generated)
│
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── CLAUDE.md                   # Claude Code instructions
├── CONTRIBUTING.md             # Contribution guidelines
├── hardhat.config.ts           # Hardhat configuration
├── LICENSE                     # MIT License
├── package.json                # NPM dependencies
├── package-lock.json           # NPM lock file
├── PROJECT_STRUCTURE.md        # This file
├── README.md                   # Project overview
├── remappings.txt              # Solidity import remappings
└── tsconfig.json               # TypeScript configuration
```

---

## Key Folders

### `/contracts` - Smart Contracts
All Solidity smart contracts for the PumpBNB platform:
- **Core contracts**: Token creation, bonding curves, graduation
- **Interfaces**: PancakeSwap and ASTER token ABIs
- **Mocks**: Test doubles for external contracts
- **Test utilities**: Malicious contracts for security testing

### `/test` - Test Suites
Comprehensive test coverage:
- **Unit tests**: Individual contract testing
- **Integration tests**: Multi-contract workflows
- **Fuzz tests**: Randomized input testing
- **Gas tests**: Performance benchmarking
- **Security tests**: Attack scenario validation

### `/docs` - Documentation
All project documentation organized by type:
- **Guides**: Step-by-step instructions
- **Reports**: Progress and analysis
- **Images**: Screenshots and diagrams
- **Reference**: API and technical docs

### `/analysis` - Static Analysis
Security audit artifacts:
- **Mythril**: Symbolic execution results
- **Slither**: Static analysis reports
- **Flattened**: Single-file contracts for verification
- **Coverage**: Test coverage metrics

### `/agent-os` - Agent Framework
Agent-OS spec-driven development:
- **Product**: Mission, roadmap, tech stack
- **Specs**: Technical specifications
- **Roles**: Agent definitions
- **Planning**: Task assignments

---

## File Naming Conventions

### Smart Contracts
- **PascalCase**: `BondingCurve.sol`, `TokenFactory.sol`
- **Interfaces**: Prefix with `I` - `IASTER.sol`, `IPancakeRouter.sol`
- **Mocks**: Prefix with `Mock` - `MockERC20.sol`

### Tests
- **PascalCase + .test.ts**: `BondingCurve.test.ts`
- **Descriptive names**: `TokenLifecycle.test.ts`, `GasBenchmarks.test.ts`

### Documentation
- **SCREAMING_SNAKE_CASE.md**: `DEPLOYMENT_GUIDE.md`
- **Phase reports**: `PHASE_4_FINAL_COMPLETION.md`
- **Topic-based**: `SECURITY_AUDIT_REPORT.md`

---

## Important Files

### Configuration
- `hardhat.config.ts` - Hardhat network and compiler settings
- `tsconfig.json` - TypeScript compiler options
- `.env.example` - Environment variables template
- `remappings.txt` - Solidity import path mappings

### Documentation
- `README.md` - Project overview and quick start
- `CLAUDE.md` - Instructions for Claude Code
- `CONTRIBUTING.md` - Contribution guidelines
- `PROJECT_STRUCTURE.md` - This file

### Key Reports
- `docs/reports/SPEC_IMPLEMENTATION_COMPLETE.md` - Spec verification status
- `docs/reports/TEST_FIXING_SESSION_SUMMARY.md` - Testing progress
- `docs/reports/security/MYTHRIL_ANALYSIS_COMPLETE.md` - Security audit results

---

## Auto-Generated Folders

These folders are created during build/test and should NOT be committed:

- `artifacts/` - Compiled contract artifacts
- `cache/` - Hardhat compilation cache
- `coverage/` - HTML coverage reports
- `node_modules/` - NPM dependencies
- `mythril-env/` - Mythril Python virtual environment

All are listed in `.gitignore`.

---

## Clean-Up Commands

```bash
# Remove auto-generated files
npm run clean

# Deep clean (including node_modules)
rm -rf artifacts cache coverage node_modules mythril-env
npm install

# Recompile contracts
npx hardhat compile

# Regenerate coverage
npx hardhat coverage
```

---

## Navigation Tips

### Finding Things

**Smart Contracts**:
```bash
ls contracts/*.sol              # Core contracts
ls contracts/interfaces/        # External interfaces
ls contracts/mocks/             # Test mocks
```

**Tests**:
```bash
ls test/*.test.ts               # Unit tests
ls test/integration/            # Integration tests
ls test/security/               # Security tests
```

**Documentation**:
```bash
ls docs/guides/                 # How-to guides
ls docs/reports/                # Progress reports
ls docs/reports/security/       # Security audits
```

**Analysis**:
```bash
ls analysis/mythril/            # Mythril results
ls analysis/slither/            # Slither results
ls analysis/flattened-contracts/ # Verification files
```

---

## Maintenance

### Adding New Files

**New smart contract**: → `/contracts`
**New test file**: → `/test` (with appropriate subfolder)
**New documentation**: → `/docs/guides` or `/docs/reports`
**Analysis results**: → `/analysis/{tool-name}`

### Moving Files

If you need to reorganize, update this file to reflect the new structure.

### Cleanup Schedule

- **Weekly**: Review and organize new reports
- **After sprints**: Archive phase completion docs
- **Before releases**: Clean up temporary analysis files

---

## Status

**Organization Level**: ✅ EXCELLENT
**Last Cleanup**: October 25, 2025
**Files Organized**: 40+ documentation files moved from root
**Root Directory**: Clean - only essential config files

**Next Cleanup**: After Phase 5 completion
