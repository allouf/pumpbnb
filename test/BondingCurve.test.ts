import { expect } from "chai";
import { ethers } from "hardhat";
import { BondingCurve, PlatformConfig, PumpToken, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { deployPlatformConfig, getTestAccounts, parseAster, formatAster } from "./helpers";

describe("BondingCurve", function () {
  let bondingCurve: BondingCurve;
  let token: PumpToken;
  let config: PlatformConfig;
  let asterToken: MockERC20;

  let deployer: SignerWithAddress;
  let creator: SignerWithAddress;
  let trader1: SignerWithAddress;
  let trader2: SignerWithAddress;
  let protocolFeeRecipient: SignerWithAddress;
  let admin: SignerWithAddress;
  let pauser: SignerWithAddress;

  const VIRTUAL_ASTER_RESERVE = parseAster("30"); // 30 ASTER virtual reserve
  const VIRTUAL_TOKEN_RESERVE = parseAster("200000000"); // 200M tokens
  const BONDING_CURVE_SUPPLY = parseAster("800000000"); // 800M tokens
  const GRADUATION_THRESHOLD = parseAster("100"); // 100 ASTER

  beforeEach(async function () {
    const accounts = await getTestAccounts();
    deployer = accounts.deployer;
    creator = accounts.creator;
    trader1 = accounts.trader1;
    trader2 = accounts.trader2;
    protocolFeeRecipient = accounts.protocolFeeRecipient;
    admin = accounts.admin;
    pauser = accounts.pauser;

    // Deploy mock ASTER token
    const MockERC20 = await ethers.getContractFactory("contracts/test/MockERC20.sol:MockERC20");
    const mockAsterDeploy = await MockERC20.deploy(
      "ASTER Token",
      "ASTER",
      parseAster("10000000") // 10M ASTER for testing
    );

    // Get the deployed code and set it at the expected ASTER address
    const ASTER_ADDRESS = "0x000Ae314E2A2172a039B26378814C252734f556A";
    const mockAsterCode = await ethers.provider.getCode(await mockAsterDeploy.getAddress());
    await ethers.provider.send("hardhat_setCode", [ASTER_ADDRESS, mockAsterCode]);

    // Now interact with ASTER at the expected address
    asterToken = MockERC20.attach(ASTER_ADDRESS) as MockERC20;

    // Give the deployer some ASTER to distribute
    await ethers.provider.send("hardhat_setStorageAt", [
      ASTER_ADDRESS,
      ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [deployer.address, 0])),
      ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [parseAster("10000000")])
    ]);

    // Deploy PlatformConfig
    config = await deployPlatformConfig(protocolFeeRecipient.address, admin.address, pauser.address);

    // Deploy PumpToken
    const PumpToken = await ethers.getContractFactory("PumpToken");
    token = await PumpToken.deploy(
      "Test Token",
      "TEST",
      "ipfs://test",
      creator.address,
      ethers.ZeroAddress
    );

    // Deploy BondingCurve
    const BondingCurve = await ethers.getContractFactory("BondingCurve");
    bondingCurve = await BondingCurve.deploy(
      await token.getAddress(),
      creator.address,
      await config.getAddress(),
      VIRTUAL_ASTER_RESERVE
    );

    // Set bonding curve in token and transfer tokens
    await token.setBondingCurve(await bondingCurve.getAddress());

    // Mint ASTER to traders
    await asterToken.mint(trader1.address, parseAster("10000"));
    await asterToken.mint(trader2.address, parseAster("10000"));

    // Approve bonding curve to spend ASTER
    await asterToken.connect(trader1).approve(await bondingCurve.getAddress(), ethers.MaxUint256);
    await asterToken.connect(trader2).approve(await bondingCurve.getAddress(), ethers.MaxUint256);
  });

  describe("Deployment", function () {
    it("Should set correct token address", async function () {
      expect(await bondingCurve.token()).to.equal(await token.getAddress());
    });

    it("Should set correct creator address", async function () {
      expect(await bondingCurve.creator()).to.equal(creator.address);
    });

    it("Should set correct config address", async function () {
      expect(await bondingCurve.config()).to.equal(await config.getAddress());
    });

    it("Should set correct virtual ASTER reserve", async function () {
      expect(await bondingCurve.virtualAsterReserve()).to.equal(VIRTUAL_ASTER_RESERVE);
    });

    it("Should initialize real ASTER reserve to zero", async function () {
      expect(await bondingCurve.realAsterReserve()).to.equal(0);
    });

    it("Should initialize real token reserve to bonding curve supply", async function () {
      expect(await bondingCurve.realTokenReserve()).to.equal(BONDING_CURVE_SUPPLY);
    });

    it("Should not be graduated on deployment", async function () {
      expect(await bondingCurve.graduated()).to.be.false;
    });

    it("Should revert if token is zero address", async function () {
      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      await expect(
        BondingCurve.deploy(
          ethers.ZeroAddress,
          creator.address,
          await config.getAddress(),
          VIRTUAL_ASTER_RESERVE
        )
      ).to.be.revertedWith("Invalid token");
    });

    it("Should revert if creator is zero address", async function () {
      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      await expect(
        BondingCurve.deploy(
          await token.getAddress(),
          ethers.ZeroAddress,
          await config.getAddress(),
          VIRTUAL_ASTER_RESERVE
        )
      ).to.be.revertedWith("Invalid creator");
    });

    it("Should revert if config is zero address", async function () {
      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      await expect(
        BondingCurve.deploy(
          await token.getAddress(),
          creator.address,
          ethers.ZeroAddress,
          VIRTUAL_ASTER_RESERVE
        )
      ).to.be.revertedWith("Invalid config");
    });

    it("Should revert if virtual reserve is zero", async function () {
      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      await expect(
        BondingCurve.deploy(
          await token.getAddress(),
          creator.address,
          await config.getAddress(),
          0
        )
      ).to.be.revertedWith("Invalid virtual reserve");
    });
  });

  describe("Price Calculation", function () {
    it("Should return initial price correctly", async function () {
      const price = await bondingCurve.getPrice();

      // Initial price = virtualAsterReserve / (virtualTokenReserve + realTokenReserve)
      // = 30 / (200M + 800M) = 30 / 1B
      const expectedPrice = (VIRTUAL_ASTER_RESERVE * parseAster("1")) / (VIRTUAL_TOKEN_RESERVE + BONDING_CURVE_SUPPLY);

      expect(price).to.equal(expectedPrice);
    });

    it("Should increase price after buy", async function () {
      const priceBefore = await bondingCurve.getPrice();

      // Buy some tokens
      await bondingCurve.connect(trader1).buyWithAster(parseAster("1"), 0);

      const priceAfter = await bondingCurve.getPrice();
      expect(priceAfter).to.be.greaterThan(priceBefore);
    });

    it("Should decrease price after sell", async function () {
      // First buy to get tokens
      await bondingCurve.connect(trader1).buyWithAster(parseAster("10"), 0);

      const priceBefore = await bondingCurve.getPrice();

      // Sell some tokens
      const tokenBalance = await token.balanceOf(trader1.address);
      await token.connect(trader1).approve(await bondingCurve.getAddress(), ethers.MaxUint256);
      await bondingCurve.connect(trader1).sellForAster(tokenBalance / 2n, 0);

      const priceAfter = await bondingCurve.getPrice();
      expect(priceAfter).to.be.lessThan(priceBefore);
    });
  });

  describe("getBuyAmount", function () {
    it("Should calculate correct buy amount and fees", async function () {
      const asterIn = parseAster("10");
      const [tokensOut, creatorFee, protocolFee] = await bondingCurve.getBuyAmount(asterIn);

      // Verify fees
      const expectedCreatorFee = (asterIn * 30n) / 10000n; // 0.3%
      const expectedProtocolFee = (asterIn * 70n) / 10000n; // 0.7%

      expect(creatorFee).to.equal(expectedCreatorFee);
      expect(protocolFee).to.equal(expectedProtocolFee);
      expect(tokensOut).to.be.greaterThan(0);
    });

    it("Should revert if input is zero", async function () {
      await expect(bondingCurve.getBuyAmount(0)).to.be.revertedWith("Invalid input");
    });

    it("Should calculate larger purchases correctly", async function () {
      const asterIn = parseAster("50");
      const [tokensOut] = await bondingCurve.getBuyAmount(asterIn);

      expect(tokensOut).to.be.greaterThan(0);
      expect(tokensOut).to.be.lessThanOrEqual(BONDING_CURVE_SUPPLY);
    });
  });

  describe("getSellAmount", function () {
    it("Should calculate correct sell amount and fees", async function () {
      // First buy some tokens
      await bondingCurve.connect(trader1).buyWithAster(parseAster("10"), 0);
      const tokenBalance = await token.balanceOf(trader1.address);

      const [asterOut, creatorFee, protocolFee] = await bondingCurve.getSellAmount(tokenBalance);

      expect(asterOut).to.be.greaterThan(0);
      expect(creatorFee).to.be.greaterThan(0);
      expect(protocolFee).to.be.greaterThan(0);
    });

    it("Should revert if input is zero", async function () {
      await expect(bondingCurve.getSellAmount(0)).to.be.revertedWith("Invalid input");
    });
  });

  describe("buyWithAster", function () {
    it("Should allow buying tokens with ASTER", async function () {
      const asterIn = parseAster("10");
      const [expectedTokens] = await bondingCurve.getBuyAmount(asterIn);

      await expect(bondingCurve.connect(trader1).buyWithAster(asterIn, 0))
        .to.emit(bondingCurve, "Buy")
        .withArgs(trader1.address, asterIn, expectedTokens, (asterIn * 30n) / 10000n, (asterIn * 70n) / 10000n, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      expect(await token.balanceOf(trader1.address)).to.equal(expectedTokens);
    });

    it("Should transfer ASTER from buyer", async function () {
      const asterIn = parseAster("10");
      const balanceBefore = await asterToken.balanceOf(trader1.address);

      await bondingCurve.connect(trader1).buyWithAster(asterIn, 0);

      const balanceAfter = await asterToken.balanceOf(trader1.address);
      expect(balanceBefore - balanceAfter).to.equal(asterIn);
    });

    it("Should pay creator fee", async function () {
      const asterIn = parseAster("10");
      const expectedFee = (asterIn * 30n) / 10000n;

      const balanceBefore = await asterToken.balanceOf(creator.address);
      await bondingCurve.connect(trader1).buyWithAster(asterIn, 0);
      const balanceAfter = await asterToken.balanceOf(creator.address);

      expect(balanceAfter - balanceBefore).to.equal(expectedFee);
    });

    it("Should pay protocol fee", async function () {
      const asterIn = parseAster("10");
      const expectedFee = (asterIn * 70n) / 10000n;

      const balanceBefore = await asterToken.balanceOf(protocolFeeRecipient.address);
      await bondingCurve.connect(trader1).buyWithAster(asterIn, 0);
      const balanceAfter = await asterToken.balanceOf(protocolFeeRecipient.address);

      expect(balanceAfter - balanceBefore).to.equal(expectedFee);
    });

    it("Should update ASTER reserves correctly", async function () {
      const asterIn = parseAster("10");
      const [, creatorFee, protocolFee] = await bondingCurve.getBuyAmount(asterIn);
      const asterAfterFee = asterIn - creatorFee - protocolFee;

      await bondingCurve.connect(trader1).buyWithAster(asterIn, 0);

      expect(await bondingCurve.realAsterReserve()).to.equal(asterAfterFee);
    });

    it("Should update token reserves correctly", async function () {
      const asterIn = parseAster("10");
      const [tokensOut] = await bondingCurve.getBuyAmount(asterIn);

      await bondingCurve.connect(trader1).buyWithAster(asterIn, 0);

      expect(await bondingCurve.realTokenReserve()).to.equal(BONDING_CURVE_SUPPLY - tokensOut);
    });

    it("Should revert if slippage exceeded", async function () {
      const asterIn = parseAster("10");
      const [tokensOut] = await bondingCurve.getBuyAmount(asterIn);

      await expect(
        bondingCurve.connect(trader1).buyWithAster(asterIn, tokensOut + 1n)
      ).to.be.revertedWith("Slippage exceeded");
    });

    it("Should revert if already graduated", async function () {
      // Buy enough to graduate
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);
      await bondingCurve.markGraduated();

      await expect(
        bondingCurve.connect(trader1).buyWithAster(parseAster("1"), 0)
      ).to.be.revertedWith("Already graduated");
    });

    it("Should revert if platform is paused", async function () {
      await config.connect(pauser).pause();

      await expect(
        bondingCurve.connect(trader1).buyWithAster(parseAster("10"), 0)
      ).to.be.revertedWith("Platform paused");
    });

    it("Should revert if input is zero", async function () {
      await expect(
        bondingCurve.connect(trader1).buyWithAster(0, 0)
      ).to.be.revertedWith("Invalid input");
    });
  });

  describe("sellForAster", function () {
    beforeEach(async function () {
      // Buy more tokens first to ensure enough ASTER in curve for sells
      await bondingCurve.connect(trader1).buyWithAster(parseAster("50"), 0);
      await token.connect(trader1).approve(await bondingCurve.getAddress(), ethers.MaxUint256);
    });

    it("Should allow selling tokens for ASTER", async function () {
      // Only sell half to avoid running out of ASTER in curve
      const tokensIn = (await token.balanceOf(trader1.address)) / 2n;
      const asterBalanceBefore = await asterToken.balanceOf(trader1.address);

      const [expectedAster] = await bondingCurve.getSellAmount(tokensIn);

      await expect(bondingCurve.connect(trader1).sellForAster(tokensIn, 0))
        .to.emit(bondingCurve, "Sell");

      const asterBalanceAfter = await asterToken.balanceOf(trader1.address);
      expect(asterBalanceAfter - asterBalanceBefore).to.be.closeTo(
        expectedAster,
        parseAster("0.01")
      );
    });

    it("Should transfer tokens from seller", async function () {
      const balanceBefore = await token.balanceOf(trader1.address);
      const tokensIn = balanceBefore / 2n; // Sell half

      await bondingCurve.connect(trader1).sellForAster(tokensIn, 0);

      expect(await token.balanceOf(trader1.address)).to.equal(balanceBefore - tokensIn);
    });

    it("Should pay creator fee on sell", async function () {
      const tokensIn = (await token.balanceOf(trader1.address)) / 2n; // Sell half
      const [, creatorFee] = await bondingCurve.getSellAmount(tokensIn);

      const balanceBefore = await asterToken.balanceOf(creator.address);
      await bondingCurve.connect(trader1).sellForAster(tokensIn, 0);
      const balanceAfter = await asterToken.balanceOf(creator.address);

      const actualFee = balanceAfter - balanceBefore;
      expect(actualFee).to.be.closeTo(creatorFee, parseAster("0.0001"));
    });

    it("Should revert if slippage exceeded", async function () {
      const tokensIn = await token.balanceOf(trader1.address);
      const [asterOut] = await bondingCurve.getSellAmount(tokensIn);

      await expect(
        bondingCurve.connect(trader1).sellForAster(tokensIn, asterOut + 1n)
      ).to.be.revertedWith("Slippage exceeded");
    });

    it("Should revert if already graduated", async function () {
      // Buy enough to reach graduation threshold (100 ASTER)
      // trader1 already bought 50 ASTER in beforeEach, trader2 needs to buy more
      await bondingCurve.connect(trader2).buyWithAster(parseAster("60"), 0);
      await bondingCurve.markGraduated();

      const tokensIn = (await token.balanceOf(trader1.address)) / 2n;
      await expect(
        bondingCurve.connect(trader1).sellForAster(tokensIn, 0)
      ).to.be.revertedWith("Already graduated");
    });

    it("Should revert if platform is paused", async function () {
      await config.connect(pauser).pause();

      const tokensIn = await token.balanceOf(trader1.address);
      await expect(
        bondingCurve.connect(trader1).sellForAster(tokensIn, 0)
      ).to.be.revertedWith("Platform paused");
    });
  });

  describe("Graduation", function () {
    it("Should mark as graduated when threshold met", async function () {
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);

      expect(await bondingCurve.isEligibleForGraduation()).to.be.true;

      await expect(bondingCurve.markGraduated())
        .to.emit(bondingCurve, "Graduated");

      expect(await bondingCurve.graduated()).to.be.true;
    });

    it("Should revert if marking graduated when threshold not met", async function () {
      await expect(bondingCurve.markGraduated()).to.be.revertedWith("Threshold not met");
    });

    it("Should revert if marking graduated twice", async function () {
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);
      await bondingCurve.markGraduated();

      await expect(bondingCurve.markGraduated()).to.be.revertedWith("Already graduated");
    });

    it("Should allow extracting reserves after graduation", async function () {
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);
      await bondingCurve.markGraduated();

      const [asterAmount, tokenAmount] = await bondingCurve.extractReserves.staticCall();

      expect(asterAmount).to.be.greaterThan(0);
      expect(tokenAmount).to.be.greaterThan(0);
    });

    it("Should transfer reserves when extracting", async function () {
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);
      await bondingCurve.markGraduated();

      const asterBefore = await asterToken.balanceOf(deployer.address);
      await bondingCurve.extractReserves();
      const asterAfter = await asterToken.balanceOf(deployer.address);

      expect(asterAfter).to.be.greaterThan(asterBefore);
    });

    it("Should reset reserves to zero after extraction", async function () {
      await bondingCurve.connect(trader1).buyWithAster(parseAster("110"), 0);
      await bondingCurve.markGraduated();
      await bondingCurve.extractReserves();

      expect(await bondingCurve.realAsterReserve()).to.equal(0);
      expect(await bondingCurve.realTokenReserve()).to.equal(0);
    });

    it("Should revert extracting reserves if not graduated", async function () {
      await expect(bondingCurve.extractReserves()).to.be.revertedWith("Not graduated");
    });
  });

  describe("Reserve Management", function () {
    it("Should return correct reserves", async function () {
      const [asterReserve, tokenReserve, totalAster, totalToken] = await bondingCurve.getReserves();

      expect(asterReserve).to.equal(0);
      expect(tokenReserve).to.equal(BONDING_CURVE_SUPPLY);
      expect(totalAster).to.equal(VIRTUAL_ASTER_RESERVE);
      expect(totalToken).to.equal(VIRTUAL_TOKEN_RESERVE + BONDING_CURVE_SUPPLY);
    });

    it("Should update reserves correctly after buy", async function () {
      await bondingCurve.connect(trader1).buyWithAster(parseAster("10"), 0);

      const [asterReserve, tokenReserve] = await bondingCurve.getReserves();

      expect(asterReserve).to.be.greaterThan(0);
      expect(tokenReserve).to.be.lessThan(BONDING_CURVE_SUPPLY);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple sequential buys", async function () {
      for (let i = 0; i < 5; i++) {
        await bondingCurve.connect(trader1).buyWithAster(parseAster("1"), 0);
      }

      expect(await token.balanceOf(trader1.address)).to.be.greaterThan(0);
    });

    it("Should handle buy and sell cycle", async function () {
      const asterBefore = await asterToken.balanceOf(trader1.address);

      // Buy with enough ASTER
      await bondingCurve.connect(trader1).buyWithAster(parseAster("20"), 0);
      await token.connect(trader1).approve(await bondingCurve.getAddress(), ethers.MaxUint256);

      // Only sell half to ensure curve has enough ASTER
      const balance = (await token.balanceOf(trader1.address)) / 2n;
      await bondingCurve.connect(trader1).sellForAster(balance, 0);

      const asterAfter = await asterToken.balanceOf(trader1.address);

      // Should have less ASTER due to fees
      expect(asterAfter).to.be.lessThan(asterBefore);
    });

    it("Should handle very small amounts", async function () {
      const smallAmount = parseAster("0.001");

      await bondingCurve.connect(trader1).buyWithAster(smallAmount, 0);

      expect(await token.balanceOf(trader1.address)).to.be.greaterThan(0);
    });
  });
});
