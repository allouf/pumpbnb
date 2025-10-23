# Tasks: Core Smart Contracts

## Phase 1: Project Setup & Infrastructure

### Task 1: Initialize Hardhat TypeScript Project
- [x] Set up Hardhat with TypeScript configuration
- [x] Install required dependencies (hardhat, ethers, OpenZeppelin, typechain)
- [x] Configure hardhat.config.ts with BNB Chain networks (testnet, mainnet)
- [x] Set up TypeScript compilation settings
- [x] Configure gas reporter and contract size checker
- **Deliverables**:
  - `hardhat.config.ts` with BSC testnet/mainnet configs
  - `tsconfig.json` with strict mode enabled
  - `package.json` with all dependencies
  - `.env.example` template for private keys
- **Dependencies**: None
- **Acceptance Criteria**:
  - `npx hardhat compile` runs successfully
  - TypeScript compilation passes without errors
  - Network configs include BSC testnet (97) and mainnet (56)
  - Gas reporter configured for cost analysis

### Task 2: Set Up Testing Framework
- [ ] Install Hardhat testing dependencies (chai, mocha, @nomicfoundation/hardhat-toolbox)
- [ ] Install Foundry for fuzz testing (optional but recommended)
- [ ] Configure coverage reporting (solidity-coverage)
- [ ] Create test helper utilities for common operations
- [ ] Set up mainnet fork testing configuration
- **Deliverables**:
  - `test/helpers/` directory with utility functions
  - Coverage configuration in hardhat.config.ts
  - Fork testing setup for PancakeSwap and ASTER interactions
- **Dependencies**: Task 1
- **Acceptance Criteria**:
  - `npx hardhat test` command works
  - Coverage reports generate successfully
  - Fork testing can simulate BSC mainnet state
  - Test helpers available for ASTER token mocking

### Task 3: Configure External Contract Interfaces
- [ ] Create interfaces for PancakeSwap Factory
- [ ] Create interfaces for PancakeSwap Router
- [ ] Create interfaces for ASTER token (BEP-20)
- [ ] Create interfaces for WBNB token
- [ ] Document all external contract addresses
- **Deliverables**:
  - `contracts/interfaces/IPancakeFactory.sol`
  - `contracts/interfaces/IPancakeRouter.sol`
  - `contracts/interfaces/IASTER.sol`
  - `contracts/interfaces/IWBNB.sol`
  - `contracts/Constants.sol` with all addresses
- **Dependencies**: Task 1
- **Acceptance Criteria**:
  - All interfaces match actual contract ABIs
  - Addresses documented for testnet and mainnet
  - Constants file includes:
    - ASTER: 0x000Ae314E2A2172a039B26378814C252734f556A
    - PancakeSwap Factory: 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73
    - PancakeSwap Router: 0x10ED43C718714eb63d5aA57B78B54704E256024E
    - WBNB: 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c

### Task 4: Set Up Security Tools
- [ ] Install and configure Slither for static analysis
- [ ] Install and configure Mythril for symbolic execution
- [ ] Set up pre-commit hooks for security checks
- [ ] Create security checklist template
- [ ] Configure CI/CD pipeline for automated security scanning
- **Deliverables**:
  - `slither.config.json`
  - `.github/workflows/security.yml` (if using GitHub)
  - `SECURITY_CHECKLIST.md`
  - Pre-commit hook scripts
- **Dependencies**: Task 1
- **Acceptance Criteria**:
  - Slither runs without errors on sample contract
  - Security checks run automatically on git commit
  - CI pipeline includes security scan step

## Phase 2: Core Contract Development

### Task 5: Implement PlatformConfig.sol
- [ ] Create AccessControl-based role management (ADMIN, PAUSER roles)
- [ ] Implement Pausable functionality for emergency stops
- [ ] Add configuration setters (tradingFee, feeRecipient, graduationThreshold)
- [ ] Add parameter validation (max fee 500 basis points)
- [ ] Implement getter functions for all configuration values
- [ ] Add comprehensive events for all config changes
- **Deliverables**:
  - `contracts/PlatformConfig.sol`
  - Events: FeeUpdated, FeeRecipientUpdated, ThresholdUpdated, Paused, Unpaused
- **Dependencies**: Task 1, Task 3
- **Acceptance Criteria**:
  - Default bonding curve trading fee: 100 basis points (1%) split as 30bps creator, 70bps protocol
  - Default post-graduation fee: 30 basis points (0.3%) split as 15bps creator, 15bps protocol
  - Default graduation threshold: 100e18 (100 ASTER)
  - Only ADMIN role can modify configs
  - Only PAUSER role can pause/unpause
  - Fee cannot exceed 500 basis points
  - All state changes emit events

### Task 6: Implement PumpToken.sol (BEP-20 Standard)
- [ ] Extend OpenZeppelin ERC20 with custom initialization
- [ ] Implement fixed supply (1B tokens, 18 decimals)
- [ ] Add metadata URI storage and getter
- [ ] Implement creator allocation locking (20% of supply)
- [ ] Add vesting schedule for creator allocation
- [ ] Prevent premature transfers of locked tokens
- [ ] Add comprehensive token metadata getters
- **Deliverables**:
  - `contracts/PumpToken.sol`
  - Constructor params: name, symbol, totalSupply, uri, creator, bondingCurve
  - Events: TokenDeployed, CreatorAllocationUnlocked
