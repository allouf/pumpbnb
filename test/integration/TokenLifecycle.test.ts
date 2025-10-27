import { expect } from "chai";
import { ethers } from "hardhat";
import {
  TokenFactory,
  PlatformConfig,
  GraduationManager,
  BondingCurve,
  PumpToken,
  MockERC20,
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  deployPlatformConfig,
  deployTokenFactory,
  deployGraduationManager,
  getTestAccounts,
  parseAster,
} from "../helpers";

/**
 * Integration Tests: Complete Token Lifecycle
 *
 * These tests verify the entire journey of a token from creation to graduation:
 * 1. Token creation through factory
 * 2. Initial trading on bonding curve
 * 3. Price discovery and liquidity accumulation
 * 4. Graduation eligibility
 * 5. Migration to PancakeSwap (simulated)
 * 6. Creator allocation unlock
 */
describe("Integration: Complete Token Lifecycle", function () {
  let factory: TokenFactory;
  let config: PlatformConfig;
  let graduationManager: GraduationManager;
  let asterToken: MockERC20;

  let deployer: SignerWithAddress;
  let creator: SignerWithAddress;
  let trader1: SignerWithAddress;
  let trader2: SignerWithAddress;
  let trader3: SignerWithAddress;
  let protocolFeeRecipient: SignerWithAddress;
  let admin: SignerWithAddress;
  let pauser: SignerWithAddress;

  const VIRTUAL_ASTER_RESERVE = parseAster("30");
  const GRADUATION_THRESHOLD = parseAster("100");

  beforeEach(async function () {
    const accounts = await getTestAccounts();
    deployer = accounts.deployer;
    creator = accounts.creator;
    trader1 = accounts.trader1;
    trader2 = accounts.trader2;
    trader3 = accounts.trader3;
    protocolFeeRecipient = accounts.protocolFeeRecipient;
    admin = accounts.admin;
    pauser = accounts.pauser;

    // Deploy mock ASTER at expected address
    const MockERC20 = await ethers.getContractFactory("contracts/mocks/MockERC20.sol:MockERC20");
    const mockAsterDeploy = await MockERC20.deploy("ASTER Token", "ASTER", 18, parseAster("10000000"));

    const ASTER_ADDRESS = "0x000Ae314E2A2172a039B26378814C252734f556A";
    const mockAsterCode = await ethers.provider.getCode(await mockAsterDeploy.getAddress());
    await ethers.provider.send("hardhat_setCode", [ASTER_ADDRESS, mockAsterCode]);

    asterToken = MockERC20.attach(ASTER_ADDRESS) as MockERC20;

    await ethers.provider.send("hardhat_setStorageAt", [
      ASTER_ADDRESS,
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [deployer.address, 0])
      ),
      ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [parseAster("10000000")]),
    ]);

    // Deploy platform
    config = await deployPlatformConfig(protocolFeeRecipient.address, admin.address, pauser.address);
    factory = await deployTokenFactory(await config.getAddress(), VIRTUAL_ASTER_RESERVE);
    graduationManager = await deployGraduationManager(await config.getAddress());

    // Fund traders with ASTER
    await asterToken.mint(trader1.address, parseAster("1000"));
    await asterToken.mint(trader2.address, parseAster("1000"));
    await asterToken.mint(trader3.address, parseAster("1000"));
  });

  describe("Full Lifecycle: Creation → Trading → Graduation", function () {
    it("Should complete entire lifecycle successfully", async function () {
      // ============ PHASE 1: TOKEN CREATION ============
      const createTx = await factory
        .connect(creator)
        .createToken("Lifecycle Token", "LIFE", "ipfs://lifecycle");
      const createReceipt = await createTx.wait();

      const event = createReceipt?.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "TokenCreated";
        } catch {
          return false;
        }
      });

      const parsed = factory.interface.parseLog(event!);
      const tokenAddress = parsed?.args.token;
      const bondingCurveAddress = parsed?.args.bondingCurve;

      const token = await ethers.getContractAt("PumpToken", tokenAddress);
      const bondingCurve = await ethers.getContractAt("BondingCurve", bondingCurveAddress);

      // Verify initial state
      expect(await token.totalSupply()).to.equal(parseAster("1000000000")); // 1B tokens
      expect(await token.creator()).to.equal(creator.address);
      expect(await token.creatorAllocationUnlocked()).to.be.false;
      expect(await bondingCurve.graduated()).to.be.false;

      // ============ PHASE 2: INITIAL TRADING ============
      await asterToken.connect(trader1).approve(bondingCurveAddress, ethers.MaxUint256);
      await asterToken.connect(trader2).approve(bondingCurveAddress, ethers.MaxUint256);
      await asterToken.connect(trader3).approve(bondingCurveAddress, ethers.MaxUint256);

      const initialPrice = await bondingCurve.getPrice();

      // Trader 1 buys
      const buy1Amount = parseAster("10");
      const [expectedTokens1] = await bondingCurve.getBuyAmount(buy1Amount);
      await bondingCurve.connect(trader1).buyWithAster(buy1Amount, expectedTokens1);

      expect(await token.balanceOf(trader1.address)).to.equal(expectedTokens1);

      // Price should increase after buy
      const priceAfterBuy1 = await bondingCurve.getPrice();
      expect(priceAfterBuy1).to.be.greaterThan(initialPrice);

      // ============ PHASE 3: MULTIPLE TRADERS ============
      // Trader 2 buys
      await bondingCurve.connect(trader2).buyWithAster(parseAster("20"), 0);

      // Trader 3 buys
      await bondingCurve.connect(trader3).buyWithAster(parseAster("15"), 0);

      // Verify reserves are accumulating
      const [asterReserve1] = await bondingCurve.getReserves();
      expect(asterReserve1).to.be.greaterThan(0);
      expect(asterReserve1).to.be.lessThan(GRADUATION_THRESHOLD);

      // ============ PHASE 4: APPROACHING GRADUATION ============
      // More buying to approach threshold
      await bondingCurve.connect(trader1).buyWithAster(parseAster("30"), 0);
      await bondingCurve.connect(trader2).buyWithAster(parseAster("35"), 0);

      const [asterReserve2] = await bondingCurve.getReserves();

      // Should be eligible for graduation now
      if (asterReserve2 >= GRADUATION_THRESHOLD) {
        expect(await bondingCurve.isEligibleForGraduation()).to.be.true;
        expect(await graduationManager.checkGraduationEligibility(bondingCurveAddress)).to.be.true;

        // ============ PHASE 5: GRADUATION ============
        await bondingCurve.markGraduated();
        expect(await bondingCurve.graduated()).to.be.true;

        // ============ PHASE 6: POST-GRADUATION ============
        // Creator allocation should still be locked (unlocked by graduation manager in real flow)
        expect(await token.creatorAllocationUnlocked()).to.be.false;

        // Trading should be blocked
        await expect(
          bondingCurve.connect(trader1).buyWithAster(parseAster("1"), 0)
        ).to.be.revertedWith("Already graduated");
      }

      // Verify fee distribution
      const creatorAsterBalance = await asterToken.balanceOf(creator.address);
      const protocolAsterBalance = await asterToken.balanceOf(protocolFeeRecipient.address);

      expect(creatorAsterBalance).to.be.greaterThan(0);
      expect(protocolAsterBalance).to.be.greaterThan(0);
    });
  });

  describe("Multi-Token Scenarios", function () {
    it("Should handle multiple tokens independently", async function () {
      // Create Token 1
      const create1Tx = await factory.connect(creator).createToken("Token 1", "TK1", "ipfs://1");
      const receipt1 = await create1Tx.wait();
      const event1 = receipt1?.logs.find((log: any) => {
        try {
          return factory.interface.parseLog(log)?.name === "TokenCreated";
        } catch {
          return false;
        }
      });
      const parsed1 = factory.interface.parseLog(event1!);
      const token1Address = parsed1?.args.token;
      const bondingCurve1Address = parsed1?.args.bondingCurve;

      // Create Token 2
      const create2Tx = await factory.connect(creator).createToken("Token 2", "TK2", "ipfs://2");
      const receipt2 = await create2Tx.wait();
      const event2 = receipt2?.logs.find((log: any) => {
        try {
          return factory.interface.parseLog(log)?.name === "TokenCreated";
        } catch {
          return false;
        }
      });
      const parsed2 = factory.interface.parseLog(event2!);
      const token2Address = parsed2?.args.token;
      const bondingCurve2Address = parsed2?.args.bondingCurve;

      const bondingCurve1 = await ethers.getContractAt("BondingCurve", bondingCurve1Address);
      const bondingCurve2 = await ethers.getContractAt("BondingCurve", bondingCurve2Address);

      // Approve both curves
      await asterToken.connect(trader1).approve(bondingCurve1Address, ethers.MaxUint256);
      await asterToken.connect(trader1).approve(bondingCurve2Address, ethers.MaxUint256);

      // Trade on both
      await bondingCurve1.connect(trader1).buyWithAster(parseAster("50"), 0);
      await bondingCurve2.connect(trader1).buyWithAster(parseAster("30"), 0);

      // Verify independent reserves
      const [reserve1] = await bondingCurve1.getReserves();
      const [reserve2] = await bondingCurve2.getReserves();

      expect(reserve1).to.be.greaterThan(reserve2);
      expect(reserve1).to.not.equal(reserve2);
    });
  });

  describe("Trading Scenarios", function () {
    let token: PumpToken;
    let bondingCurve: BondingCurve;

    beforeEach(async function () {
      const createTx = await factory
        .connect(creator)
        .createToken("Test Token", "TEST", "ipfs://test");
      const receipt = await createTx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return factory.interface.parseLog(log)?.name === "TokenCreated";
        } catch {
          return false;
        }
      });
      const parsed = factory.interface.parseLog(event!);

      token = await ethers.getContractAt("PumpToken", parsed?.args.token);
      bondingCurve = await ethers.getContractAt("BondingCurve", parsed?.args.bondingCurve);

      await asterToken.connect(trader1).approve(await bondingCurve.getAddress(), ethers.MaxUint256);
      await asterToken.connect(trader2).approve(await bondingCurve.getAddress(), ethers.MaxUint256);
    });

    it("Should handle buy → sell → buy cycle correctly", async function () {
      const asterBefore = await asterToken.balanceOf(trader1.address);

      // Buy
      await bondingCurve.connect(trader1).buyWithAster(parseAster("50"), 0);
      const tokenBalance = await token.balanceOf(trader1.address);
      expect(tokenBalance).to.be.greaterThan(0);

      // Sell half
      await token.connect(trader1).approve(await bondingCurve.getAddress(), ethers.MaxUint256);
      const sellAmount = tokenBalance / 2n;
      await bondingCurve.connect(trader1).sellForAster(sellAmount, 0);

      // Buy again
      await bondingCurve.connect(trader1).buyWithAster(parseAster("20"), 0);

      const asterAfter = await asterToken.balanceOf(trader1.address);
      const finalTokenBalance = await token.balanceOf(trader1.address);

      // Should have spent net ASTER (due to fees)
      expect(asterAfter).to.be.lessThan(asterBefore);

      // Should have tokens
      expect(finalTokenBalance).to.be.greaterThan(0);
    });

    it("Should maintain price consistency across trades", async function () {
      const price1 = await bondingCurve.getPrice();

      // First buy
      await bondingCurve.connect(trader1).buyWithAster(parseAster("10"), 0);
      const price2 = await bondingCurve.getPrice();
      expect(price2).to.be.greaterThan(price1);

      // Second buy
      await bondingCurve.connect(trader2).buyWithAster(parseAster("10"), 0);
      const price3 = await bondingCurve.getPrice();
      expect(price3).to.be.greaterThan(price2);

      // Price should always increase with buys
      expect(price3).to.be.greaterThan(price2);
      expect(price2).to.be.greaterThan(price1);
    });

    it("Should accumulate fees correctly over multiple trades", async function () {
      const creatorBalanceBefore = await asterToken.balanceOf(creator.address);
      const protocolBalanceBefore = await asterToken.balanceOf(protocolFeeRecipient.address);

      // Multiple trades
      for (let i = 0; i < 5; i++) {
        await bondingCurve.connect(trader1).buyWithAster(parseAster("10"), 0);
      }

      const creatorBalanceAfter = await asterToken.balanceOf(creator.address);
      const protocolBalanceAfter = await asterToken.balanceOf(protocolFeeRecipient.address);

      const creatorFees = creatorBalanceAfter - creatorBalanceBefore;
      const protocolFees = protocolBalanceAfter - protocolBalanceBefore;

      // Protocol should receive ~2.3x more fees than creator (70 bps vs 30 bps)
      expect(protocolFees).to.be.greaterThan(creatorFees);

      // Approximate ratio check (within 10% tolerance for rounding)
      const ratio = Number(protocolFees) / Number(creatorFees);
      expect(ratio).to.be.closeTo(70 / 30, 0.3); // ~2.33
    });
  });

  describe("Edge Cases & Error Scenarios", function () {
    let token: PumpToken;
    let bondingCurve: BondingCurve;

    beforeEach(async function () {
      const createTx = await factory
        .connect(creator)
        .createToken("Edge Token", "EDGE", "ipfs://edge");
      const receipt = await createTx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return factory.interface.parseLog(log)?.name === "TokenCreated";
        } catch {
          return false;
        }
      });
      const parsed = factory.interface.parseLog(event!);

      token = await ethers.getContractAt("PumpToken", parsed?.args.token);
      bondingCurve = await ethers.getContractAt("BondingCurve", parsed?.args.bondingCurve);

      await asterToken.connect(trader1).approve(await bondingCurve.getAddress(), ethers.MaxUint256);
    });

    it("Should prevent operations when platform is paused", async function () {
      await config.connect(pauser).pause();

      await expect(
        bondingCurve.connect(trader1).buyWithAster(parseAster("10"), 0)
      ).to.be.revertedWith("Platform paused");

      await expect(
        factory.connect(creator).createToken("New", "NEW", "ipfs://new")
      ).to.be.revertedWith("Platform paused");
    });

    it("Should handle very small trade amounts", async function () {
      const verySmall = parseAster("0.001");

      await bondingCurve.connect(trader1).buyWithAster(verySmall, 0);

      const balance = await token.balanceOf(trader1.address);
      expect(balance).to.be.greaterThan(0);
    });

    it("Should enforce slippage protection", async function () {
      const buyAmount = parseAster("10");
      const [expectedTokens] = await bondingCurve.getBuyAmount(buyAmount);

      // Try to buy with unrealistic expectations
      await expect(
        bondingCurve.connect(trader1).buyWithAster(buyAmount, expectedTokens * 2n)
      ).to.be.revertedWith("Slippage exceeded");
    });

    it("Should maintain system integrity after graduation", async function () {
      // Buy to graduation
      for (let i = 0; i < 12; i++) {
        await bondingCurve.connect(trader1).buyWithAster(parseAster("10"), 0);
      }

      const [asterReserve] = await bondingCurve.getReserves();
      if (asterReserve >= GRADUATION_THRESHOLD) {
        await bondingCurve.markGraduated();

        // All trading should be blocked
        await expect(
          bondingCurve.connect(trader1).buyWithAster(parseAster("1"), 0)
        ).to.be.revertedWith("Already graduated");

        // Token metadata should still be accessible
        expect(await token.name()).to.equal("Edge Token");
        expect(await factory.tokenExists(await token.getAddress())).to.be.true;
      }
    });
  });

  describe("Creator Economics", function () {
    it("Should lock creator allocation until graduation", async function () {
      const createTx = await factory
        .connect(creator)
        .createToken("Creator Token", "CRTR", "ipfs://creator");
      const receipt = await createTx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return factory.interface.parseLog(log)?.name === "TokenCreated";
        } catch {
          return false;
        }
      });
      const parsed = factory.interface.parseLog(event!);
      const token = await ethers.getContractAt("PumpToken", parsed?.args.token);

      // Creator should have 0 tokens initially
      expect(await token.balanceOf(creator.address)).to.equal(0);

      // Creator allocation is locked
      expect(await token.creatorAllocationUnlocked()).to.be.false;
      expect(await token.getLockedBalance()).to.equal(parseAster("200000000")); // 200M
    });

    it("Should earn fees from trades", async function () {
      const createTx = await factory
        .connect(creator)
        .createToken("Fee Token", "FEE", "ipfs://fee");
      const receipt = await createTx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return factory.interface.parseLog(log)?.name === "TokenCreated";
        } catch {
          return false;
        }
      });
      const parsed = factory.interface.parseLog(event!);
      const bondingCurve = await ethers.getContractAt("BondingCurve", parsed?.args.bondingCurve);

      await asterToken.connect(trader1).approve(await bondingCurve.getAddress(), ethers.MaxUint256);

      const creatorBalanceBefore = await asterToken.balanceOf(creator.address);

      // Trade
      await bondingCurve.connect(trader1).buyWithAster(parseAster("100"), 0);

      const creatorBalanceAfter = await asterToken.balanceOf(creator.address);
      const creatorFees = creatorBalanceAfter - creatorBalanceBefore;

      // Creator should earn 0.3% of 100 ASTER = 0.3 ASTER
      expect(creatorFees).to.be.closeTo(parseAster("0.3"), parseAster("0.001"));
    });
  });
});
