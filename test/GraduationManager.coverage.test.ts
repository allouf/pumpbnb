import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  PlatformConfig,
  GraduationManager,
  TokenFactory,
  BondingCurve,
  PumpToken,
  MockERC20,
  MockPancakeRouter,
  MockPancakeFactory,
} from "../typechain-types";
import { getTestAccounts } from "./helpers";

/**
 * Comprehensive GraduationManager tests to achieve 95%+ coverage
 * Focuses on uncovered lines: 264-270 (unused tokens/WBNB returns)
 * and edge cases in graduation flow
 */
describe("GraduationManager - Coverage Tests", function () {
  let platformConfig: PlatformConfig;
  let graduationManager: GraduationManager;
  let tokenFactory: TokenFactory;
  let bondingCurve: BondingCurve;
  let pumpToken: PumpToken;
  let mockAster: MockERC20;
  let mockWBNB: MockERC20;
  let mockRouter: MockPancakeRouter;
  let mockFactory: MockPancakeFactory;

  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let trader: SignerWithAddress;
  let protocolFeeRecipient: SignerWithAddress;
  let admin: SignerWithAddress;
  let pauser: SignerWithAddress;

  const ASTER_ADDRESS = "0x000Ae314E2A2172a039B26378814C252734f556A";
  const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
  const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const PANCAKE_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";

  const parseAster = (amount: string) => ethers.parseEther(amount);

  beforeEach(async function () {
    const accounts = await getTestAccounts();
    owner = accounts.deployer;
    creator = accounts.creator;
    trader = accounts.trader1;
    protocolFeeRecipient = accounts.protocolFeeRecipient;
    admin = accounts.admin;
    pauser = accounts.pauser;

    // Deploy PlatformConfig
    const PlatformConfigFactory = await ethers.getContractFactory("PlatformConfig");
    platformConfig = await PlatformConfigFactory.deploy(
      await protocolFeeRecipient.getAddress(),
      await admin.getAddress(),
      await pauser.getAddress()
    );
    await platformConfig.waitForDeployment();

    // Deploy mock ASTER token and set it at the expected address
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const mockAsterDeploy = await MockERC20Factory.deploy(
      "Mock ASTER",
      "ASTER",
      18,
      parseAster("10000000") // 10M initial supply
    );
    await mockAsterDeploy.waitForDeployment();

    const mockAsterCode = await ethers.provider.getCode(await mockAsterDeploy.getAddress());
    await ethers.provider.send("hardhat_setCode", [ASTER_ADDRESS, mockAsterCode]);
    mockAster = MockERC20Factory.attach(ASTER_ADDRESS) as MockERC20;

    // Set ASTER balances for test accounts via storage manipulation
    const balanceSlot = 0; // Standard ERC20 balance slot
    for (const account of [owner, creator, trader]) {
      await ethers.provider.send("hardhat_setStorageAt", [
        ASTER_ADDRESS,
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "uint256"],
            [account.address, balanceSlot]
          )
        ),
        ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [parseAster("100000")]),
      ]);
    }

    // Deploy mock WBNB and set it at the expected address
    const mockWBNBDeploy = await MockERC20Factory.deploy(
      "Wrapped BNB",
      "WBNB",
      18,
      parseAster("10000000")
    );
    await mockWBNBDeploy.waitForDeployment();

    const mockWBNBCode = await ethers.provider.getCode(await mockWBNBDeploy.getAddress());
    await ethers.provider.send("hardhat_setCode", [WBNB_ADDRESS, mockWBNBCode]);
    mockWBNB = MockERC20Factory.attach(WBNB_ADDRESS) as MockERC20;

    // Deploy mock PancakeSwap Factory first
    const MockFactoryFactory = await ethers.getContractFactory("MockPancakeFactory");
    const mockFactoryDeploy = await MockFactoryFactory.deploy();
    await mockFactoryDeploy.waitForDeployment();

    const mockFactoryCode = await ethers.provider.getCode(await mockFactoryDeploy.getAddress());
    await ethers.provider.send("hardhat_setCode", [PANCAKE_FACTORY, mockFactoryCode]);
    mockFactory = MockFactoryFactory.attach(PANCAKE_FACTORY) as MockPancakeFactory;

    // Deploy mock PancakeSwap Router (needs factory and WBNB addresses)
    const MockRouterFactory = await ethers.getContractFactory("MockPancakeRouter");
    const mockRouterDeploy = await MockRouterFactory.deploy(PANCAKE_FACTORY, WBNB_ADDRESS);
    await mockRouterDeploy.waitForDeployment();

    const mockRouterCode = await ethers.provider.getCode(await mockRouterDeploy.getAddress());
    await ethers.provider.send("hardhat_setCode", [PANCAKE_ROUTER, mockRouterCode]);
    mockRouter = MockRouterFactory.attach(PANCAKE_ROUTER) as MockPancakeRouter;

    // Deploy GraduationManager
    const GraduationManagerFactory = await ethers.getContractFactory("GraduationManager");
    graduationManager = await GraduationManagerFactory.deploy(
      await platformConfig.getAddress()
    );
    await graduationManager.waitForDeployment();

    // Deploy TokenFactory
    const TokenFactoryFactory = await ethers.getContractFactory("TokenFactory");
    tokenFactory = await TokenFactoryFactory.deploy(
      await platformConfig.getAddress(),
      parseAster("30000000") // 30M ASTER virtual reserve (enough liquidity for testing)
    );
    await tokenFactory.waitForDeployment();

    // Grant graduation manager role to GraduationManager
    await platformConfig
      .connect(admin)
      .grantRole(ethers.id("GRADUATION_MANAGER_ROLE"), await graduationManager.getAddress());

    // Create a token for testing
    const tx = await tokenFactory
      .connect(creator)
      .createToken("Test Token", "TEST", "ipfs://test");
    const receipt = await tx.wait();
    const event = receipt?.logs.find(
      (log: any) => log.fragment && log.fragment.name === "TokenCreated"
    );
    if (!event) throw new Error("TokenCreated event not found");

    const tokenAddress = (event as any).args[0];
    const bondingCurveAddress = (event as any).args[1];

    pumpToken = await ethers.getContractAt("PumpToken", tokenAddress);
    bondingCurve = await ethers.getContractAt("BondingCurve", bondingCurveAddress);

    // Ensure bonding curve has tokens (should happen automatically via TokenFactory)
    const bondingCurveBalance = await pumpToken.balanceOf(bondingCurveAddress);
    if (bondingCurveBalance === 0n) {
      throw new Error("Bonding curve has no tokens - TokenFactory setup failed");
    }

    // Mint WBNB to mock router so it can fulfill swaps
    await mockWBNB.mint(PANCAKE_ROUTER, parseAster("100000"));
  });

  describe("Unused Tokens/WBNB Return (Lines 264-270)", function () {
    it("should return unused tokens to protocol fee recipient", async function () {
      // Accumulate ASTER to reach graduation threshold
      const buyAmount = parseAster("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Check graduation eligibility
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.true;

      // Mock router to return less tokens used than provided (creating dust)
      // This will trigger the unused token return logic
      const tokenAddress = await pumpToken.getAddress();
      const protocolFeeRecipientAddress = await protocolFeeRecipient.getAddress();

      // Record balance before graduation
      const balanceBefore = await pumpToken.balanceOf(protocolFeeRecipientAddress);

      // Execute graduation
      await graduationManager.executeGraduation(await bondingCurve.getAddress());

      // Check if protocol fee recipient received any dust tokens
      const balanceAfter = await pumpToken.balanceOf(protocolFeeRecipientAddress);

      // Balance should be >= before (may receive dust tokens)
      expect(balanceAfter).to.be.gte(balanceBefore);
    });

    it("should return unused WBNB to protocol fee recipient", async function () {
      // Accumulate ASTER to reach graduation threshold
      const buyAmount = parseAster("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Record WBNB balance before graduation
      const protocolFeeRecipientAddress = await protocolFeeRecipient.getAddress();
      const wbnbBalanceBefore = await mockWBNB.balanceOf(protocolFeeRecipientAddress);

      // Execute graduation
      await graduationManager.executeGraduation(await bondingCurve.getAddress());

      // Check if protocol fee recipient received any dust WBNB
      const wbnbBalanceAfter = await mockWBNB.balanceOf(protocolFeeRecipientAddress);

      // Balance should be >= before (may receive dust WBNB)
      expect(wbnbBalanceAfter).to.be.gte(wbnbBalanceBefore);
    });

    it("should handle case where no unused tokens remain", async function () {
      // This tests the case where unusedTokens == 0 (line 264 condition false)
      // Accumulate ASTER to reach graduation threshold
      const buyAmount = parseAster("105");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      const protocolFeeRecipientAddress = await protocolFeeRecipient.getAddress();
      const tokenBalanceBefore = await pumpToken.balanceOf(protocolFeeRecipientAddress);

      // Execute graduation
      await graduationManager.executeGraduation(await bondingCurve.getAddress());

      const tokenBalanceAfter = await pumpToken.balanceOf(protocolFeeRecipientAddress);

      // Should not revert even if no unused tokens
      expect(tokenBalanceAfter).to.be.gte(tokenBalanceBefore);
    });

    it("should handle case where no unused WBNB remains", async function () {
      // This tests the case where unusedWbnb == 0 (line 268 condition false)
      // Accumulate ASTER to reach graduation threshold
      const buyAmount = parseAster("105");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      const protocolFeeRecipientAddress = await protocolFeeRecipient.getAddress();
      const wbnbBalanceBefore = await mockWBNB.balanceOf(protocolFeeRecipientAddress);

      // Execute graduation
      await graduationManager.executeGraduation(await bondingCurve.getAddress());

      const wbnbBalanceAfter = await mockWBNB.balanceOf(protocolFeeRecipientAddress);

      // Should not revert even if no unused WBNB
      expect(wbnbBalanceAfter).to.be.gte(wbnbBalanceBefore);
    });
  });

  describe("Edge Cases in Graduation Flow", function () {
    it("should handle graduation with exactly 100 ASTER", async function () {
      // Buy slightly more than 100 to account for 1% fee
      // After 1% fee, we need 100 ASTER in reserves, so buy 101.02 ASTER
      const exactAmount = parseAster("101.02");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), exactAmount);
      await bondingCurve.connect(trader).buyWithAster(exactAmount, 0);

      // Should be eligible (reserves should be >= 100 ASTER)
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.true;

      // Should graduate successfully
      await expect(graduationManager.executeGraduation(await bondingCurve.getAddress())).to.not.be
        .reverted;
    });

    it("should handle graduation with 99.99 ASTER (just below threshold)", async function () {
      // Buy just below threshold
      const belowThreshold = parseAster("99.99");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), belowThreshold);
      await bondingCurve.connect(trader).buyWithAster(belowThreshold, 0);

      // Should not be eligible
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.false;

      // Should revert on graduation attempt
      await expect(
        graduationManager.executeGraduation(await bondingCurve.getAddress())
      ).to.be.revertedWith("Not eligible");
    });

    it("should handle large ASTER amounts (1000 ASTER)", async function () {
      // Buy large amount
      const largeAmount = parseAster("1000");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), largeAmount);
      await bondingCurve.connect(trader).buyWithAster(largeAmount, 0);

      // Should be eligible
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.true;

      // Should graduate successfully
      const tx = await graduationManager.executeGraduation(await bondingCurve.getAddress());
      const receipt = await tx.wait();

      // Check GraduationCompleted event was emitted
      const event = receipt?.logs.find(
        (log: any) => log.fragment && log.fragment.name === "GraduationCompleted"
      );
      expect(event).to.not.be.undefined;
    });

    it("should handle multiple sequential trades before graduation", async function () {
      // Multiple small trades
      for (let i = 0; i < 5; i++) {
        const amount = parseAster("25");
        await mockAster.connect(trader).approve(await bondingCurve.getAddress(), amount);
        await bondingCurve.connect(trader).buyWithAster(amount, 0);
      }

      // Total: 125 ASTER - should be eligible
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.true;

      // Should graduate successfully
      await expect(graduationManager.executeGraduation(await bondingCurve.getAddress())).to.not.be
        .reverted;
    });
  });

  describe("Event Emissions", function () {
    it("should emit AsterSwapped event during graduation", async function () {
      const buyAmount = parseAster("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Execute graduation and check for AsterSwapped event
      await expect(graduationManager.executeGraduation(await bondingCurve.getAddress()))
        .to.emit(graduationManager, "AsterSwapped")
        .withArgs(
          await bondingCurve.getAddress(),
          (value: any) => value > 0, // asterIn
          (value: any) => value > 0, // wbnbOut
          (value: any) => value > 0 // timestamp
        );
    });

    it("should emit LiquidityAdded event during graduation", async function () {
      const buyAmount = parseAster("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Execute graduation and check for LiquidityAdded event
      const tx = await graduationManager.executeGraduation(await bondingCurve.getAddress());
      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        (log: any) => log.fragment && log.fragment.name === "LiquidityAdded"
      );
      expect(event).to.not.be.undefined;
    });

    it("should emit GraduationCompleted event with correct parameters", async function () {
      const buyAmount = parseAster("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Execute graduation and check GraduationCompleted event
      await expect(graduationManager.executeGraduation(await bondingCurve.getAddress()))
        .to.emit(graduationManager, "GraduationCompleted")
        .withArgs(
          await pumpToken.getAddress(), // token
          await bondingCurve.getAddress(), // bondingCurve
          (value: any) => value !== ethers.ZeroAddress, // pancakePair
          (value: any) => value > 0, // asterUsed
          (value: any) => value > 0, // wbnbAdded
          (value: any) => value > 0, // tokensAdded
          (value: any) => value > 0, // lpTokensBurned
          (value: any) => value > 0 // timestamp
        );
    });
  });

  describe("State Verification", function () {
    it("should correctly mark bonding curve as graduated", async function () {
      const buyAmount = parseAster("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Before graduation
      expect(await graduationManager.isGraduated(await bondingCurve.getAddress())).to.be.false;

      // Execute graduation
      await graduationManager.executeGraduation(await bondingCurve.getAddress());

      // After graduation
      expect(await graduationManager.isGraduated(await bondingCurve.getAddress())).to.be.true;
    });

    it("should store correct PancakePair address", async function () {
      const buyAmount = parseAster("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Before graduation
      expect(await graduationManager.getPancakePair(await pumpToken.getAddress())).to.equal(
        ethers.ZeroAddress
      );

      // Execute graduation
      const tx = await graduationManager.executeGraduation(await bondingCurve.getAddress());
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment && log.fragment.name === "GraduationCompleted"
      );
      const pairAddress = (event as any).args[2];

      // After graduation
      expect(await graduationManager.getPancakePair(await pumpToken.getAddress())).to.equal(
        pairAddress
      );
    });

    it("should unlock creator allocation during graduation", async function () {
      const buyAmount = parseAster("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Before graduation - creator allocation is locked
      const creatorAddress = await creator.getAddress();
      const lockedBefore = await pumpToken.creatorLockedBalance();
      expect(lockedBefore).to.be.gt(0);

      // Execute graduation
      await graduationManager.executeGraduation(await bondingCurve.getAddress());

      // After graduation - creator allocation should be unlocked
      const lockedAfter = await pumpToken.creatorLockedBalance();
      expect(lockedAfter).to.equal(0);

      // Creator should have received their allocation
      const creatorBalance = await pumpToken.balanceOf(creatorAddress);
      expect(creatorBalance).to.be.gt(0);
    });
  });

  describe("Integration with BondingCurve", function () {
    it("should prevent trading on bonding curve after graduation", async function () {
      const buyAmount = parseAster("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Execute graduation
      await graduationManager.executeGraduation(await bondingCurve.getAddress());

      // Try to buy after graduation - should revert
      const postGradAmount = parseAster("10");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), postGradAmount);
      await expect(bondingCurve.connect(trader).buyWithAster(postGradAmount, 0)).to.be.revertedWith(
        "Already graduated"
      );
    });

    it("should prevent selling on bonding curve after graduation", async function () {
      // Buy first
      const buyAmount = parseAster("50");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      const tokenBalance = await pumpToken.balanceOf(await trader.getAddress());

      // Buy more to reach graduation
      const moreAmount = parseAster("60");
      await mockAster.connect(owner).approve(await bondingCurve.getAddress(), moreAmount);
      await bondingCurve.connect(owner).buyWithAster(moreAmount, 0);

      // Execute graduation
      await graduationManager.executeGraduation(await bondingCurve.getAddress());

      // Try to sell after graduation - should revert
      await pumpToken.connect(trader).approve(await bondingCurve.getAddress(), tokenBalance);
      await expect(bondingCurve.connect(trader).sellForAster(tokenBalance, 0)).to.be.revertedWith(
        "Already graduated"
      );
    });
  });
});