- **Dependencies**: Task 1, Task 5
- **Acceptance Criteria**:
  - Total supply: 1,000,000,000 tokens (1e9 * 1e18)
  - 800M tokens transferred to bonding curve on deployment
  - 200M tokens locked for creator with vesting
  - Creator allocation locked until graduation
  - Metadata URI accessible via public getter
  - Follows BEP-20 standard completely
  - No owner/admin functions after deployment

### Task 7: Implement BondingCurve.sol - Core Structure
- [ ] Create contract skeleton with OpenZeppelin ReentrancyGuard
- [ ] Implement initialization function (token, creator, ASTER address)
- [ ] Set up virtual reserve constants (0.3 BNB equivalent ASTER, 200M tokens)
- [ ] Add real reserve tracking variables
- [ ] Implement graduation status flag
- [ ] Add PlatformConfig integration
- [ ] Set up ASTER token interface integration
- **Deliverables**:
  - `contracts/BondingCurve.sol` with state variables
  - Integration with IERC20 for ASTER token
  - Constants for virtual reserves
- **Dependencies**: Task 3, Task 5, Task 6
- **Acceptance Criteria**:
  - ASTER token address: 0x000Ae314E2A2172a039B26378814C252734f556A
  - Virtual ASTER reserve initialized (calculate from 0.3 BNB worth)
  - Virtual token reserve: 200,000,000 * 1e18
  - Graduation threshold: 100e18 ASTER
  - Contract uses ReentrancyGuard on state-changing functions
  - Can be paused via PlatformConfig

### Task 8: Implement BondingCurve.sol - Price Calculation Functions
- [ ] Implement constant product formula (x * y = k)
- [ ] Create getPrice() view function (ASTER per token)
- [ ] Create getBuyAmount() for calculating tokens received
- [ ] Create getSellAmount() for calculating ASTER received
- [ ] Implement fee calculation (1% total: 0.3% creator, 0.7% protocol)
- [ ] Add slippage protection in calculations
- [ ] Optimize for gas efficiency (avoid unnecessary SLOAD)
- **Deliverables**:
  - View functions: getPrice(), getBuyAmount(), getSellAmount()
  - Internal helper: _calculateFee()
  - Mathematical formula implementation
- **Dependencies**: Task 7
- **Acceptance Criteria**:
  - Formula: (virtualAster + realAster) * (virtualToken + realToken) = k
  - Price increases as ASTER reserves grow
  - Fee calculated before reserve updates
  - All calculations use 18 decimal precision
  - No division by zero possible
  - Gas cost < 50K for view functions
  - Calculations match Uniswap V2 math

### Task 9: Implement BondingCurve.sol - Buy Functionality
- [ ] Implement buyWithAster() function
- [ ] Add ASTER token approval check and transfer
- [ ] Calculate tokens out using constant product
- [ ] Apply 1% fee to ASTER input (split: 0.3% creator, 0.7% protocol)
- [ ] Update real reserves after trade
- [ ] Transfer tokens to buyer
- [ ] Transfer creator fee (0.3%) to creator address
- [ ] Transfer protocol fee (0.7%) to platform fee recipient
- [ ] Check graduation condition after trade
- [ ] Emit Buy event with all details
- [ ] Add slippage protection (minTokensOut parameter)
- **Deliverables**:
  - `buyWithAster(uint256 asterIn, uint256 minTokensOut)` function
  - Event: Buy(address buyer, uint256 asterIn, uint256 tokensOut, uint256 fee, uint256 timestamp)
- **Dependencies**: Task 8
- **Acceptance Criteria**:
  - Requires ASTER approval before call
  - Reverts if tokensOut < minTokensOut
  - Fee transferred to platform recipient in ASTER
  - Real reserves updated atomically
  - Reentrancy protection enabled
  - Gas cost < 200K
  - Cannot buy after graduation
  - Event includes all transaction details

### Task 10: Implement BondingCurve.sol - Sell Functionality
- [ ] Implement sellForAster() function
- [ ] Transfer tokens from seller to bonding curve
- [ ] Calculate ASTER out using constant product
- [ ] Apply 1% fee to ASTER output (split: 0.3% creator, 0.7% protocol)
- [ ] Update real reserves after trade
- [ ] Transfer ASTER to seller (after fee deduction)
- [ ] Transfer creator fee (0.3%) to creator address
- [ ] Transfer protocol fee (0.7%) to platform recipient
- [ ] Emit Sell event with all details
- [ ] Add slippage protection (minAsterOut parameter)
- **Deliverables**:
  - `sellForAster(uint256 tokensIn, uint256 minAsterOut)` function
  - Event: Sell(address seller, uint256 tokensIn, uint256 asterOut, uint256 fee, uint256 timestamp)
- **Dependencies**: Task 8
- **Acceptance Criteria**:
  - Tokens transferred from seller via transferFrom
  - Reverts if asterOut < minAsterOut
  - Fee deducted from ASTER output
  - Real reserves updated correctly
  - Reentrancy protection enabled
  - Gas cost < 200K
  - Cannot sell after graduation
  - Prevents dumping entire supply in one trade

