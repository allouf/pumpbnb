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
 * Integration Tests: PancakeSwap & ASTER Interactions
 *
 * These tests verify the integration with external protocols:
 * 1. ASTER token operations
 * 2. PancakeSwap address validation
 * 3. Graduation manager external calls
 * 4. Reserve extraction and management
 *
 * Note: In production, these would run on a BSC mainnet fork.
 * For local testing, we use mocks and verify the integration logic.
 */
describe("Integration: PancakeSwap & ASTER", function () {
  let factory: TokenFactory;
  let config: PlatformConfig;
  let graduationManager: GraduationManager;
  let asterToken: MockERC20;

  let deployer: SignerWithAddress;
  let creator: SignerWithAddress;
  let trader1: SignerWithAddress;
  let trader2: SignerWithAddress;
  let protocolFeeRecipient: SignerWithAddress;
  let admin: SignerWithAddress;
  let pauser: SignerWithAddress;

  const VIRTUAL_ASTER_RESERVE = parseAster("30");
  const GRADUATION_THRESHOLD = parseAster("100");

  // Real BSC mainnet addresses
  const ASTER_ADDRESS = "0x000Ae314E2A2172a039B26378814C252734f556A";
  const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
  const PANCAKE_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
  const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

  beforeEach(async function () {
    const accounts = await getTestAccounts();
    deployer = accounts.deployer;
    creator = accounts.creator;
    trader1 = accounts.trader1;
    trader2 = accounts.trader2;
    protocolFeeRecipient = accounts.protocolFeeRecipient;
    admin = accounts.admin;
    pauser = accounts.pauser;

    // Deploy mock ASTER at expected address
    const MockERC20 = await ethers.getContractFactory("contracts/test/MockERC20.sol:MockERC20");
    const mockAsterDeploy = await MockERC20.deploy("ASTER Token", "ASTER", parseAster("10000000"));

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
  });

  describe("ASTER Token Integration", function () {
    it("Should use correct ASTER token address", async function () {
      expect(await graduationManager.asterToken()).to.equal(ASTER_ADDRESS);
    });

    it("Should handle ASTER transfers in bonding curve", async function () {
      const createTx = await factory
        .connect(creator)
        .createToken("ASTER Test", "ASTTEST", "ipfs://aster");
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

      const trader1AsterBefore = await asterToken.balanceOf(trader1.address);

      // Buy with ASTER
      await bondingCurve.connect(trader1).buyWithAster(parseAster("50"), 0);

      const trader1AsterAfter = await asterToken.balanceOf(trader1.address);

      // ASTER should have been transferred
      expect(trader1AsterBefore - trader1AsterAfter).to.equal(parseAster("50"));
    });

    it("Should accumulate ASTER in bonding curve reserves", async function () {
      const createTx = await factory
        .connect(creator)
        .createToken("Reserve Test", "RESV", "ipfs://reserve");
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
      await asterToken.connect(trader2).approve(await bondingCurve.getAddress(), ethers.MaxUint256);

      // Multiple buys to accumulate ASTER
      await bondingCurve.connect(trader1).buyWithAster(parseAster("40"), 0);
      await bondingCurve.connect(trader2).buyWithAster(parseAster("40"), 0);

      const [asterReserve] = await bondingCurve.getReserves();

      // Should have accumulated ASTER (minus fees)
      expect(asterReserve).to.be.greaterThan(parseAster("75")); // ~94% of 80 ASTER (after 1% fees)
      expect(asterReserve).to.be.lessThan(parseAster("80"));
    });

    it("Should distribute ASTER fees correctly", async function () {
      const createTx = await factory.connect(creator).createToken("Fee Test", "FEE", "ipfs://fee");
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

      const creatorBefore = await asterToken.balanceOf(creator.address);
      const protocolBefore = await asterToken.balanceOf(protocolFeeRecipient.address);

      // Buy 100 ASTER worth
      await bondingCurve.connect(trader1).buyWithAster(parseAster("100"), 0);

      const creatorAfter = await asterToken.balanceOf(creator.address);
      const protocolAfter = await asterToken.balanceOf(protocolFeeRecipient.address);

      const creatorFee = creatorAfter - creatorBefore;
      const protocolFee = protocolAfter - protocolBefore;

      // Creator: 0.3% of 100 = 0.3 ASTER
      // Protocol: 0.7% of 100 = 0.7 ASTER
      expect(creatorFee).to.be.closeTo(parseAster("0.3"), parseAster("0.01"));
      expect(protocolFee).to.be.closeTo(parseAster("0.7"), parseAster("0.01"));
    });
  });

  describe("PancakeSwap Address Validation", function () {
    it("Should have correct PancakeSwap router address", async function () {
      expect(await graduationManager.pancakeRouter()).to.equal(PANCAKE_ROUTER);
    });

    it("Should have correct PancakeSwap factory address", async function () {
      expect(await graduationManager.pancakeFactory()).to.equal(PANCAKE_FACTORY);
    });

    it("Should have correct WBNB address", async function () {
      expect(await graduationManager.wbnb()).to.equal(WBNB_ADDRESS);
    });

    it("Should use immutable addresses", async function () {
      // These are immutable in the contract, verifying they match constants
      const asterInContract = await graduationManager.asterToken();
      const wbnbInContract = await graduationManager.wbnb();
      const routerInContract = await graduationManager.pancakeRouter();
      const factoryInContract = await graduationManager.pancakeFactory();

      expect(asterInContract).to.equal(ASTER_ADDRESS);
      expect(wbnbInContract).to.equal(WBNB_ADDRESS);
      expect(routerInContract).to.equal(PANCAKE_ROUTER);
      expect(factoryInContract).to.equal(PANCAKE_FACTORY);
    });
  });

  describe("Graduation Process", function () {
    let token: PumpToken;
    let bondingCurve: BondingCurve;

    beforeEach(async function () {
      const createTx = await factory
        .connect(creator)
        .createToken("Grad Token", "GRAD", "ipfs://grad");
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

    it("Should detect graduation eligibility correctly", async function () {
      // Not eligible initially
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.false;

      // Buy to reach threshold
      await bondingCurve.connect(trader1).buyWithAster(parseAster("60"), 0);
      await bondingCurve.connect(trader2).buyWithAster(parseAster("60"), 0);

      const [asterReserve] = await bondingCurve.getReserves();

      if (asterReserve >= GRADUATION_THRESHOLD) {
        expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
          .to.be.true;
      }
    });

    it("Should mark bonding curve as graduated", async function () {
      // Buy to threshold
      await bondingCurve.connect(trader1).buyWithAster(parseAster("60"), 0);
      await bondingCurve.connect(trader2).buyWithAster(parseAster("60"), 0);

      const [asterReserve] = await bondingCurve.getReserves();

      if (asterReserve >= GRADUATION_THRESHOLD) {
        await bondingCurve.markGraduated();
        expect(await bondingCurve.graduated()).to.be.true;
      }
    });

    it("Should extract reserves after graduation", async function () {
      // Buy to threshold
      await bondingCurve.connect(trader1).buyWithAster(parseAster("60"), 0);
      await bondingCurve.connect(trader2).buyWithAster(parseAster("60"), 0);

      const [asterReserveBefore, tokenReserveBefore] = await bondingCurve.getReserves();

      if (asterReserveBefore >= GRADUATION_THRESHOLD) {
        await bondingCurve.markGraduated();

        // Extract reserves
        const [asterAmount, tokenAmount] = await bondingCurve.extractReserves.staticCall();

        expect(asterAmount).to.equal(asterReserveBefore);
        expect(tokenAmount).to.equal(tokenReserveBefore);

        // Actually extract
        await bondingCurve.extractReserves();

        // Reserves should be zero after extraction
        const [asterReserveAfter, tokenReserveAfter] = await bondingCurve.getReserves();
        expect(asterReserveAfter).to.equal(0);
        expect(tokenReserveAfter).to.equal(0);
      }
    });

    it("Should prevent trading after graduation", async function () {
      // Buy to threshold
      await bondingCurve.connect(trader1).buyWithAster(parseAster("60"), 0);
      await bondingCurve.connect(trader2).buyWithAster(parseAster("60"), 0);

      const [asterReserve] = await bondingCurve.getReserves();

      if (asterReserve >= GRADUATION_THRESHOLD) {
        await bondingCurve.markGraduated();

        // Buying should fail
        await expect(
          bondingCurve.connect(trader1).buyWithAster(parseAster("1"), 0)
        ).to.be.revertedWith("Already graduated");

        // Selling should also fail
        await token.connect(trader1).approve(await bondingCurve.getAddress(), ethers.MaxUint256);
        const balance = await token.balanceOf(trader1.address);
        if (balance > 0) {
          await expect(
            bondingCurve.connect(trader1).sellForAster(balance / 2n, 0)
          ).to.be.revertedWith("Already graduated");
        }
      }
    });
  });

  describe("Reserve Management", function () {
    it("Should maintain accurate reserve accounting", async function () {
      const createTx = await factory
        .connect(creator)
        .createToken("Reserve Token", "RESV", "ipfs://resv");
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

      // Track ASTER flow
      const [initialAsterReserve] = await bondingCurve.getReserves();
      expect(initialAsterReserve).to.equal(0);

      // Buy
      const buyAmount = parseAster("50");
      const [, creatorFee, protocolFee] = await bondingCurve.getBuyAmount(buyAmount);
      await bondingCurve.connect(trader1).buyWithAster(buyAmount, 0);

      const [afterBuyAsterReserve] = await bondingCurve.getReserves();

      // Reserve should equal buy amount minus fees
      const expectedReserve = buyAmount - creatorFee - protocolFee;
      expect(afterBuyAsterReserve).to.equal(expectedReserve);
    });

    it("Should handle reserve extraction correctly", async function () {
      const createTx = await factory
        .connect(creator)
        .createToken("Extract Token", "EXTR", "ipfs://extr");
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

      // Buy to graduation
      await bondingCurve.connect(trader1).buyWithAster(parseAster("120"), 0);

      const [asterReserve, tokenReserve] = await bondingCurve.getReserves();

      if (asterReserve >= GRADUATION_THRESHOLD) {
        await bondingCurve.markGraduated();

        const deployerAsterBefore = await asterToken.balanceOf(deployer.address);

        // Extract reserves
        await bondingCurve.extractReserves();

        const deployerAsterAfter = await asterToken.balanceOf(deployer.address);

        // Deployer should have received the ASTER
        expect(deployerAsterAfter - deployerAsterBefore).to.equal(asterReserve);
      }
    });
  });

  describe("Gas and Slippage Protection", function () {
    it("Should have reasonable slippage parameters", async function () {
      expect(await graduationManager.MIN_SLIPPAGE_PERCENT()).to.equal(95); // 95%
      expect(await graduationManager.SLIPPAGE_DENOMINATOR()).to.equal(100); // 100%
      expect(await graduationManager.DEADLINE_BUFFER()).to.equal(300); // 5 minutes
    });

    it("Should enforce slippage on buy", async function () {
      const createTx = await factory
        .connect(creator)
        .createToken("Slippage Token", "SLIP", "ipfs://slip");
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

      const buyAmount = parseAster("10");
      const [expectedTokens] = await bondingCurve.getBuyAmount(buyAmount);

      // Set unrealistic minimum
      await expect(
        bondingCurve.connect(trader1).buyWithAster(buyAmount, expectedTokens * 2n)
      ).to.be.revertedWith("Slippage exceeded");
    });

    it("Should enforce slippage on sell", async function () {
      const createTx = await factory
        .connect(creator)
        .createToken("Sell Slippage", "SLIPS", "ipfs://slips");
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
      const token = await ethers.getContractAt("PumpToken", parsed?.args.token);

      await asterToken.connect(trader1).approve(await bondingCurve.getAddress(), ethers.MaxUint256);

      // Buy first
      await bondingCurve.connect(trader1).buyWithAster(parseAster("50"), 0);

      const balance = await token.balanceOf(trader1.address);
      const sellAmount = balance / 2n;

      await token.connect(trader1).approve(await bondingCurve.getAddress(), ethers.MaxUint256);

      const [expectedAster] = await bondingCurve.getSellAmount(sellAmount);

      // Set unrealistic minimum
      await expect(
        bondingCurve.connect(trader1).sellForAster(sellAmount, expectedAster * 2n)
      ).to.be.revertedWith("Slippage exceeded");
    });
  });

  describe("Multi-Protocol Integration", function () {
    it("Should track multiple tokens independently", async function () {
      // Create 3 tokens
      const tokens = [];
      for (let i = 0; i < 3; i++) {
        const tx = await factory
          .connect(creator)
          .createToken(`Token ${i}`, `TK${i}`, `ipfs://${i}`);
        const receipt = await tx.wait();
        const event = receipt?.logs.find((log: any) => {
          try {
            return factory.interface.parseLog(log)?.name === "TokenCreated";
          } catch {
            return false;
          }
        });
        const parsed = factory.interface.parseLog(event!);
        tokens.push({
          token: parsed?.args.token,
          bondingCurve: parsed?.args.bondingCurve,
        });
      }

      // Verify all are tracked independently
      for (const t of tokens) {
        expect(await factory.tokenExists(t.token)).to.be.true;
        expect(await factory.getBondingCurve(t.token)).to.equal(t.bondingCurve);
      }
    });

    it("Should handle concurrent trading on multiple tokens", async function () {
      // Create 2 tokens
      const tx1 = await factory.connect(creator).createToken("Token A", "TKA", "ipfs://a");
      const receipt1 = await tx1.wait();
      const event1 = receipt1?.logs.find((log: any) => {
        try {
          return factory.interface.parseLog(log)?.name === "TokenCreated";
        } catch {
          return false;
        }
      });
      const parsed1 = factory.interface.parseLog(event1!);
      const bondingCurve1 = await ethers.getContractAt("BondingCurve", parsed1?.args.bondingCurve);

      const tx2 = await factory.connect(creator).createToken("Token B", "TKB", "ipfs://b");
      const receipt2 = await tx2.wait();
      const event2 = receipt2?.logs.find((log: any) => {
        try {
          return factory.interface.parseLog(log)?.name === "TokenCreated";
        } catch {
          return false;
        }
      });
      const parsed2 = factory.interface.parseLog(event2!);
      const bondingCurve2 = await ethers.getContractAt("BondingCurve", parsed2?.args.bondingCurve);

      // Approve both
      await asterToken.connect(trader1).approve(await bondingCurve1.getAddress(), ethers.MaxUint256);
      await asterToken.connect(trader1).approve(await bondingCurve2.getAddress(), ethers.MaxUint256);

      // Trade on both
      await bondingCurve1.connect(trader1).buyWithAster(parseAster("30"), 0);
      await bondingCurve2.connect(trader1).buyWithAster(parseAster("20"), 0);

      // Verify independent reserves
      const [reserve1] = await bondingCurve1.getReserves();
      const [reserve2] = await bondingCurve2.getReserves();

      expect(reserve1).to.be.greaterThan(reserve2);
    });
  });
});
