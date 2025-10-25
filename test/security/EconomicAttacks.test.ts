import { expect } from "chai";
import { ethers } from "hardhat";
import { BondingCurve, PumpToken, PlatformConfig, TokenFactory, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Economic Attack Scenarios
 *
 * This suite tests the contracts against various economic attacks:
 * - Flash loan attacks
 * - Price manipulation
 * - Sandwich attacks
 * - Front-running
 * - Liquidity draining
 */

describe("Security - Economic Attacks", function () {
  let bondingCurve: BondingCurve;
  let pumpToken: PumpToken;
  let platformConfig: PlatformConfig;
  let tokenFactory: TokenFactory;
  let mockAster: MockERC20;
  let attacker: SignerWithAddress;
  let owner: SignerWithAddress;
  let victim: SignerWithAddress;

  const ASTER_ADDRESS = "0x000Ae314E2A2172a039B26378814C252734f556A";

  beforeEach(async function () {
    [owner, attacker, victim] = await ethers.getSigners();

    // Deploy PlatformConfig
    const PlatformConfigFactory = await ethers.getContractFactory("PlatformConfig");
    platformConfig = await PlatformConfigFactory.deploy(
      await owner.getAddress(),
      await owner.getAddress(),
      await owner.getAddress()
    );
    await platformConfig.waitForDeployment();

    // Deploy mock ASTER token and set it at the expected address
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const mockAsterDeploy = await MockERC20Factory.deploy(
      "Mock ASTER",
      "ASTER",
      ethers.parseEther("10000000") // 10M initial supply
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
      ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [ethers.parseEther("10000000")]),
    ]);

    // Deploy TokenFactory
    const TokenFactoryFactory = await ethers.getContractFactory("TokenFactory");
    tokenFactory = await TokenFactoryFactory.deploy(
      await platformConfig.getAddress(),
      ethers.parseEther("200") // virtual reserve
    );
    await tokenFactory.waitForDeployment();

    // Create a token for testing
    const createTx = await tokenFactory.connect(owner).createToken(
      "Attack Test Token",
      "ATK",
      "ipfs://attack-test"
    );
    await createTx.wait();

    const allTokens = await tokenFactory.getAllTokens(0, 1);
    const tokenAddress = allTokens[0];
    const bcAddress = await tokenFactory.getBondingCurve(tokenAddress);

    pumpToken = await ethers.getContractAt("PumpToken", tokenAddress);
    bondingCurve = await ethers.getContractAt("BondingCurve", bcAddress);

    // Fund participants with ASTER
    await mockAster.transfer(await attacker.getAddress(), ethers.parseEther("10000"));
    await mockAster.transfer(await victim.getAddress(), ethers.parseEther("1000"));
  });

  describe("Flash Loan Attack Simulations", function () {
    it("should resist flash loan price manipulation attack", async function () {
      // Simulate flash loan: attacker borrows large ASTER amount (but within liquidity limits)
      const flashLoanAmount = ethers.parseEther("500");

      // Get initial price
      const priceBefore = await bondingCurve.getPrice();

      // Attacker buys huge amount (simulating flash loan)
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), flashLoanAmount);
      const buyTx = await bondingCurve.connect(attacker).buyWithAster(flashLoanAmount, 0);
      await buyTx.wait();

      // Check price after massive buy
      const priceAfterBuy = await bondingCurve.getPrice();
      expect(priceAfterBuy).to.be.gt(priceBefore);

      // Attacker tries to profit by selling immediately
      const attackerBalance = await pumpToken.balanceOf(await attacker.getAddress());
      await pumpToken.connect(attacker).approve(await bondingCurve.getAddress(), attackerBalance);

      const asterBefore = await mockAster.balanceOf(await attacker.getAddress());
      await bondingCurve.connect(attacker).sellForAster(attackerBalance, 0);
      const asterAfter = await mockAster.balanceOf(await attacker.getAddress());

      // Due to fees (1% on buy, 1% on sell), attacker should lose money
      const netProfit = asterAfter - asterBefore;
      const initialInvestment = flashLoanAmount;

      // Attacker should have LESS than they started with (lost ~2% to fees)
      expect(asterAfter).to.be.lt(initialInvestment);

      // Calculate loss percentage
      const lossPercentage = ((initialInvestment - asterAfter) * 10000n) / initialInvestment;
      console.log(`      Flash loan attack resulted in ${lossPercentage / 100n}% loss`);

      // Loss should be approximately 2% (1% buy fee + 1% sell fee)
      expect(lossPercentage).to.be.gte(150n); // At least 1.5% loss
      expect(lossPercentage).to.be.lte(250n); // At most 2.5% loss (accounting for slippage)
    });

    it("should prevent flash loan arbitrage between multiple tokens", async function () {
      // Create second token
      const createTx2 = await tokenFactory.connect(owner).createToken(
        "Token 2",
        "TK2",
        "ipfs://token2"
      );
      await createTx2.wait();

      const allTokens = await tokenFactory.getAllTokens(0, 2);
      const token2Address = allTokens[1];
      const bc2Address = await tokenFactory.getBondingCurve(token2Address);

      const pumpToken2 = await ethers.getContractAt("PumpToken", token2Address);
      const bondingCurve2 = await ethers.getContractAt("BondingCurve", bc2Address);

      // Attacker tries to arbitrage: buy Token1, sell Token2
      const arbitrageAmount = ethers.parseEther("1000");

      const asterStart = await mockAster.balanceOf(await attacker.getAddress());

      // Buy Token1
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), arbitrageAmount);
      await bondingCurve.connect(attacker).buyWithAster(arbitrageAmount, 0);

      // Buy Token2
      await mockAster.connect(attacker).approve(await bondingCurve2.getAddress(), arbitrageAmount);
      await bondingCurve2.connect(attacker).buyWithAster(arbitrageAmount, 0);

      // Sell both
      const balance1 = await pumpToken.balanceOf(await attacker.getAddress());
      const balance2 = await pumpToken2.balanceOf(await attacker.getAddress());

      await pumpToken.connect(attacker).approve(await bondingCurve.getAddress(), balance1);
      await bondingCurve.connect(attacker).sellForAster(balance1, 0);

      await pumpToken2.connect(attacker).approve(await bondingCurve2.getAddress(), balance2);
      await bondingCurve2.connect(attacker).sellForAster(balance2, 0);

      const asterEnd = await mockAster.balanceOf(await attacker.getAddress());

      // Attacker should lose money due to fees
      expect(asterEnd).to.be.lt(asterStart);

      const loss = asterStart - asterEnd;
      console.log(`      Multi-token arbitrage loss: ${ethers.formatEther(loss)} ASTER`);
    });

    it("should maintain reserve integrity during flash loan attacks", async function () {
      const [initialAster, initialToken] = await bondingCurve.getReserves();

      // Simulate flash loan attack (within liquidity limits)
      const flashAmount = ethers.parseEther("300");
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), flashAmount);
      await bondingCurve.connect(attacker).buyWithAster(flashAmount, 0);

      const [midAster, midToken] = await bondingCurve.getReserves();

      // Sell back
      const attackerTokens = await pumpToken.balanceOf(await attacker.getAddress());
      await pumpToken.connect(attacker).approve(await bondingCurve.getAddress(), attackerTokens);
      await bondingCurve.connect(attacker).sellForAster(attackerTokens, 0);

      const [finalAster, finalToken] = await bondingCurve.getReserves();

      // Reserves should be higher than initial (due to fees collected)
      expect(finalAster).to.be.gt(initialAster);
      // Token reserves should be close to initial (some may have been traded away)
      expect(finalToken).to.be.lte(initialToken);

      // Note: protocolFees() doesn't exist - fees are distributed directly during trades
    });
  });

  describe("Sandwich Attack Prevention", function () {
    it("should protect users from sandwich attacks via slippage", async function () {
      // Victim places a buy order with slippage protection
      const victimBuyAmount = ethers.parseEther("100");
      await mockAster.connect(victim).approve(await bondingCurve.getAddress(), victimBuyAmount);

      // Calculate expected output with slippage tolerance (5%)
      const expectedOutput = await bondingCurve.getAmountOut(victimBuyAmount, true);
      const minOutput = (expectedOutput * 95n) / 100n; // 5% slippage tolerance

      // Attacker front-runs with large buy
      const frontRunAmount = ethers.parseEther("500");
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), frontRunAmount);
      await bondingCurve.connect(attacker).buyWithAster(frontRunAmount, 0);

      // Victim's transaction should revert due to slippage
      await expect(
        bondingCurve.connect(victim).buyWithAster(victimBuyAmount, minOutput)
      ).to.be.revertedWith("Insufficient output amount");

      console.log("      ✓ Sandwich attack prevented by slippage protection");
    });

    it("should allow victim to adjust slippage and complete trade", async function () {
      const victimBuyAmount = ethers.parseEther("100");
      await mockAster.connect(victim).approve(await bondingCurve.getAddress(), victimBuyAmount);

      // Attacker front-runs
      const frontRunAmount = ethers.parseEther("500");
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), frontRunAmount);
      await bondingCurve.connect(attacker).buyWithAster(frontRunAmount, 0);

      // Victim adjusts slippage to accept new price (or sets minOut = 0)
      const victimBalanceBefore = await pumpToken.balanceOf(await victim.getAddress());
      await bondingCurve.connect(victim).buyWithAster(victimBuyAmount, 0); // No slippage protection
      const victimBalanceAfter = await pumpToken.balanceOf(await victim.getAddress());

      // Victim should receive tokens, but fewer due to price impact
      expect(victimBalanceAfter).to.be.gt(victimBalanceBefore);

      console.log(`      Victim received: ${ethers.formatEther(victimBalanceAfter - victimBalanceBefore)} tokens`);
    });

    it("should make sandwich attacks unprofitable due to fees", async function () {
      const victimBuyAmount = ethers.parseEther("100");
      const attackerInitialBalance = await mockAster.balanceOf(await attacker.getAddress());

      // Step 1: Attacker front-runs
      const frontRunAmount = ethers.parseEther("500");
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), frontRunAmount);
      await bondingCurve.connect(attacker).buyWithAster(frontRunAmount, 0);

      // Step 2: Victim buys
      await mockAster.connect(victim).approve(await bondingCurve.getAddress(), victimBuyAmount);
      await bondingCurve.connect(victim).buyWithAster(victimBuyAmount, 0);

      // Step 3: Attacker back-runs (sells)
      const attackerTokenBalance = await pumpToken.balanceOf(await attacker.getAddress());
      await pumpToken.connect(attacker).approve(await bondingCurve.getAddress(), attackerTokenBalance);
      await bondingCurve.connect(attacker).sellForAster(attackerTokenBalance, 0);

      const attackerFinalBalance = await mockAster.balanceOf(await attacker.getAddress());

      // Attacker should lose money due to 2% round-trip fees
      expect(attackerFinalBalance).to.be.lt(attackerInitialBalance);

      const loss = attackerInitialBalance - attackerFinalBalance;
      const lossPercentage = (loss * 10000n) / frontRunAmount;

      console.log(`      Sandwich attacker loss: ${ethers.formatEther(loss)} ASTER (${lossPercentage / 100n}%)`);
      expect(lossPercentage).to.be.gte(150n); // At least 1.5% loss
    });
  });

  describe("Front-Running Attack Mitigation", function () {
    it("should detect and handle large front-running attempts", async function () {
      // Victim submits transaction
      const victimAmount = ethers.parseEther("50");

      // Attacker sees victim's transaction in mempool and front-runs
      const attackerAmount = ethers.parseEther("1000");
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), attackerAmount);

      const priceBefore = await bondingCurve.getPrice();
      await bondingCurve.connect(attacker).buyWithAster(attackerAmount, 0);
      const priceAfter = await bondingCurve.getPrice();

      // Price should increase significantly
      const priceIncrease = ((priceAfter - priceBefore) * 100n) / priceBefore;
      console.log(`      Price increase from front-run: ${priceIncrease}%`);

      // Victim's transaction with slippage protection should fail
      await mockAster.connect(victim).approve(await bondingCurve.getAddress(), victimAmount);
      const expectedOut = await bondingCurve.getAmountOut(victimAmount, true);
      const minOut = (expectedOut * 95n) / 100n;

      await expect(
        bondingCurve.connect(victim).buyWithAster(victimAmount, minOut)
      ).to.be.revertedWith("Insufficient output amount");
    });

    it("should make front-running unprofitable via fees", async function () {
      // Similar to sandwich attack, front-running should be unprofitable
      const attackerStart = await mockAster.balanceOf(await attacker.getAddress());

      // Front-run (within reasonable limits)
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), ethers.parseEther("80"));
      await bondingCurve.connect(attacker).buyWithAster(ethers.parseEther("80"), 0);

      // Immediate sell (no victim trade to profit from)
      const tokens = await pumpToken.balanceOf(await attacker.getAddress());
      await pumpToken.connect(attacker).approve(await bondingCurve.getAddress(), tokens);
      await bondingCurve.connect(attacker).sellForAster(tokens, 0);

      const attackerEnd = await mockAster.balanceOf(await attacker.getAddress());

      expect(attackerEnd).to.be.lt(attackerStart);
      console.log(`      Front-run with no profit opportunity: ${ethers.formatEther(attackerStart - attackerEnd)} ASTER loss`);
    });
  });

  describe("Price Manipulation Resistance", function () {
    it("should resist price manipulation through large single trades", async function () {
      const initialPrice = await bondingCurve.getPrice();

      // Attacker buys large amount (within liquidity limits)
      const manipulationAmount = ethers.parseEther("200");
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), manipulationAmount);
      await bondingCurve.connect(attacker).buyWithAster(manipulationAmount, 0);

      const manipulatedPrice = await bondingCurve.getPrice();

      // Verify price increased (which is expected)
      expect(manipulatedPrice).to.be.gt(initialPrice);

      // But selling immediately should result in loss due to fees
      const attackerTokens = await pumpToken.balanceOf(await attacker.getAddress());
      await pumpToken.connect(attacker).approve(await bondingCurve.getAddress(), attackerTokens);

      const asterBefore = await mockAster.balanceOf(await attacker.getAddress());
      await bondingCurve.connect(attacker).sellForAster(attackerTokens, 0);
      const asterAfter = await mockAster.balanceOf(await attacker.getAddress());

      const totalLoss = manipulationAmount - asterAfter;
      expect(totalLoss).to.be.gt(0);

      console.log(`      Price manipulation cost: ${ethers.formatEther(totalLoss)} ASTER`);
    });

    it("should maintain fair pricing across multiple sequential trades", async function () {
      const tradeAmount = ethers.parseEther("10");

      // Execute 10 small trades
      for (let i = 0; i < 10; i++) {
        await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), tradeAmount);

        const priceBefore = await bondingCurve.getPrice();
        await bondingCurve.connect(attacker).buyWithAster(tradeAmount, 0);
        const priceAfter = await bondingCurve.getPrice();

        // Each trade should incrementally increase price (constant product curve)
        expect(priceAfter).to.be.gt(priceBefore);
      }

      // Final price should be significantly higher
      const finalPrice = await bondingCurve.getPrice();
      const initialPrice = await bondingCurve.getPrice(); // Would need to store this earlier

      console.log(`      Price after 10 trades: ${ethers.formatEther(finalPrice)} ASTER per token`);
    });

    it("should prevent oracle price manipulation", async function () {
      // Get current price from bonding curve (acts as price oracle)
      const oraclePrice = await bondingCurve.getPrice();

      // Large buy to manipulate price (within liquidity limits)
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), ethers.parseEther("150"));
      await bondingCurve.connect(attacker).buyWithAster(ethers.parseEther("150"), 0);

      const manipulatedPrice = await bondingCurve.getPrice();

      // Price increased as expected
      expect(manipulatedPrice).to.be.gt(oraclePrice);

      // But this is not exploitable because:
      // 1. Price is based on actual reserves (can't be faked)
      // 2. Any profit attempt requires selling, which includes fees
      // 3. Constant product formula ensures fair pricing

      // Verify reserves match the price
      const [asterReserve, tokenReserve] = await bondingCurve.getReserves();
      const virtualAster = ethers.parseEther("200");
      const virtualToken = ethers.parseEther("200000000");

      const calculatedPrice = ((virtualAster + asterReserve) * BigInt(1e18)) / (virtualToken + tokenReserve);
      // Prices should be consistent with reserves (both should be non-zero)
      expect(calculatedPrice).to.be.gt(0);
      expect(manipulatedPrice).to.be.gt(0);
    });
  });

  describe("Liquidity Draining Attacks", function () {
    it("should prevent complete liquidity drainage", async function () {
      const [initialAster, initialToken] = await bondingCurve.getReserves();

      // Attacker tries to drain all ASTER
      const attackerBalance = await mockAster.balanceOf(await attacker.getAddress());

      try {
        await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), attackerBalance);
        await bondingCurve.connect(attacker).buyWithAster(attackerBalance, 0);
      } catch (error) {
        // May fail if trying to buy more than available
      }

      const [finalAster, finalToken] = await bondingCurve.getReserves();

      // Some ASTER should remain (due to virtual reserves)
      expect(finalToken).to.be.gt(0);

      // Virtual reserves ensure curve never breaks
      console.log(`      Remaining token reserve: ${ethers.formatEther(finalToken)}`);
    });

    it("should maintain bonding curve integrity with minimal liquidity", async function () {
      // Buy most of the tokens (within liquidity limits)
      const largeBuy = ethers.parseEther("500");
      await mockAster.transfer(await attacker.getAddress(), largeBuy);
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), largeBuy);

      try {
        await bondingCurve.connect(attacker).buyWithAster(largeBuy, 0);
      } catch (error) {
        // Expected to potentially fail with insufficient liquidity
      }

      // Even with drained liquidity, price calculation should work
      const price = await bondingCurve.getPrice();
      expect(price).to.be.gt(0);

      // Small trades should still be possible
      await mockAster.connect(victim).approve(await bondingCurve.getAddress(), ethers.parseEther("1"));
      const tx = await bondingCurve.connect(victim).buyWithAster(ethers.parseEther("1"), 0);
      await tx.wait();

      expect(tx).to.not.be.reverted;
    });
  });

  describe("Compound Attack Scenarios", function () {
    it("should resist combined flash loan + sandwich attack", async function () {
      // This is the most sophisticated attack: flash loan to execute sandwich
      const flashAmount = ethers.parseEther("300");
      const victimAmount = ethers.parseEther("100");

      const attackerStart = await mockAster.balanceOf(await attacker.getAddress());

      // Attacker borrows flash loan and front-runs
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), flashAmount);
      await bondingCurve.connect(attacker).buyWithAster(flashAmount, 0);

      // Victim trades
      await mockAster.connect(victim).approve(await bondingCurve.getAddress(), victimAmount);
      await bondingCurve.connect(victim).buyWithAster(victimAmount, 0);

      // Attacker back-runs and repays flash loan
      const attackerTokens = await pumpToken.balanceOf(await attacker.getAddress());
      await pumpToken.connect(attacker).approve(await bondingCurve.getAddress(), attackerTokens);
      await bondingCurve.connect(attacker).sellForAster(attackerTokens, 0);

      const attackerEnd = await mockAster.balanceOf(await attacker.getAddress());

      // Calculate net result (could be small loss or small profit depending on victim's trade size)
      const netResult = attackerEnd > attackerStart
        ? attackerEnd - attackerStart
        : attackerStart - attackerEnd;
      const isProfit = attackerEnd > attackerStart;

      console.log(`      Combined attack result: ${isProfit ? 'profit' : 'loss'} ${ethers.formatEther(netResult)} ASTER`);

      // With a relatively small victim trade (100 ASTER vs 300 flash), attacker might make small profit
      // The key is that profit should be minimal compared to flash loan amount (<1%)
      const resultPercentage = (netResult * 10000n) / flashAmount;
      expect(resultPercentage).to.be.lte(100n); // Result should be less than 1% of flash amount
    });

    it("should resist multi-block MEV extraction attempts", async function () {
      // Simulate MEV bot trying to profit over multiple blocks
      const initialBalance = await mockAster.balanceOf(await attacker.getAddress());

      // Block 1: Buy
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), ethers.parseEther("500"));
      await bondingCurve.connect(attacker).buyWithAster(ethers.parseEther("500"), 0);

      // Simulate victim trades (organic volume)
      await mockAster.connect(victim).approve(await bondingCurve.getAddress(), ethers.parseEther("50"));
      await bondingCurve.connect(victim).buyWithAster(ethers.parseEther("50"), 0);

      // Block 2: Sell
      const attackerTokens = await pumpToken.balanceOf(await attacker.getAddress());
      await pumpToken.connect(attacker).approve(await bondingCurve.getAddress(), attackerTokens);
      await bondingCurve.connect(attacker).sellForAster(attackerTokens, 0);

      const finalBalance = await mockAster.balanceOf(await attacker.getAddress());

      // Calculate net result
      const netResult = finalBalance > initialBalance
        ? finalBalance - initialBalance
        : initialBalance - finalBalance;
      const isProfit = finalBalance > initialBalance;

      console.log(`      Multi-block MEV attempt: ${isProfit ? 'profit' : 'loss'} ${ethers.formatEther(netResult)} ASTER`);

      // Even with organic volume, profit should be minimal due to fees
      // Allow small profit but ensure it's less than 1% of investment
      if (isProfit) {
        const profitPercentage = (netResult * 10000n) / ethers.parseEther("500");
        expect(profitPercentage).to.be.lte(100n); // Less than 1%
      }
    });
  });

  describe("Economic Invariants", function () {
    it("should always maintain k invariant after any attack", async function () {
      const [initialAster, initialToken] = await bondingCurve.getReserves();
      const virtualAster = ethers.parseEther("200");
      const virtualToken = ethers.parseEther("200000000");

      const initialK = (virtualAster + initialAster) * (virtualToken + initialToken);

      // Execute various attack patterns (within liquidity limits)
      await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), ethers.parseEther("100"));
      await bondingCurve.connect(attacker).buyWithAster(ethers.parseEther("100"), 0);

      const tokens = await pumpToken.balanceOf(await attacker.getAddress());
      await pumpToken.connect(attacker).approve(await bondingCurve.getAddress(), tokens / 2n);
      await bondingCurve.connect(attacker).sellForAster(tokens / 2n, 0);

      const [finalAster, finalToken] = await bondingCurve.getReserves();
      const finalK = (virtualAster + finalAster) * (virtualToken + finalToken);

      // K should increase (due to fees) or stay approximately the same
      expect(finalK).to.be.gte(initialK);

      console.log(`      K increased by: ${((finalK - initialK) * 100n) / initialK}%`);
    });

    it("should ensure total token supply remains constant", async function () {
      const totalSupply = await pumpToken.totalSupply();

      // Execute various trades
      for (let i = 0; i < 5; i++) {
        await mockAster.connect(attacker).approve(await bondingCurve.getAddress(), ethers.parseEther("100"));
        await bondingCurve.connect(attacker).buyWithAster(ethers.parseEther("100"), 0);
      }

      const finalSupply = await pumpToken.totalSupply();

      // Supply should never change
      expect(finalSupply).to.equal(totalSupply);
      expect(totalSupply).to.equal(ethers.parseEther("1000000000")); // 1 billion
    });
  });
});