### Task 11: Implement GraduationManager.sol - Core Structure
- [ ] Create contract with PlatformConfig integration
- [ ] Set up PancakeSwap Router and Factory interfaces
- [ ] Implement graduation eligibility checker
- [ ] Add access control for graduation execution
- [ ] Set up ASTER and WBNB token interfaces
- [ ] Add emergency pause integration
- **Deliverables**:
  - `contracts/GraduationManager.sol` skeleton
  - Integration with IPancakeRouter and IPancakeFactory
  - Function: checkGraduationEligibility(address bondingCurve)
- **Dependencies**: Task 3, Task 5, Task 7
- **Acceptance Criteria**:
  - Can query bonding curve ASTER reserves
  - Returns true if reserves >= 100 ASTER
  - Integrates with PlatformConfig for threshold
  - Can be paused for emergencies

### Task 12: Implement GraduationManager.sol - ASTER to WBNB Swap
- [ ] Implement internal swapAsterToWBNB() function
- [ ] Use PancakeSwap Router swapExactTokensForTokens
- [ ] Add slippage protection (minimum 95% of expected)
- [ ] Handle ASTER approval to router
- [ ] Calculate expected WBNB output
- [ ] Add deadline protection (block.timestamp + 300)
- **Deliverables**:
  - Internal function: _swapAsterToWBNB(uint256 asterAmount)
  - Returns: uint256 wbnbReceived
- **Dependencies**: Task 11
- **Acceptance Criteria**:
  - Uses PancakeSwap Router: 0x10ED43C718714eb63d5aA57B78B54704E256024E
  - Swap path: [ASTER, WBNB]
  - Approves exact amount needed
  - Reverts if slippage too high
  - Returns actual WBNB received
  - Gas efficient (part of larger graduation transaction)

### Task 13: Implement GraduationManager.sol - Liquidity Addition
- [ ] Implement addLiquidityToPancake() internal function
- [ ] Create Token/WBNB pair if doesn't exist
- [ ] Calculate optimal token amount for WBNB received
- [ ] Approve tokens and WBNB to router
- [ ] Call addLiquidity on PancakeSwap router
- [ ] Handle liquidity tokens received
- [ ] Burn LP tokens to address(0) for permanent lock
- **Deliverables**:
  - Internal function: _addLiquidityToPancake(address token, uint256 wbnbAmount, uint256 tokenAmount)
  - Returns: address pairAddress, uint256 lpTokens
- **Dependencies**: Task 12
- **Acceptance Criteria**:
  - Uses PancakeSwap Factory to create/get pair
  - Adds liquidity with optimal ratio
  - Burns LP tokens permanently
  - Returns pair address for tracking
  - Handles dust amounts appropriately
  - Gas included in graduation budget

### Task 14: Implement GraduationManager.sol - Graduation Orchestration
- [ ] Implement executeGraduation() public function
- [ ] Extract all ASTER and remaining tokens from bonding curve
- [ ] Call swapAsterToWBNB with extracted ASTER
- [ ] Call addLiquidityToPancake with WBNB and tokens
- [ ] Mark bonding curve as graduated
- [ ] Unlock creator allocation in token contract
- [ ] Emit GraduationCompleted event with all details
- [ ] Add comprehensive error handling
- **Deliverables**:
  - `executeGraduation(address bondingCurve)` function
  - Event: GraduationCompleted(address token, address bondingCurve, address pancakePair, uint256 asterUsed, uint256 wbnbAdded, uint256 tokensAdded, uint256 timestamp)
- **Dependencies**: Task 13
- **Acceptance Criteria**:
  - Checks eligibility before execution
  - Extracts exactly 100 ASTER (or threshold amount)
  - Swaps all ASTER to WBNB
  - Adds all liquidity to PancakeSwap
  - Burns all LP tokens
  - Sets bonding curve graduated flag
  - Total gas cost < 3M
  - Atomic operation (all or nothing)
  - Can only be executed once per token
  - Emits comprehensive event

### Task 15: Implement TokenFactory.sol - Core Structure
- [ ] Create factory contract with Create2 deployment
- [ ] Implement PlatformConfig integration
- [ ] Add token counter and tracking mappings
- [ ] Add token metadata storage
- [ ] Note: Token creation is FREE (only gas costs)
- [ ] Implement access control for factory operations
- **Deliverables**:
  - `contracts/TokenFactory.sol` skeleton
  - Mappings: tokenToBondingCurve, tokenMetadata
  - State variable: tokenCounter
- **Dependencies**: Task 5, Task 6, Task 7
- **Acceptance Criteria**:
  - Uses Create2 for deterministic addresses
  - Tracks all deployed tokens
  - Stores bonding curve addresses
  - Token creation is FREE (no creation fee, only gas costs)

### Task 16: Implement TokenFactory.sol - Token Creation
- [ ] Implement createToken() function (not payable - creation is FREE)
- [ ] Validate name, symbol, and URI parameters
- [ ] Deploy PumpToken using Create2
- [ ] Deploy BondingCurve using Create2
- [ ] Initialize bonding curve with token address
- [ ] Transfer 800M tokens to bonding curve
- [ ] Lock 200M tokens for creator
- [ ] Store metadata and mappings
- [ ] Emit TokenCreated event
- [ ] Return deployed addresses
- **Deliverables**:
  - `createToken(string name, string symbol, string uri)` function (FREE - no payment required)
  - Event: TokenCreated(address indexed token, address indexed bondingCurve, address indexed creator, string name, string symbol, string uri, uint256 timestamp)
  - Function: getTokenInfo(address token) view returns (TokenInfo)
