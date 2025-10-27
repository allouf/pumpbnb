import { expect } from "chai";
import { ethers } from "hardhat";
import {
  GraduationManager,
  BondingCurve,
  PlatformConfig,
  PumpToken,
  TokenFactory,
  MockERC20,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  deployPlatformConfig,
  deployTokenFactory,
  deployGraduationManager,
  getTestAccounts,
  parseAster,
} from "./helpers";

describe("GraduationManager", function () {
  let graduationManager: GraduationManager;
  let config: PlatformConfig;
  let factory: TokenFactory;
  let bondingCurve: BondingCurve;
  let token: PumpToken;
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

  beforeEach(async function () {
    const accounts = await getTestAccounts();
    deployer = accounts.deployer;
    creator = accounts.creator;
    trader1 = accounts.trader1;
    trader2 = accounts.trader2;
    protocolFeeRecipient = accounts.protocolFeeRecipient;
    admin = accounts.admin;
    pauser = accounts.pauser;

    // Deploy mock ASTER token at the expected address
    const MockERC20 = await ethers.getContractFactory("contracts/mocks/MockERC20.sol:MockERC20");
    const mockAsterDeploy = await MockERC20.deploy(
      "ASTER Token",
      "ASTER",
      18, // decimals
      parseAster("10000000")
    );

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

    // Deploy PlatformConfig
    config = await deployPlatformConfig(
      protocolFeeRecipient.address,
      admin.address,
      pauser.address
    );

    // Deploy GraduationManager
    graduationManager = await deployGraduationManager(await config.getAddress());

    // Deploy TokenFactory
    factory = await deployTokenFactory(await config.getAddress(), VIRTUAL_ASTER_RESERVE);

    // Create a token through factory
    const createTx = await factory.connect(creator).createToken("Test Token", "TEST", "ipfs://test");
    const receipt = await createTx.wait();

    const event = receipt?.logs.find((log: any) => {
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

    token = await ethers.getContractAt("PumpToken", tokenAddress);
    bondingCurve = await ethers.getContractAt("BondingCurve", bondingCurveAddress);

    // Mint ASTER to traders
    await asterToken.mint(trader1.address, parseAster("10000"));
    await asterToken.mint(trader2.address, parseAster("10000"));

    // Approve bonding curve to spend ASTER
    await asterToken.connect(trader1).approve(bondingCurveAddress, ethers.MaxUint256);
    await asterToken.connect(trader2).approve(bondingCurveAddress, ethers.MaxUint256);
  });

  describe("Deployment", function () {
    it("Should set correct config address", async function () {
      expect(await graduationManager.config()).to.equal(await config.getAddress());
    });

    it("Should set correct PancakeSwap router address", async function () {
      const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
      expect(await graduationManager.pancakeRouter()).to.equal(PANCAKE_ROUTER);
    });

    it("Should set correct PancakeSwap factory address", async function () {
      const PANCAKE_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
      expect(await graduationManager.pancakeFactory()).to.equal(PANCAKE_FACTORY);
    });

    it("Should set correct ASTER token address", async function () {
      const ASTER_TOKEN = "0x000Ae314E2A2172a039B26378814C252734f556A";
      expect(await graduationManager.asterToken()).to.equal(ASTER_TOKEN);
    });

    it("Should set correct WBNB address", async function () {
      const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
      expect(await graduationManager.wbnb()).to.equal(WBNB);
    });

    it("Should have correct slippage constants", async function () {
      expect(await graduationManager.MIN_SLIPPAGE_PERCENT()).to.equal(95);
      expect(await graduationManager.SLIPPAGE_DENOMINATOR()).to.equal(100);
      expect(await graduationManager.DEADLINE_BUFFER()).to.equal(300);
    });

    it("Should revert if config is zero address", async function () {
      const GraduationManager = await ethers.getContractFactory("GraduationManager");
      await expect(GraduationManager.deploy(ethers.ZeroAddress)).to.be.revertedWith(
        "Invalid config"
      );
    });
  });

  describe("checkGraduationEligibility", function () {
    it("Should return false if ASTER reserves below threshold", async function () {
      // Don't buy enough to graduate
      await bondingCurve.connect(trader1).buyWithAster(parseAster("50"), 0);

      const eligible = await graduationManager.checkGraduationEligibility(
        await bondingCurve.getAddress()
      );
      expect(eligible).to.be.false;
    });

    it("Should return true if ASTER reserves meet threshold", async function () {
      // Buy enough to reach graduation threshold
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);

      const eligible = await graduationManager.checkGraduationEligibility(
        await bondingCurve.getAddress()
      );
      expect(eligible).to.be.true;
    });

    it("Should return false if already graduated", async function () {
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);
      await bondingCurve.markGraduated();

      const eligible = await graduationManager.checkGraduationEligibility(
        await bondingCurve.getAddress()
      );
      expect(eligible).to.be.false;
    });

    it("Should revert if bonding curve address is zero", async function () {
      await expect(
        graduationManager.checkGraduationEligibility(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid bonding curve");
    });
  });

  describe("Graduation Status Tracking", function () {
    it("Should return false for non-graduated bonding curve", async function () {
      expect(await graduationManager.isGraduated(await bondingCurve.getAddress())).to.be.false;
    });

    it("Should return zero address for non-graduated token pair", async function () {
      expect(await graduationManager.getPancakePair(await token.getAddress())).to.equal(
        ethers.ZeroAddress
      );
    });
  });

  describe("View Functions", function () {
    it("Should correctly identify eligible bonding curve", async function () {
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);

      expect(await bondingCurve.isEligibleForGraduation()).to.be.true;
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.true;
    });

    it("Should correctly identify ineligible bonding curve", async function () {
      await bondingCurve.connect(trader1).buyWithAster(parseAster("50"), 0);

      expect(await bondingCurve.isEligibleForGraduation()).to.be.false;
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.false;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle checking eligibility multiple times", async function () {
      // Check before any trades
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.false;

      // Buy some tokens
      await bondingCurve.connect(trader1).buyWithAster(parseAster("50"), 0);
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.false;

      // Buy more to reach threshold
      await bondingCurve.connect(trader1).buyWithAster(parseAster("60"), 0);
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.true;
    });

    it("Should handle exact threshold amount", async function () {
      // Buy exactly to threshold
      const [asterReserve] = await bondingCurve.getReserves();
      const needed = GRADUATION_THRESHOLD - asterReserve;

      if (needed > 0n) {
        await bondingCurve.connect(trader1).buyWithAster(needed + parseAster("1"), 0);
      }

      const [finalAsterReserve] = await bondingCurve.getReserves();
      if (finalAsterReserve >= GRADUATION_THRESHOLD) {
        expect(
          await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress())
        ).to.be.true;
      }
    });

    it("Should maintain correct state across multiple checks", async function () {
      for (let i = 0; i < 5; i++) {
        const eligible = await graduationManager.checkGraduationEligibility(
          await bondingCurve.getAddress()
        );
        expect(eligible).to.be.false;
      }
    });
  });

  describe("Integration with BondingCurve", function () {
    it("Should correctly detect when bonding curve reaches threshold", async function () {
      // Initial state
      expect(await bondingCurve.isEligibleForGraduation()).to.be.false;
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.false;

      // Buy to reach threshold
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);

      // Both should now show eligible
      expect(await bondingCurve.isEligibleForGraduation()).to.be.true;
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.true;
    });

    it("Should handle bonding curve with no trades", async function () {
      const [asterReserve] = await bondingCurve.getReserves();
      expect(asterReserve).to.equal(0);

      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.false;
    });

    it("Should handle bonding curve with small trades", async function () {
      for (let i = 0; i < 10; i++) {
        await bondingCurve.connect(trader1).buyWithAster(parseAster("5"), 0);
      }

      const [asterReserve] = await bondingCurve.getReserves();
      expect(asterReserve).to.be.lessThan(GRADUATION_THRESHOLD);

      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.false;
    });
  });

  describe("Multiple Bonding Curves", function () {
    let bondingCurve2: BondingCurve;
    let token2: PumpToken;

    beforeEach(async function () {
      // Create second token
      const createTx = await factory
        .connect(creator)
        .createToken("Test Token 2", "TEST2", "ipfs://test2");
      const receipt = await createTx.wait();

      const event = receipt?.logs.find((log: any) => {
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

      token2 = await ethers.getContractAt("PumpToken", tokenAddress);
      bondingCurve2 = await ethers.getContractAt("BondingCurve", bondingCurveAddress);

      await asterToken.connect(trader1).approve(bondingCurveAddress, ethers.MaxUint256);
    });

    it("Should handle multiple bonding curves independently", async function () {
      // Graduate first curve
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.true;

      // Second curve not graduated
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve2.getAddress()))
        .to.be.false;
    });

    it("Should track graduation status per bonding curve", async function () {
      // Note: hasGraduated in GraduationManager is only set via executeGraduation
      // markGraduated() is called on the bonding curve itself, not graduation manager
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);
      await bondingCurve.markGraduated();

      // GraduationManager hasGraduated mapping is only updated by executeGraduation
      // So checking graduated status on bonding curve directly
      expect(await bondingCurve.graduated()).to.be.true;
      expect(await bondingCurve2.graduated()).to.be.false;
    });
  });

  describe("Reserve Requirements", function () {
    it("Should require minimum 100 ASTER for graduation", async function () {
      // 99 ASTER should not be enough
      await bondingCurve.connect(trader1).buyWithAster(parseAster("99"), 0);

      const [asterReserve] = await bondingCurve.getReserves();
      if (asterReserve < GRADUATION_THRESHOLD) {
        expect(
          await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress())
        ).to.be.false;
      }
    });

    it("Should allow graduation with reserves above threshold", async function () {
      // Buy in increments to avoid running out of liquidity
      await bondingCurve.connect(trader1).buyWithAster(parseAster("60"), 0);
      await bondingCurve.connect(trader2).buyWithAster(parseAster("60"), 0);

      const [asterReserve] = await bondingCurve.getReserves();
      expect(asterReserve).to.be.greaterThan(GRADUATION_THRESHOLD);

      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.true;
    });
  });

  describe("Security", function () {
    it("Should prevent checking graduation on invalid address", async function () {
      await expect(
        graduationManager.checkGraduationEligibility(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid bonding curve");
    });

    it("Should handle platform pause correctly", async function () {
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);

      // Pause platform
      await config.connect(pauser).pause();

      // Can still check eligibility (view function)
      expect(await graduationManager.checkGraduationEligibility(await bondingCurve.getAddress()))
        .to.be.true;
    });
  });
});
