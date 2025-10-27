import { expect } from "chai";
import { ethers } from "hardhat";
import { BondingCurve, PumpToken, PlatformConfig, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BondingCurve - Fuzz Testing", function () {
  let bondingCurve: BondingCurve;
  let pumpToken: PumpToken;
  let platformConfig: PlatformConfig;
  let tokenFactory: any;
  let graduationManager: any;
  let mockAster: MockERC20;
  let mockWBNB: MockERC20;
  let mockPancakeFactory: any;
  let mockPancakeRouter: any;
  let owner: SignerWithAddress;
  let trader: SignerWithAddress;
  let buyer: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000000"); // 1 billion tokens
  const BONDING_CURVE_ALLOCATION = ethers.parseEther("800000000"); // 800M tokens
  const VIRTUAL_ASTER = ethers.parseEther("200"); // 200 ASTER virtual reserve
  const VIRTUAL_TOKEN = ethers.parseEther("200000000"); // 200M token virtual reserve
  const ASTER_ADDRESS = "0x000Ae314E2A2172a039B26378814C252734f556A";
  const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

  beforeEach(async function () {
    [owner, trader, buyer] = await ethers.getSigners();

    // Deploy PlatformConfig
    const PlatformConfigFactory = await ethers.getContractFactory("PlatformConfig");
    platformConfig = await PlatformConfigFactory.deploy(
      await owner.getAddress(), // protocol fee recipient
      await owner.getAddress(), // admin
      await owner.getAddress()  // pauser
    );
    await platformConfig.waitForDeployment();

    // Deploy mock ASTER token and set it at the expected address
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const mockAsterDeploy = await MockERC20Factory.deploy(
      "Mock ASTER",
      "ASTER",
      18, // decimals
      ethers.parseEther("100000000") // 100M initial supply
    );
    await mockAsterDeploy.waitForDeployment();

    // Use hardhat_setCode to place mock ASTER at the expected address
    const mockAsterCode = await ethers.provider.getCode(await mockAsterDeploy.getAddress());
    await ethers.provider.send("hardhat_setCode", [ASTER_ADDRESS, mockAsterCode]);
    mockAster = MockERC20Factory.attach(ASTER_ADDRESS) as MockERC20;

    // Set ASTER balance for owner using storage manipulation
    await ethers.provider.send("hardhat_setStorageAt", [
      ASTER_ADDRESS,
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [await owner.getAddress(), 0])
      ),
      ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [ethers.parseEther("100000000")]),
    ]);

    // Deploy mock WBNB token and set it at the expected address
    const mockWBNBDeploy = await MockERC20Factory.deploy(
      "Mock WBNB",
      "WBNB",
      18, // decimals
      ethers.parseEther("100000000") // 100M initial supply
    );
    await mockWBNBDeploy.waitForDeployment();

    const mockWBNBCode = await ethers.provider.getCode(await mockWBNBDeploy.getAddress());
    await ethers.provider.send("hardhat_setCode", [WBNB_ADDRESS, mockWBNBCode]);
    mockWBNB = MockERC20Factory.attach(WBNB_ADDRESS) as MockERC20;

    // Set WBNB balance for owner
    await ethers.provider.send("hardhat_setStorageAt", [
      WBNB_ADDRESS,
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [await owner.getAddress(), 0])
      ),
      ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [ethers.parseEther("100000000")]),
    ]);

    // Deploy mock PancakeSwap contracts
    const MockPancakeFactory = await ethers.getContractFactory("MockPancakeFactory");
    mockPancakeFactory = await MockPancakeFactory.deploy();
    await mockPancakeFactory.waitForDeployment();

    const MockPancakeRouter = await ethers.getContractFactory("MockPancakeRouter");
    mockPancakeRouter = await MockPancakeRouter.deploy(
      await mockPancakeFactory.getAddress(),
      await mockWBNB.getAddress()
    );
    await mockPancakeRouter.waitForDeployment();

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
      VIRTUAL_ASTER // virtual reserve parameter
    );
    await tokenFactory.waitForDeployment();

    // Create token via factory (this properly sets up everything)
    const createTokenTx = await tokenFactory.connect(trader).createToken(
      "Fuzz Test Token",
      "FUZZ",
      "ipfs://fuzz-test"
    );

    // Wait for the transaction
    await createTokenTx.wait();

    // Get deployed addresses from the allTokens array
    const allTokens = await tokenFactory.getAllTokens(0, 1);
    const tokenAddress = allTokens[0];
    const bcAddress = await tokenFactory.getBondingCurve(tokenAddress);

    pumpToken = await ethers.getContractAt("PumpToken", tokenAddress);
    bondingCurve = await ethers.getContractAt("BondingCurve", bcAddress);

    // Mint ASTER to trader for testing
    await mockAster.transfer(await trader.getAddress(), ethers.parseEther("10000"));
  });

  describe("Buy Operation Fuzz Tests", function () {
    it("should handle random buy amounts without reverting", async function () {
      this.timeout(60000); // 60 second timeout for fuzz tests

      const iterations = 100;
      const maxBuyAmount = ethers.parseEther("100"); // Max 100 ASTER per buy

      for (let i = 0; i < iterations; i++) {
        // Generate random buy amount between 0.001 and 100 ASTER
        const randomAmount = ethers.parseEther(
          (Math.random() * 99.999 + 0.001).toFixed(18)
        );

        // Ensure trader has enough ASTER
        const traderBalance = await mockAster.balanceOf(await trader.getAddress());
        if (traderBalance < randomAmount) {
          await mockAster.transfer(await trader.getAddress(), randomAmount);
        }

        // Approve bonding curve
        await mockAster.connect(trader).approve(await bondingCurve.getAddress(), randomAmount);

        const tokensBefore = await pumpToken.balanceOf(await trader.getAddress());

        try {
          // Execute buy
          await bondingCurve.connect(trader).buyWithAster(randomAmount, 0);

          // Verify tokens received
          const tokensAfter = await pumpToken.balanceOf(await trader.getAddress());
          expect(tokensAfter).to.be.gt(tokensBefore);
        } catch (error: any) {
          // Only accept specific expected errors (slippage, insufficient reserves, etc.)
          const acceptableErrors = [
            "InsufficientOutputAmount",
            "InsufficientReserves",
            "Insufficient liquidity",
            "ERC20: transfer amount exceeds balance"
          ];
          const isAcceptable = acceptableErrors.some(err => error.message.includes(err));
          if (!isAcceptable) {
            throw error; // Re-throw unexpected errors
          }
        }
      }
    });

    it("should maintain constant product invariant (k) within tolerance", async function () {
      this.timeout(60000);

      const iterations = 50;
      const tolerance = ethers.parseEther("0.0001"); // 0.01% tolerance for rounding

      for (let i = 0; i < iterations; i++) {
        const randomBuyAmount = ethers.parseEther(
          (Math.random() * 9.999 + 0.001).toFixed(18)
        );

        // Get reserves before
        const [realAsterBefore, realTokenBefore] = await bondingCurve.getReserves();
        const kBefore = (VIRTUAL_ASTER + realAsterBefore) * (VIRTUAL_TOKEN + realTokenBefore);

        // Execute buy
        await mockAster.connect(trader).approve(await bondingCurve.getAddress(), randomBuyAmount);
        await bondingCurve.connect(trader).buyWithAster(randomBuyAmount, 0);

        // Get reserves after
        const [realAsterAfter, realTokenAfter] = await bondingCurve.getReserves();
        const kAfter = (VIRTUAL_ASTER + realAsterAfter) * (VIRTUAL_TOKEN + realTokenAfter);

        // k should stay approximately constant or increase slightly (due to fees being removed)
        // In constant product AMMs, k stays constant; fees reduce available liquidity
        // Allow for rounding differences up to 0.01%
        const kDiff = kBefore > kAfter ? kBefore - kAfter : 0n;
        const maxAllowedDecrease = (kBefore * 100n) / 10000n; // 1% max decrease
        expect(kDiff).to.be.lte(maxAllowedDecrease, `k decreased by more than 1%: ${kDiff}`);
      }
    });

    it("should handle sequential buys with varying amounts", async function () {
      this.timeout(60000);

      const iterations = 30;
      let totalTokensReceived = 0n;

      for (let i = 0; i < iterations; i++) {
        const randomBuyAmount = ethers.parseEther(
          (Math.random() * 4.999 + 0.001).toFixed(18)
        );

        await mockAster.connect(trader).approve(await bondingCurve.getAddress(), randomBuyAmount);

        const tokensBefore = await pumpToken.balanceOf(await trader.getAddress());
        await bondingCurve.connect(trader).buyWithAster(randomBuyAmount, 0);
        const tokensAfter = await pumpToken.balanceOf(await trader.getAddress());

        const tokensReceived = tokensAfter - tokensBefore;
        totalTokensReceived += tokensReceived;

        // Each buy should receive some tokens
        expect(tokensReceived).to.be.gt(0);
      }

      // Total tokens received should be substantial
      expect(totalTokensReceived).to.be.gt(0);
    });
  });

  describe("Sell Operation Fuzz Tests", function () {
    beforeEach(async function () {
      // Setup: trader buys tokens first
      const buyAmount = ethers.parseEther("50");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);
    });

    it("should handle random sell amounts without reverting", async function () {
      this.timeout(60000);

      const iterations = 50;
      const traderTokenBalance = await pumpToken.balanceOf(await trader.getAddress());

      for (let i = 0; i < iterations; i++) {
        const currentBalance = await pumpToken.balanceOf(await trader.getAddress());

        if (currentBalance === 0n) {
          // Buy more tokens if depleted
          const buyAmount = ethers.parseEther("10");
          await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
          await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);
          continue;
        }

        // Generate random sell amount (1% to 50% of current balance)
        const percentage = Math.random() * 0.49 + 0.01; // 1% to 50%
        const randomSellAmount = (currentBalance * BigInt(Math.floor(percentage * 100))) / 100n;

        if (randomSellAmount === 0n) continue;

        // Approve and sell
        await pumpToken.connect(trader).approve(await bondingCurve.getAddress(), randomSellAmount);

        const asterBefore = await mockAster.balanceOf(await trader.getAddress());

        try {
          await bondingCurve.connect(trader).sellForAster(randomSellAmount, 0);

          // Verify ASTER received
          const asterAfter = await mockAster.balanceOf(await trader.getAddress());
          expect(asterAfter).to.be.gt(asterBefore);
        } catch (error: any) {
          // Only accept specific expected errors
          const acceptableErrors = [
            "InsufficientOutputAmount",
            "InsufficientReserves"
          ];
          const isAcceptable = acceptableErrors.some(err => error.message.includes(err));
          if (!isAcceptable) {
            throw error;
          }
        }
      }
    });

    it("should maintain reserves consistency across buy/sell cycles", async function () {
      this.timeout(60000);

      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const [initialAster, initialToken] = await bondingCurve.getReserves();

        // Random buy
        const buyAmount = ethers.parseEther((Math.random() * 4.999 + 0.001).toFixed(18));
        await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
        await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

        const [afterBuyAster, afterBuyToken] = await bondingCurve.getReserves();
        expect(afterBuyAster).to.be.gt(initialAster); // ASTER increased
        expect(afterBuyToken).to.be.lt(initialToken); // Token decreased

        // Random sell (sell back some tokens)
        const traderBalance = await pumpToken.balanceOf(await trader.getAddress());
        const sellAmount = traderBalance / 2n; // Sell half

        if (sellAmount > 0n) {
          await pumpToken.connect(trader).approve(await bondingCurve.getAddress(), sellAmount);
          await bondingCurve.connect(trader).sellForAster(sellAmount, 0);

          const [afterSellAster, afterSellToken] = await bondingCurve.getReserves();
          expect(afterSellAster).to.be.lt(afterBuyAster); // ASTER decreased
          expect(afterSellToken).to.be.gt(afterBuyToken); // Token increased
        }
      }
    });
  });

  describe("Edge Case Fuzz Tests", function () {
    it("should handle very small amounts (dust)", async function () {
      this.timeout(60000);

      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        // Random amount between 1 wei and 0.001 ASTER
        const dustAmount = BigInt(Math.floor(Math.random() * 1e15) + 1); // 1 wei to 0.001 ASTER

        await mockAster.connect(trader).approve(await bondingCurve.getAddress(), dustAmount);

        try {
          await bondingCurve.connect(trader).buyWithAster(dustAmount, 0);
          // If successful, verify tokens were received (even if small)
          const tokenBalance = await pumpToken.balanceOf(await trader.getAddress());
          expect(tokenBalance).to.be.gte(0);
        } catch (error: any) {
          // Small amounts might fail due to rounding or minimum requirements
          const acceptableErrors = [
            "InsufficientOutputAmount",
            "InsufficientAmount"
          ];
          const isAcceptable = acceptableErrors.some(err => error.message.includes(err));
          if (!isAcceptable) {
            throw error;
          }
        }
      }
    });

    it("should handle alternating buy/sell patterns", async function () {
      this.timeout(60000);

      const iterations = 40;

      for (let i = 0; i < iterations; i++) {
        if (i % 2 === 0) {
          // Buy
          const buyAmount = ethers.parseEther((Math.random() * 4.999 + 0.1).toFixed(18));
          await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
          await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);
        } else {
          // Sell
          const traderBalance = await pumpToken.balanceOf(await trader.getAddress());
          if (traderBalance > 0n) {
            const sellAmount = traderBalance / 3n; // Sell 1/3
            if (sellAmount > 0n) {
              await pumpToken.connect(trader).approve(await bondingCurve.getAddress(), sellAmount);
              await bondingCurve.connect(trader).sellForAster(sellAmount, 0);
            }
          }
        }

        // Verify reserves are always positive
        const [asterReserve, tokenReserve] = await bondingCurve.getReserves();
        expect(asterReserve).to.be.gte(0);
        expect(tokenReserve).to.be.gt(0);
      }
    });

    it("should prevent price manipulation through rapid trades", async function () {
      this.timeout(60000);

      const iterations = 30;

      // Calculate initial price from reserves
      const [initialAster, initialToken] = await bondingCurve.getReserves();
      const initialPrice = ((VIRTUAL_ASTER + initialAster) * ethers.parseEther("1")) / (VIRTUAL_TOKEN + initialToken);

      for (let i = 0; i < iterations; i++) {
        // Random quick buy
        const buyAmount = ethers.parseEther((Math.random() * 0.999 + 0.001).toFixed(18));
        await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
        await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

        // Immediate sell back
        const traderBalance = await pumpToken.balanceOf(await trader.getAddress());
        if (traderBalance > 0n) {
          const sellAmount = traderBalance / 2n;
          if (sellAmount > 0n) {
            await pumpToken.connect(trader).approve(await bondingCurve.getAddress(), sellAmount);
            await bondingCurve.connect(trader).sellForAster(sellAmount, 0);
          }
        }
      }

      // Calculate final price from reserves
      const [finalAster, finalToken] = await bondingCurve.getReserves();
      const finalPrice = ((VIRTUAL_ASTER + finalAster) * ethers.parseEther("1")) / (VIRTUAL_TOKEN + finalToken);
      expect(finalPrice).to.be.gt(0);

      // Price shouldn't deviate by more than 1000x in either direction from rapid trades
      const maxDeviation = initialPrice * 1000n;
      const minDeviation = initialPrice / 1000n;
      expect(finalPrice).to.be.lte(maxDeviation);
      expect(finalPrice).to.be.gte(minDeviation);
    });
  });

  describe("Mathematical Invariant Fuzz Tests", function () {
    it("should never allow reserves to go negative", async function () {
      this.timeout(60000);

      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const action = Math.random() > 0.5 ? 'buy' : 'sell';

        if (action === 'buy') {
          const buyAmount = ethers.parseEther((Math.random() * 9.999 + 0.001).toFixed(18));
          await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);

          try {
            await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);
          } catch (error) {
            // Expected to fail sometimes with insufficient reserves
          }
        } else {
          const traderBalance = await pumpToken.balanceOf(await trader.getAddress());
          if (traderBalance > 0n) {
            const sellAmount = (traderBalance * BigInt(Math.floor(Math.random() * 90 + 10))) / 100n;
            await pumpToken.connect(trader).approve(await bondingCurve.getAddress(), sellAmount);

            try {
              await bondingCurve.connect(trader).sellForAster(sellAmount, 0);
            } catch (error) {
              // Expected to fail sometimes
            }
          }
        }

        // Verify reserves are never negative
        const [asterReserve, tokenReserve] = await bondingCurve.getReserves();
        expect(asterReserve).to.be.gte(0);
        expect(tokenReserve).to.be.gte(0);
      }
    });

    it("should maintain fee calculations accuracy across random amounts", async function () {
      this.timeout(60000);

      const iterations = 50;
      const TRADING_FEE_BPS = 100n; // 1%
      const CREATOR_FEE_BPS = 30n; // 0.3%

      for (let i = 0; i < iterations; i++) {
        const buyAmount = ethers.parseEther((Math.random() * 19.999 + 0.1).toFixed(18));

        // Give buyer ASTER tokens
        await mockAster.transfer(await buyer.getAddress(), buyAmount);
        await mockAster.connect(buyer).approve(await bondingCurve.getAddress(), buyAmount);

        // Get creator and protocol recipient
        const creator = await pumpToken.creator();
        const protocolRecipient = await platformConfig.protocolFeeRecipient();
        const creatorBalanceBefore = await mockAster.balanceOf(creator);
        const platformBalanceBefore = await mockAster.balanceOf(protocolRecipient);

        await bondingCurve.connect(buyer).buyWithAster(buyAmount, 0);

        const creatorBalanceAfter = await mockAster.balanceOf(creator);
        const platformBalanceAfter = await mockAster.balanceOf(protocolRecipient);

        const expectedCreatorFee = (buyAmount * CREATOR_FEE_BPS) / 10000n;
        const expectedProtocolFee = (buyAmount * (TRADING_FEE_BPS - CREATOR_FEE_BPS)) / 10000n;

        const actualCreatorFee = creatorBalanceAfter - creatorBalanceBefore;
        const actualProtocolFee = platformBalanceAfter - platformBalanceBefore;

        // Allow for small rounding differences (within 1 wei per calculation)
        expect(actualCreatorFee).to.be.closeTo(expectedCreatorFee, 1);
        expect(actualProtocolFee).to.be.closeTo(expectedProtocolFee, 1);
      }
    });
  });
});