- **Dependencies**: Task 15
- **Acceptance Criteria**:
  - No payment required (only gas costs)
  - Name length: 1-32 characters
  - Symbol length: 1-10 characters
  - URI length: < 256 characters
  - Uses deterministic Create2 addresses
  - Initial supply: 1B tokens
  - 800M to bonding curve, 200M locked
  - Gas cost < 3.2M
  - Returns (tokenAddress, bondingCurveAddress)
  - Event emitted with all deployment info
  - Token immediately tradeable

### Task 17: Implement TokenFactory.sol - Query Functions
- [ ] Implement getTokenInfo() for metadata retrieval
- [ ] Implement getBondingCurve() for address lookup
- [ ] Implement getAllTokens() for factory token list
- [ ] Implement getTokenCount() for total deployed
- [ ] Add pagination support for large lists
- **Deliverables**:
  - View functions for token information
  - Struct: TokenInfo with all metadata
  - Pagination helpers
- **Dependencies**: Task 16
- **Acceptance Criteria**:
  - getTokenInfo returns complete metadata
  - getBondingCurve returns correct address or zero
  - getAllTokens supports pagination (offset, limit)
  - Gas efficient queries (< 50K)
  - Returns accurate token count

## Phase 3: Testing & Quality Assurance

### Task 18: Unit Tests - PlatformConfig.sol
- [ ] Test role-based access control (ADMIN, PAUSER)
- [ ] Test configuration updates (fee, recipient, threshold)
- [ ] Test parameter validation (max fee enforcement)
- [ ] Test pause/unpause functionality
- [ ] Test event emissions for all state changes
- [ ] Test unauthorized access reverts
- **Deliverables**:
  - `test/PlatformConfig.test.ts`
  - 100% code coverage for PlatformConfig
- **Dependencies**: Task 5
- **Acceptance Criteria**:
  - All functions tested with valid/invalid inputs
  - Access control properly enforced
  - All edge cases covered
  - Gas consumption measured
  - Coverage report shows 100%

### Task 19: Unit Tests - PumpToken.sol
- [ ] Test token deployment with correct parameters
- [ ] Test initial supply distribution (800M/200M split)
- [ ] Test creator allocation locking
- [ ] Test vesting schedule unlocking
- [ ] Test standard BEP-20 functions (transfer, approve, etc.)
- [ ] Test metadata URI storage and retrieval
- [ ] Test transfer restrictions during lock period
- **Deliverables**:
  - `test/PumpToken.test.ts`
  - 100% code coverage for PumpToken
- **Dependencies**: Task 6
- **Acceptance Criteria**:
  - Deployment tests verify correct supply
  - Lock period enforced correctly
  - BEP-20 compliance verified
  - Edge cases for vesting tested
  - Gas benchmarks recorded
  - Coverage report shows 100%

### Task 20: Unit Tests - BondingCurve.sol
- [ ] Test initialization with correct parameters
- [ ] Test price calculation accuracy
- [ ] Test buy operations with various amounts
- [ ] Test sell operations with various amounts
- [ ] Test fee collection (1% total: 0.3% creator, 0.7% protocol on bonding curve trades)
- [ ] Test slippage protection (minOut parameters)
- [ ] Test reserve updates after trades
- [ ] Test graduation threshold detection
- [ ] Test trading disabled after graduation
- [ ] Test reentrancy protection
- [ ] Test pause functionality
- **Deliverables**:
  - `test/BondingCurve.test.ts`
  - 100% code coverage for BondingCurve
  - Fuzz tests for mathematical operations
- **Dependencies**: Task 7-10
- **Acceptance Criteria**:
  - Constant product formula verified correct
  - Buy/sell symmetry tested
  - Fee calculations accurate to wei
  - Slippage protection works correctly
  - Gas costs < 200K per trade
  - Reentrancy attacks prevented
  - Fuzz tests run 10000+ iterations
  - Coverage report shows 100%

### Task 21: Unit Tests - GraduationManager.sol
- [ ] Test graduation eligibility checks
- [ ] Test ASTER to WBNB swap execution
- [ ] Test PancakeSwap pair creation
- [ ] Test liquidity addition
- [ ] Test LP token burning
- [ ] Test complete graduation orchestration
- [ ] Test graduation can only happen once
- [ ] Test revert conditions (insufficient reserves, etc.)
- [ ] Test event emissions
- **Deliverables**:
  - `test/GraduationManager.test.ts`
  - 100% code coverage for GraduationManager
  - Mainnet fork tests with real PancakeSwap
- **Dependencies**: Task 11-14
- **Acceptance Criteria**:
  - Fork tests use real BSC state
  - Graduation flow tested end-to-end
  - ASTER/WBNB swap verified on fork
  - Liquidity creation verified on PancakeSwap
  - LP tokens confirmed burned
  - Gas cost < 3M
  - All edge cases handled
  - Coverage report shows 100%

