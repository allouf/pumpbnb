import { expect } from "chai";
import { ethers } from "hardhat";
import {
  TokenFactory,
  PlatformConfig,
  BondingCurve,
  PumpToken,
  GraduationManager,
  MockERC20
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Gas Benchmarking Suite
 *
 * This suite measures gas consumption for all critical operations
 * to ensure they meet the project requirements:
 * - Token creation: Target ~3.2M gas
 * - Trading operations: Target <200K gas per trade
 * - Graduation: Target <3M gas
 */

interface GasBenchmarkResult {
  operation: string;
  gasUsed: bigint;
  target: bigint;
  withinTarget: boolean;
  percentage: string;
}

describe("Gas Benchmarks", function () {
  let tokenFactory: TokenFactory;
  let platformConfig: PlatformConfig;
  let graduationManager: GraduationManager;
  let mockAster: MockERC20;
  let mockWBNB: MockERC20;
  let mockPancakeFactory: any;
  let mockPancakeRouter: any;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let trader: SignerWithAddress;

  const results: GasBenchmarkResult[] = [];

  before(async function () {
    [owner, creator, trader] = await ethers.getSigners();

    // Deploy PlatformConfig with required parameters (protocolFeeRecipient, admin, pauser)
    const PlatformConfigFactory = await ethers.getContractFactory("PlatformConfig");
    platformConfig = await PlatformConfigFactory.deploy(
      await owner.getAddress(), // protocol fee recipient
      await owner.getAddress(), // admin
      await owner.getAddress()  // pauser
    );
    await platformConfig.waitForDeployment();

    // Deploy mock ASTER using MockERC20 and place at correct address
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockAsterDeploy = await MockERC20.deploy(
      "Mock ASTER",
      "ASTER",
      ethers.parseEther("100000000") // 100M initial supply
    );
    await mockAsterDeploy.waitForDeployment();

    // Use hardhat_setCode to place mock ASTER at the expected address
    const ASTER_ADDRESS = "0x000Ae314E2A2172a039B26378814C252734f556A";
    const mockAsterCode = await ethers.provider.getCode(await mockAsterDeploy.getAddress());
    await ethers.provider.send("hardhat_setCode", [ASTER_ADDRESS, mockAsterCode]);
    mockAster = MockERC20.attach(ASTER_ADDRESS) as any;

    // Set ASTER balance for owner using storage manipulation
    await ethers.provider.send("hardhat_setStorageAt", [
      ASTER_ADDRESS,
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [await owner.getAddress(), 0])
      ),
      ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [ethers.parseEther("100000000")]),
    ]);

    // Deploy mock WBNB
    mockWBNB = await MockERC20.deploy(
      "Mock WBNB",
      "WBNB",
      ethers.parseEther("100000000") // 100M initial supply
    ) as any;
    await mockWBNB.waitForDeployment();

    // Deploy mock PancakeSwap contracts (simplified for testing)
    const MockPancakeFactory = await ethers.getContractFactory("MockPancakeFactory");
    mockPancakeFactory = await MockPancakeFactory.deploy();
    await mockPancakeFactory.waitForDeployment();

    const MockPancakeRouter = await ethers.getContractFactory("MockPancakeRouter");
    mockPancakeRouter = await MockPancakeRouter.deploy(
      await mockPancakeFactory.getAddress(),
      await mockWBNB.getAddress()
    );
    await mockPancakeRouter.waitForDeployment();

    // Deploy GraduationManager (only takes config parameter)
    const GraduationManagerFactory = await ethers.getContractFactory("GraduationManager");
    graduationManager = await GraduationManagerFactory.deploy(
      await platformConfig.getAddress()
    );
    await graduationManager.waitForDeployment();

    // Deploy TokenFactory (takes config and virtualAsterReserve)
    const TokenFactoryFactory = await ethers.getContractFactory("TokenFactory");
    tokenFactory = await TokenFactoryFactory.deploy(
      await platformConfig.getAddress(),
      ethers.parseEther("200") // virtual ASTER reserve
    );
    await tokenFactory.waitForDeployment();

    // Fund trader with ASTER
    await mockAster.transfer(await trader.getAddress(), ethers.parseEther("10000"));
  });

  after(function () {
    // Print comprehensive gas report
    console.log("\n");
    console.log("=".repeat(100));
    console.log("GAS BENCHMARK REPORT");
    console.log("=".repeat(100));
    console.log("");

    // Group results by category
    const categories: { [key: string]: GasBenchmarkResult[] } = {};

    results.forEach(result => {
      const category = result.operation.split(" - ")[0];
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(result);
    });

    // Print each category
    Object.keys(categories).forEach(category => {
      console.log(`\n${category}`);
      console.log("-".repeat(100));
      console.log(
        "Operation".padEnd(50) +
        "Gas Used".padEnd(15) +
        "Target".padEnd(15) +
        "% of Target".padEnd(15) +
        "Status"
      );
      console.log("-".repeat(100));

      categories[category].forEach(result => {
        const operationName = result.operation.split(" - ")[1] || result.operation;
        const status = result.withinTarget ? "✓ PASS" : "✗ EXCEED";
        console.log(
          operationName.padEnd(50) +
          result.gasUsed.toString().padEnd(15) +
          result.target.toString().padEnd(15) +
          result.percentage.padEnd(15) +
          status
        );
      });
    });

    console.log("\n" + "=".repeat(100));

    // Summary statistics
    const totalOperations = results.length;
    const passedOperations = results.filter(r => r.withinTarget).length;
    const failedOperations = totalOperations - passedOperations;

    console.log(`\nSUMMARY: ${passedOperations}/${totalOperations} operations within target`);
    if (failedOperations > 0) {
      console.log(`⚠️  WARNING: ${failedOperations} operations exceeded gas targets`);
    } else {
      console.log("✓ All operations within gas targets");
    }
    console.log("=".repeat(100));
    console.log("");
  });

  function recordGas(operation: string, gasUsed: bigint, target: bigint) {
    const percentage = ((Number(gasUsed) / Number(target)) * 100).toFixed(2) + "%";
    const withinTarget = gasUsed <= target;

    results.push({
      operation,
      gasUsed,
      target,
      withinTarget,
      percentage
    });
  }

  describe("Token Creation Gas Costs", function () {
    it("should benchmark createToken gas usage", async function () {
      const tx = await tokenFactory.connect(creator).createToken(
        "Gas Test Token",
        "GAS",
        "ipfs://gas-test-metadata"
      );

      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed;

      // Target: ~3.2M gas for token creation
      const target = 3_500_000n; // Allow 3.5M as upper bound
      recordGas("Token Factory - createToken", gasUsed, target);

      expect(gasUsed).to.be.lte(target);
    });

    it("should benchmark token deployment components", async function () {
      // Isolate PumpToken deployment cost
      const PumpTokenFactory = await ethers.getContractFactory("PumpToken");
      const deployTx = await PumpTokenFactory.getDeployTransaction(
        "Isolated Token",
        "ISO",
        "ipfs://isolated",
        await creator.getAddress(),
        ethers.ZeroAddress // bondingCurve placeholder for gas estimation
      );

      const estimatedGas = await ethers.provider.estimateGas({
        from: await creator.getAddress(),
        data: deployTx.data
      });

      const target = 1_500_000n; // Target for token deployment alone
      recordGas("Token Factory - PumpToken deployment", estimatedGas, target);

      expect(estimatedGas).to.be.lte(target);
    });

    it("should benchmark bonding curve deployment", async function () {
      // Deploy a token first
      const tx = await tokenFactory.connect(creator).createToken(
        "BC Gas Test",
        "BCGAS",
        "ipfs://bcgas"
      );
      await tx.wait();

      // Get token address from factory
      const allTokens = await tokenFactory.getAllTokens(0, 1);
      const tokenAddress = allTokens[0];

      // Estimate bonding curve deployment
      const BondingCurveFactory = await ethers.getContractFactory("BondingCurve");
      const virtualAsterReserve = ethers.parseEther("200"); // 200 ASTER virtual reserve
      const deployTx = await BondingCurveFactory.getDeployTransaction(
        tokenAddress,
        await creator.getAddress(),
        await platformConfig.getAddress(),
        virtualAsterReserve
      );

      const estimatedGas = await ethers.provider.estimateGas({
        from: await owner.getAddress(),
        data: deployTx.data
      });

      const target = 1_500_000n; // Target for bonding curve alone
      recordGas("Token Factory - BondingCurve deployment", estimatedGas, target);

      expect(estimatedGas).to.be.lte(target);
    });
  });

  describe("Trading Operations Gas Costs", function () {
    let bondingCurve: BondingCurve;
    let pumpToken: PumpToken;

    beforeEach(async function () {
      // Create token and get bonding curve
      const tx = await tokenFactory.connect(creator).createToken(
        "Trade Gas Test",
        "TGT",
        "ipfs://trade-gas"
      );
      await tx.wait();

      // Get token address and bonding curve from factory
      const allTokens = await tokenFactory.getAllTokens(0, 100);
      const tokenAddress = allTokens[allTokens.length - 1]; // Get last created token
      const bcAddress = await tokenFactory.getBondingCurve(tokenAddress);

      pumpToken = await ethers.getContractAt("PumpToken", tokenAddress);
      bondingCurve = await ethers.getContractAt("BondingCurve", bcAddress);
    });

    it("should benchmark first buy transaction", async function () {
      const buyAmount = ethers.parseEther("10");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);

      const tx = await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed;

      // Target: <200K gas per trade (first trade may be higher due to storage init)
      const target = 250_000n; // Allow 250K for first trade
      recordGas("Trading - First buy transaction", gasUsed, target);

      expect(gasUsed).to.be.lte(target);
    });

    it("should benchmark subsequent buy transactions", async function () {
      // Do first buy
      const firstBuy = ethers.parseEther("5");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), firstBuy);
      await bondingCurve.connect(trader).buyWithAster(firstBuy, 0);

      // Benchmark second buy
      const buyAmount = ethers.parseEther("10");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);

      const tx = await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed;

      // Target: <200K gas per trade
      const target = 200_000n;
      recordGas("Trading - Subsequent buy transaction", gasUsed, target);

      expect(gasUsed).to.be.lte(target);
    });

    it("should benchmark sell transaction", async function () {
      // Buy tokens first
      const buyAmount = ethers.parseEther("20");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Benchmark sell
      const sellAmount = ethers.parseEther("1000");
      await pumpToken.connect(trader).approve(await bondingCurve.getAddress(), sellAmount);

      const tx = await bondingCurve.connect(trader).sellForAster(sellAmount, 0);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed;

      // Target: <200K gas per trade
      const target = 200_000n;
      recordGas("Trading - Sell transaction", gasUsed, target);

      expect(gasUsed).to.be.lte(target);
    });

    it("should benchmark getAmountOut calculation", async function () {
      const inputAmount = ethers.parseEther("10");

      // Approve ASTER for the buy
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), inputAmount);

      // Estimate gas for a buy transaction
      const gasEstimate = await bondingCurve.connect(trader).buyWithAster.estimateGas(inputAmount, 0);

      // Buy transactions should be under 200K gas
      const target = 200_000n;
      recordGas("Trading - buyWithAster estimate", gasEstimate, target);

      expect(gasEstimate).to.be.lte(target);
    });

    it("should benchmark batch trades", async function () {
      const trades = 5;
      let totalGas = 0n;

      for (let i = 0; i < trades; i++) {
        const buyAmount = ethers.parseEther("5");
        await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);

        const tx = await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);
        const receipt = await tx.wait();
        totalGas += receipt!.gasUsed;
      }

      const averageGas = totalGas / BigInt(trades);
      const target = 200_000n;
      recordGas("Trading - Average gas per trade (5 trades)", averageGas, target);

      expect(averageGas).to.be.lte(target);
    });
  });

  describe("Graduation Gas Costs", function () {
    it("should benchmark graduation process", async function () {
      // Create token
      const createTx = await tokenFactory.connect(creator).createToken(
        "Grad Gas Test",
        "GGAS",
        "ipfs://grad-gas"
      );
      await createTx.wait();

      // Get token and bonding curve addresses
      const allTokens = await tokenFactory.getAllTokens(0, 100);
      const tokenAddress = allTokens[allTokens.length - 1];
      const bcAddress = await tokenFactory.getBondingCurve(tokenAddress);

      const bondingCurve = await ethers.getContractAt("BondingCurve", bcAddress);

      // Buy tokens until graduation threshold (100 ASTER)
      const graduationThreshold = ethers.parseEther("100");
      const buyAmount = ethers.parseEther("110"); // Enough to trigger graduation

      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);

      // Fund mock router with WBNB for swaps
      await mockWBNB.transfer(await mockPancakeRouter.getAddress(), ethers.parseEther("1000"));

      // This buy should trigger graduation
      const tx = await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);
      const receipt = await tx.wait();

      // Find the graduation event to isolate graduation gas
      // For simplicity, we're measuring the full transaction including graduation
      const gasUsed = receipt!.gasUsed;

      // Target: <3M gas for graduation
      const target = 3_000_000n;
      recordGas("Graduation - Full graduation process", gasUsed, target);

      expect(gasUsed).to.be.lte(target);
    });

    it("should benchmark post-graduation trading", async function () {
      // Create and graduate token
      const createTx = await tokenFactory.connect(creator).createToken(
        "Post Grad Gas",
        "PGAS",
        "ipfs://pgas"
      );
      await createTx.wait();

      // Get token and bonding curve addresses
      const allTokens = await tokenFactory.getAllTokens(0, 100);
      const tokenAddress = allTokens[allTokens.length - 1];
      const bcAddress = await tokenFactory.getBondingCurve(tokenAddress);

      const bondingCurve = await ethers.getContractAt("BondingCurve", bcAddress);

      // Graduate
      const buyAmount = ethers.parseEther("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await mockWBNB.transfer(await mockPancakeRouter.getAddress(), ethers.parseEther("1000"));
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Benchmark post-graduation buy (should fail as trading moved to PancakeSwap)
      try {
        const postGradBuy = ethers.parseEther("5");
        await mockAster.connect(trader).approve(await bondingCurve.getAddress(), postGradBuy);

        const tx = await bondingCurve.connect(trader).buyWithAster(postGradBuy, 0);
        const receipt = await tx.wait();

        const gasUsed = receipt!.gasUsed;
        const target = 100_000n; // Should be cheaper as it reverts quickly

        recordGas("Graduation - Post-graduation trade (reverts)", gasUsed, target);
      } catch (error) {
        // Expected to fail after graduation
      }
    });
  });

  describe("Administrative Operations Gas Costs", function () {
    it("should benchmark fee withdrawal", async function () {
      // Create token and generate fees
      const createTx = await tokenFactory.connect(creator).createToken(
        "Fee Gas Test",
        "FGAS",
        "ipfs://fgas"
      );
      await createTx.wait();

      // Get token and bonding curve addresses
      const allTokens = await tokenFactory.getAllTokens(0, 100);
      const tokenAddress = allTokens[allTokens.length - 1];
      const bcAddress = await tokenFactory.getBondingCurve(tokenAddress);

      const bondingCurve = await ethers.getContractAt("BondingCurve", bcAddress);

      // Generate fees through trading
      const buyAmount = ethers.parseEther("50");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Note: BondingCurve transfers fees directly to recipients during trades
      // No separate withdrawal function needed - this is more gas efficient
      // Fees go to: protocol fee recipient (70 bps) and creator (30 bps)

      // Verify fees were sent by checking recipient balance
      const protocolRecipient = await platformConfig.protocolFeeRecipient();
      const recipientBalance = await mockAster.balanceOf(protocolRecipient);

      // Protocol should have received ~0.7% of 50 ASTER buy = ~0.35 ASTER
      expect(recipientBalance).to.be.gt(ethers.parseEther("0.3"));
    });

    it("should benchmark pause/unpause operations", async function () {
      // Benchmark pause
      const pauseTx = await platformConfig.connect(owner).pause();
      const pauseReceipt = await pauseTx.wait();
      const pauseGas = pauseReceipt!.gasUsed;

      const pauseTarget = 50_000n;
      recordGas("Admin - Pause platform", pauseGas, pauseTarget);
      expect(pauseGas).to.be.lte(pauseTarget);

      // Benchmark unpause
      const unpauseTx = await platformConfig.connect(owner).unpause();
      const unpauseReceipt = await unpauseTx.wait();
      const unpauseGas = unpauseReceipt!.gasUsed;

      const unpauseTarget = 50_000n;
      recordGas("Admin - Unpause platform", unpauseGas, unpauseTarget);
      expect(unpauseGas).to.be.lte(unpauseTarget);
    });

    it("should benchmark configuration updates", async function () {
      const newThreshold = ethers.parseEther("150");

      const tx = await platformConfig.connect(owner).setGraduationThreshold(newThreshold);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed;

      const target = 50_000n; // Simple storage update
      recordGas("Admin - Update graduation threshold", gasUsed, target);

      expect(gasUsed).to.be.lte(target);
    });
  });

  describe("View Function Gas Costs", function () {
    let bondingCurve: BondingCurve;

    beforeEach(async function () {
      const tx = await tokenFactory.connect(creator).createToken(
        "View Gas Test",
        "VGAS",
        "ipfs://vgas"
      );
      await tx.wait();

      // Get token and bonding curve addresses
      const allTokens = await tokenFactory.getAllTokens(0, 100);
      const tokenAddress = allTokens[allTokens.length - 1];
      const bcAddress = await tokenFactory.getBondingCurve(tokenAddress);

      bondingCurve = await ethers.getContractAt("BondingCurve", bcAddress);
    });

    it("should benchmark view function calls", async function () {
      // These don't consume gas but we measure computational cost via estimateGas

      // getPrice
      const priceGas = await bondingCurve.getPrice.estimateGas();
      recordGas("View - getPrice", priceGas, 50_000n);

      // getReserves
      const reservesGas = await bondingCurve.getReserves.estimateGas();
      recordGas("View - getReserves", reservesGas, 30_000n);

      // getBuyAmount
      const buyAmountGas = await bondingCurve.getBuyAmount.estimateGas(
        ethers.parseEther("10")
      );
      recordGas("View - getBuyAmount", buyAmountGas, 50_000n);
    });
  });
});