### Task 22: Unit Tests - TokenFactory.sol
- [ ] Test token creation with valid parameters (FREE - no payment)
- [ ] Test parameter validation (name, symbol, URI)
- [ ] Test Create2 deterministic deployment
- [ ] Test initial token distribution
- [ ] Test metadata storage and retrieval
- [ ] Test query functions (getTokenInfo, etc.)
- [ ] Test pagination for token lists
- [ ] Test event emissions
- **Deliverables**:
  - `test/TokenFactory.test.ts`
  - 100% code coverage for TokenFactory
- **Dependencies**: Task 15-17
- **Acceptance Criteria**:
  - No payment required (creation is FREE)
  - Invalid parameters rejected
  - Deterministic addresses verified
  - Token distribution correct (800M/200M)
  - All getters return correct data
  - Gas cost < 3.2M for creation
  - Coverage report shows 100%

### Task 23: Integration Tests - Complete Token Lifecycle
- [ ] Test full flow: creation → trading → graduation
- [ ] Test multiple concurrent bonding curves
- [ ] Test creator allocation unlocking after graduation
- [ ] Test platform fee collection throughout lifecycle
- [ ] Test PancakeSwap liquidity after graduation
- [ ] Test trading disabled post-graduation
- [ ] Test edge case: rapid trades near graduation
- [ ] Test multiple tokens graduating simultaneously
- **Deliverables**:
  - `test/integration/TokenLifecycle.test.ts`
  - Comprehensive end-to-end scenarios
- **Dependencies**: Task 18-22
- **Acceptance Criteria**:
  - Complete lifecycle tested (creation to PancakeSwap)
  - Concurrent operations don't interfere
  - Fee collection accurate across lifecycle
  - Graduation triggers correctly at 100 ASTER
  - Post-graduation state verified
  - Multiple tokens don't conflict
  - All state transitions validated

### Task 24: Integration Tests - PancakeSwap & ASTER Interactions
- [ ] Test ASTER token interactions (approval, transfer)
- [ ] Test ASTER to WBNB swap on PancakeSwap fork
- [ ] Test PancakeSwap pair creation
- [ ] Test liquidity addition to PancakeSwap
- [ ] Test LP token burning verification
- [ ] Test price impact on PancakeSwap after graduation
- [ ] Test real ASTER contract address integration
- **Deliverables**:
  - `test/integration/ExternalProtocols.test.ts`
  - Mainnet fork tests with real contracts
- **Dependencies**: Task 23
- **Acceptance Criteria**:
  - Uses real ASTER contract: 0x000Ae314E2A2172a039B26378814C252734f556A
  - Uses real PancakeSwap contracts
  - Fork tests simulate actual mainnet conditions
  - All external calls succeed
  - Gas costs within expected ranges
  - Slippage handled correctly

### Task 25: Fuzz Testing - Mathematical Operations
- [ ] Fuzz test bonding curve price calculations
- [ ] Fuzz test buy amount calculations
- [ ] Fuzz test sell amount calculations
- [ ] Fuzz test fee calculations
- [ ] Fuzz test edge cases (very small/large amounts)
- [ ] Fuzz test reserve overflow/underflow protection
- [ ] Test invariants (k remains constant, etc.)
- **Deliverables**:
  - `test/fuzz/BondingCurveFuzz.t.sol` (Foundry)
  - 10000+ fuzz iterations per function
- **Dependencies**: Task 2, Task 20
- **Acceptance Criteria**:
  - Foundry fuzzer runs successfully
  - No overflow/underflow errors found
  - Invariants hold for all inputs
  - Price always increases with buys
  - Reserves always >= 0
  - At least 10K runs per test

### Task 26: Gas Optimization & Benchmarking
- [ ] Benchmark token creation gas cost
- [ ] Benchmark buy transaction gas cost
- [ ] Benchmark sell transaction gas cost
- [ ] Benchmark graduation gas cost
- [ ] Identify optimization opportunities
- [ ] Implement gas optimizations (storage packing, etc.)
- [ ] Re-test to verify optimization gains
- [ ] Document final gas costs
- **Deliverables**:
  - `GAS_BENCHMARKS.md` with all measurements
  - Optimized contracts meeting targets
- **Dependencies**: Task 18-25
- **Acceptance Criteria**:
  - Token creation: < 3.2M gas
  - Buy transaction: < 200K gas
  - Sell transaction: < 200K gas
  - Graduation: < 3M gas
  - Optimizations don't compromise security
  - All tests still pass after optimization

### Task 27: Test Coverage Verification
- [ ] Generate coverage reports for all contracts
- [ ] Verify 95% minimum coverage achieved
- [ ] Identify uncovered lines and add tests
- [ ] Document intentionally uncovered code (if any)
- [ ] Set up automated coverage tracking
- **Deliverables**:
  - Coverage report showing >= 95% for all contracts
  - `COVERAGE.md` documentation
- **Dependencies**: Task 18-26
- **Acceptance Criteria**:
  - Overall coverage >= 95%
  - Each contract >= 95% coverage
  - Branch coverage >= 90%
  - All critical paths covered 100%
  - Coverage reports in CI/CD

## Phase 4: Security & Auditing

### Task 28: Reentrancy Attack Testing
- [ ] Test reentrancy on buyWithAster()
- [ ] Test reentrancy on sellForAster()
- [ ] Test reentrancy on executeGraduation()
- [ ] Test cross-function reentrancy
- [ ] Verify ReentrancyGuard effectiveness
- [ ] Test with malicious token contracts
- **Deliverables**:
  - `test/security/Reentrancy.test.ts`
  - Malicious contract mocks for testing
- **Dependencies**: Task 20, Task 21
- **Acceptance Criteria**:
  - All reentrancy attacks fail
  - ReentrancyGuard prevents all vectors
  - Cross-function reentrancy blocked
  - Malicious tokens can't exploit
  - No state corruption possible

### Task 29: Access Control Testing
- [ ] Test unauthorized access to admin functions
- [ ] Test role escalation attempts
- [ ] Test pause/unpause authorization
- [ ] Test factory control functions
- [ ] Test graduation manager permissions
- [ ] Verify least privilege principle
- **Deliverables**:
  - `test/security/AccessControl.test.ts`
  - Comprehensive authorization tests
- **Dependencies**: Task 18-22
- **Acceptance Criteria**:
  - All protected functions revert for unauthorized
  - Role changes only by authorized addresses
  - No privilege escalation possible
  - Emergency pause works correctly
  - Only admins can update configs

### Task 30: Economic Attack Testing
- [ ] Test front-running resistance
- [ ] Test sandwich attack scenarios
- [ ] Test large buy/sell manipulation
- [ ] Test graduation threshold manipulation
- [ ] Test fee extraction attacks
- [ ] Test flash loan attack vectors
- [ ] Test price manipulation attempts
- **Deliverables**:
  - `test/security/EconomicAttacks.test.ts`
  - Attack scenario simulations
- **Dependencies**: Task 20, Task 23
- **Acceptance Criteria**:
  - Slippage protection prevents sandwiching
  - Large trades don't break bonding curve
  - Graduation can't be gamed
  - Fee collection secure
  - Flash loans can't exploit system
  - Constant product formula holds

### Task 31: Edge Case & Failure Testing
- [ ] Test zero amount trades
- [ ] Test maximum amount trades
- [ ] Test graduation with exact threshold
- [ ] Test token creation with edge parameters
- [ ] Test ASTER token failures (transfer fails, etc.)
- [ ] Test PancakeSwap interaction failures
- [ ] Test contract paused states
- **Deliverables**:
  - `test/security/EdgeCases.test.ts`
  - Failure scenario coverage
- **Dependencies**: Task 18-24
- **Acceptance Criteria**:
  - Zero amounts handled gracefully
  - Max amounts don't overflow
  - External failures handled properly
  - Paused state blocks operations
  - All reverts have clear messages
  - No undefined behavior

### Task 32: Slither Static Analysis
- [ ] Run Slither on all contracts
- [ ] Review and categorize findings
- [ ] Fix all high/medium severity issues
- [ ] Document false positives
- [ ] Create Slither baseline configuration
- [ ] Add Slither to CI/CD pipeline
- **Deliverables**:
  - `SLITHER_REPORT.md` with findings
  - Fixed contracts passing Slither
  - `.slither.config.json` baseline
- **Dependencies**: Task 5-17
- **Acceptance Criteria**:
  - Zero high severity issues
  - Zero medium severity issues
  - All low issues reviewed (fix or document)
  - False positives documented
  - Slither runs cleanly in CI

### Task 33: Mythril Symbolic Execution
- [ ] Run Mythril on all contracts
- [ ] Analyze symbolic execution traces
- [ ] Fix identified vulnerabilities
- [ ] Document analysis results
- [ ] Set up Mythril in CI pipeline
- **Deliverables**:
  - `MYTHRIL_REPORT.md` with findings
  - Remediated vulnerabilities
- **Dependencies**: Task 5-17
- **Acceptance Criteria**:
  - No critical vulnerabilities found
  - All warnings investigated
  - Integer overflow/underflow impossible
  - Reentrancy patterns verified safe
  - Symbolic execution completes

### Task 34: Manual Security Review
- [ ] Review all external calls for safety
- [ ] Verify all mathematical operations
- [ ] Check state variable visibility
- [ ] Review event emissions completeness
- [ ] Verify upgrade patterns (if applicable)
- [ ] Check for centralization risks
- [ ] Review emergency procedures
- **Deliverables**:
  - `SECURITY_REVIEW.md` checklist
  - Issues list with remediation
- **Dependencies**: Task 5-17
- **Acceptance Criteria**:
  - All external calls use safe patterns
  - Math operations use SafeMath or Solidity ^0.8
  - No public state variables (use getters)
  - All events properly indexed
  - Minimal centralization
  - Emergency pause tested

### Task 35: Prepare for External Audit
- [ ] Create comprehensive documentation for auditors
- [ ] Document all assumptions and invariants
- [ ] Create attack surface analysis
- [ ] List all external dependencies
- [ ] Prepare test coverage reports
- [ ] Create audit scope document
- [ ] Freeze contract code (no changes during audit)
- **Deliverables**:
  - `AUDIT_SCOPE.md` for auditors
  - `ARCHITECTURE.md` with diagrams
  - `ASSUMPTIONS.md` documenting invariants
  - Complete test suite for auditor review
- **Dependencies**: Task 28-34
- **Acceptance Criteria**:
  - Documentation complete and clear
  - All invariants documented
  - Attack surface mapped
  - Dependencies listed with versions
  - Code frozen and tagged
  - Ready for 2 independent audits

## Phase 5: Deployment & Documentation

### Task 36: Deployment Scripts - Testnet
- [ ] Create deployment script for PlatformConfig
- [ ] Create deployment script for TokenFactory
- [ ] Create deployment script for GraduationManager
- [ ] Implement deployment verification
- [ ] Add contract verification on BSCScan
- [ ] Create deployment checklist
- [ ] Test deployment on BSC testnet
- **Deliverables**:
  - `scripts/deploy-testnet.ts`
  - `scripts/verify-contracts.ts`
  - `DEPLOYMENT_CHECKLIST.md`
  - Deployed testnet addresses
- **Dependencies**: Task 5-17, Task 35
- **Acceptance Criteria**:
  - All contracts deploy successfully
  - Contracts verified on testnet BSCScan
  - Addresses recorded in config file
  - Deployment gas costs documented
  - Initialization parameters correct
  - Can interact with deployed contracts

### Task 37: Deployment Scripts - Mainnet
- [ ] Create mainnet deployment configuration
- [ ] Add multi-signature deployment support
- [ ] Implement deployment gas optimization
- [ ] Add post-deployment validation
- [ ] Create rollback procedures
- [ ] Add monitoring setup
- **Deliverables**:
  - `scripts/deploy-mainnet.ts`
  - `MAINNET_DEPLOYMENT.md` guide
  - Multi-sig setup documentation
- **Dependencies**: Task 36
- **Acceptance Criteria**:
  - Mainnet config separate from testnet
  - Multi-sig wallet required for admin
  - Gas price optimization enabled
  - Post-deployment checks run automatically
  - Rollback procedure documented
  - Monitoring configured

### Task 38: Create Contract Documentation
- [ ] Write NatSpec comments for all contracts
- [ ] Generate HTML documentation from NatSpec
- [ ] Create architecture diagrams
- [ ] Document bonding curve mathematics
- [ ] Create integration guide for frontend
- [ ] Document all events and their usage
- **Deliverables**:
  - Complete NatSpec in all contracts
  - `docs/` directory with generated HTML
  - `ARCHITECTURE.md` with diagrams
  - `BONDING_CURVE.md` math explanation
  - `INTEGRATION_GUIDE.md` for developers
- **Dependencies**: Task 5-17
- **Acceptance Criteria**:
  - All public/external functions documented
  - All events documented with usage
  - Architecture diagrams clear
  - Math formulas explained
  - Integration examples provided
  - Documentation builds successfully

### Task 39: Create Developer Guide
- [ ] Write setup instructions for local development
- [ ] Document testing procedures
- [ ] Create contribution guidelines
- [ ] Document gas optimization techniques used
- [ ] Create troubleshooting guide
- [ ] Add example usage scripts
- **Deliverables**:
  - `DEVELOPER_GUIDE.md`
  - `CONTRIBUTING.md`
  - `TROUBLESHOOTING.md`
  - `examples/` directory with scripts
- **Dependencies**: Task 1-2, Task 38
- **Acceptance Criteria**:
  - Setup instructions complete
  - Testing guide comprehensive
  - Contribution process clear
  - Examples run successfully
  - Troubleshooting covers common issues

### Task 40: Create ABI and TypeScript Bindings
- [ ] Generate ABIs for all contracts
- [ ] Create TypeScript interfaces using Typechain
- [ ] Package ABIs for npm distribution
- [ ] Create usage examples in TypeScript
- [ ] Version ABIs with contract versions
- **Deliverables**:
  - `abis/` directory with JSON files
  - `types/` directory with TypeScript bindings
  - `package.json` for npm publishing
  - TypeScript usage examples
- **Dependencies**: Task 5-17
- **Acceptance Criteria**:
  - ABIs match deployed contracts
  - TypeScript types generated correctly
  - Package builds successfully
  - Examples compile and run
  - Versioning scheme established

### Task 41: Create Migration & Upgrade Guide
- [ ] Document upgrade procedures (if using proxies)
- [ ] Create emergency response procedures
- [ ] Document parameter adjustment processes
- [ ] Create governance procedures
- [ ] Document contract interaction patterns
- **Deliverables**:
  - `UPGRADE_GUIDE.md`
  - `EMERGENCY_PROCEDURES.md`
  - `GOVERNANCE.md`
  - Runbooks for common operations
- **Dependencies**: Task 5-17, Task 38
- **Acceptance Criteria**:
  - Upgrade process documented
  - Emergency contacts listed
  - Parameter changes have procedures
  - Governance model clear
  - Runbooks tested

### Task 42: Performance Benchmarking Documentation
- [ ] Document final gas costs
- [ ] Create performance comparison with competitors
- [ ] Document throughput capabilities
- [ ] Measure price calculation performance
- [ ] Document scalability limits
- **Deliverables**:
  - `PERFORMANCE.md` with benchmarks
  - Comparison table with Pump.fun
  - Scalability analysis
- **Dependencies**: Task 26
- **Acceptance Criteria**:
  - All gas costs documented
  - Comparison with Solana Pump.fun
  - Throughput tested (concurrent operations)
  - View function performance measured
  - Scalability limits identified

### Task 43: Final Security Documentation
- [ ] Consolidate all security findings
- [ ] Document security assumptions
- [ ] Create threat model
- [ ] Document audit findings and fixes
- [ ] Create security best practices guide
- **Deliverables**:
  - `SECURITY.md` comprehensive guide
  - `THREAT_MODEL.md`
  - `AUDIT_RESULTS.md`
  - Security best practices for users
- **Dependencies**: Task 28-35
- **Acceptance Criteria**:
  - All security reports consolidated
  - Threat model complete
  - Audit findings documented
  - User security guidance provided
  - Incident response plan included

## Phase 6: Post-Deployment

### Task 44: Mainnet Deployment Execution
- [ ] Deploy to BSC mainnet with multi-sig
- [ ] Verify all contracts on BSCScan
- [ ] Initialize all contracts with production values
- [ ] Transfer ownership to multi-sig wallet
- [ ] Configure monitoring and alerts
- [ ] Test all functions on mainnet
- **Deliverables**:
  - Deployed mainnet contract addresses
  - Verified contracts on BSCScan
  - Configuration file with addresses
  - Monitoring dashboard URLs
- **Dependencies**: Task 35-37, External audits complete
- **Acceptance Criteria**:
  - All contracts deployed successfully
  - Ownership transferred to multi-sig
  - BSCScan verification complete
  - Monitoring active
  - Test transactions successful
  - No critical issues in first 24 hours

### Task 45: Bug Bounty Program Setup
- [ ] Create bug bounty program terms
- [ ] Set up reward tiers ($100K fund)
- [ ] Choose platform (Immunefi, HackerOne, etc.)
- [ ] Publish program details
- [ ] Set up triage process
- [ ] Create disclosure policy
- **Deliverables**:
  - `BUG_BOUNTY.md` program details
  - Published program on platform
  - Triage workflow documented
- **Dependencies**: Task 44
- **Acceptance Criteria**:
  - $100K allocated for rewards
  - Reward tiers clearly defined
  - Scope clearly documented
  - Response SLA established
  - Disclosure policy public
  - Triage team trained

### Task 46: Monitoring & Analytics Setup
- [ ] Set up contract event monitoring
- [ ] Configure gas price alerts
- [ ] Set up TVL tracking
- [ ] Monitor graduation events
- [ ] Set up anomaly detection
- [ ] Create dashboards for metrics
- **Deliverables**:
  - Monitoring dashboards (Dune, The Graph, etc.)
  - Alert configurations
  - Analytics queries
- **Dependencies**: Task 44
- **Acceptance Criteria**:
  - All events indexed
  - Real-time monitoring active
  - Alerts configured for anomalies
  - TVL tracked accurately
  - Dashboards publicly accessible
  - Response procedures for alerts

### Task 47: Emergency Response Testing
- [ ] Test pause functionality on mainnet (small scale)
- [ ] Verify multi-sig response times
- [ ] Test emergency withdrawal procedures
- [ ] Conduct emergency drills
- [ ] Update response procedures based on results
- **Deliverables**:
  - `EMERGENCY_RESPONSE_TEST.md` results
  - Updated procedures
  - Team training completion
- **Dependencies**: Task 44
- **Acceptance Criteria**:
  - Pause mechanism tested and working
  - Multi-sig responds within SLA
  - Emergency drills completed
  - Team trained on procedures
  - Response times documented
  - Procedures updated

---

## Summary Statistics

**Total Tasks**: 47
**Estimated Timeline**: 8-12 weeks with 2-3 developers
**Critical Path**: Tasks 1 → 5 → 6 → 7 → 8 → 9 → 15 → 16 → 20 → 23 → 35 → 36 → 44

**Phase Breakdown**:
- Phase 1 (Setup): 4 tasks - Week 1
- Phase 2 (Development): 13 tasks - Weeks 2-5
- Phase 3 (Testing): 10 tasks - Weeks 5-7
- Phase 4 (Security): 8 tasks - Weeks 7-9
- Phase 5 (Documentation): 8 tasks - Weeks 9-10
- Phase 6 (Deployment): 4 tasks - Weeks 11-12

**Key Milestones**:
1. Project setup complete (End of Week 1)
2. All contracts implemented (End of Week 5)
3. 95% test coverage achieved (End of Week 7)
4. Security audits ready (End of Week 9)
5. Testnet deployment complete (End of Week 10)
6. Mainnet launch (Week 12)

**Resource Requirements**:
- 2-3 Solidity developers
- 1 Security specialist (part-time for Phase 4)
- 2 External audit firms (external dependency)
- Access to BSC testnet and mainnet with sufficient BNB for testing

**Success Criteria Met**:
- Token creation < 3.2M gas
- Trading < 200K gas per transaction
- Graduation < 3M gas
- 95% test coverage
- ASTER-based bonding curve with 100 ASTER graduation
- PancakeSwap integration with ASTER to WBNB conversion
- 2 independent security audits
- Comprehensive documentation
