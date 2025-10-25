import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  GraduationManager,
  BondingCurve,
  PumpToken,
  PlatformConfig,
  TokenFactory,
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * GraduationManager BSC Mainnet Fork Tests
 *
 * These tests use real BSC mainnet contracts to validate:
 * - ASTER → WBNB swap on real PancakeSwap
 * - Token/WBNB pair creation
 * - Liquidity addition
 * - LP token burning
 * - Complete graduation flow
 *
 * Run with: FORK_MAINNET=true npx hardhat test test/integration/GraduationManager.fork.test.ts
 */

describe("GraduationManager - BSC Mainnet Fork Tests", function () {
  let graduationManager: GraduationManager;
  let platformConfig: PlatformConfig;
  let tokenFactory: TokenFactory;
  let bondingCurve: BondingCurve;
  let pumpToken: PumpToken;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let trader: SignerWithAddress;

  // Real BSC Mainnet addresses
  const ASTER_ADDRESS = "0x000Ae314E2A2172a039B26378814C252734f556A";
  const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
  const PANCAKE_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
  const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

  before(async function () {
    // Skip if not running with fork
    if (!process.env.FORK_MAINNET) {
      this.skip();
    }

    // Verify we're on forked network
    const chainId = (await ethers.provider.getNetwork()).chainId;
    console.log(`Running on chain ID: ${chainId}`);

    [owner, creator, trader] = await ethers.getSigners();

    // Deploy PlatformConfig
    const PlatformConfigFactory = await ethers.getContractFactory("PlatformConfig");
    platformConfig = await PlatformConfigFactory.deploy(
      await owner.getAddress(), // protocol fee recipient
      await owner.getAddress(), // admin
      await owner.getAddress()  // pauser
    );
    await platformConfig.waitForDeployment();

    console.log(`PlatformConfig deployed to: ${await platformConfig.getAddress()}`);

    // Deploy GraduationManager (uses real PancakeSwap contracts)
    const GraduationManagerFactory = await ethers.getContractFactory("GraduationManager");
    graduationManager = await GraduationManagerFactory.deploy(
      await platformConfig.getAddress()
    );
    await graduationManager.waitForDeployment();

    console.log(`GraduationManager deployed to: ${await graduationManager.getAddress()}`);

    // Deploy TokenFactory
    const TokenFactoryFactory = await ethers.getContractFactory("TokenFactory");
    const virtualAsterReserve = ethers.parseEther("200"); // 200 ASTER virtual reserve
    tokenFactory = await TokenFactoryFactory.deploy(
      await platformConfig.getAddress(),
      virtualAsterReserve
    );
    await tokenFactory.waitForDeployment();

    console.log(`TokenFactory deployed to: ${await tokenFactory.getAddress()}`);

    // Give test accounts ASTER tokens using storage manipulation
    // This is more reliable than impersonating whales with free RPC nodes
    const asterAmount = ethers.parseEther("10000"); // 10000 ASTER

    // Set ASTER balance for owner
    await network.provider.send("hardhat_setStorageAt", [
      ASTER_ADDRESS,
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256"],
          [await owner.getAddress(), 0]
        )
      ),
      ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [asterAmount]),
    ]);

    // Set ASTER balance for trader
    await network.provider.send("hardhat_setStorageAt", [
      ASTER_ADDRESS,
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256"],
          [await trader.getAddress(), 0]
        )
      ),
      ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [asterAmount]),
    ]);

    console.log(`Set ${ethers.formatEther(asterAmount)} ASTER balance for test accounts via storage manipulation`);
  });

  beforeEach(async function () {
    // Create a new token for each test
    const tx = await tokenFactory.connect(creator).createToken(
      "Fork Test Token",
      "FORK",
      "ipfs://fork-test"
    );
    await tx.wait();

    // Get token and bonding curve addresses
    const allTokens = await tokenFactory.getAllTokens(0, 100);
    const tokenAddress = allTokens[allTokens.length - 1];
    const bcAddress = await tokenFactory.getBondingCurve(tokenAddress);

    pumpToken = await ethers.getContractAt("PumpToken", tokenAddress);
    bondingCurve = await ethers.getContractAt("BondingCurve", bcAddress);

    console.log(`\nCreated token: ${tokenAddress}`);
    console.log(`Bonding curve: ${bcAddress}`);
  });

  describe("ASTER to WBNB Swap", function () {
    it("should swap ASTER to WBNB using real PancakeSwap", async function () {
      // Get real contract instances
      const asterToken = await ethers.getContractAt("IERC20", ASTER_ADDRESS);
      const wbnbToken = await ethers.getContractAt("IERC20", WBNB_ADDRESS);
      const pancakeRouter = await ethers.getContractAt(
        "IPancakeRouter",
        PANCAKE_ROUTER
      );

      // Buy tokens with ASTER to accumulate reserves
      const buyAmount = ethers.parseEther("110"); // Enough to trigger graduation
      await asterToken.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Check ASTER balance before graduation
      const asterBefore = await asterToken.balanceOf(await bondingCurve.getAddress());
      expect(asterBefore).to.be.gte(ethers.parseEther("100"), "Should have 100+ ASTER");

      // Get WBNB balance before
      const wbnbBefore = await wbnbToken.balanceOf(await graduationManager.getAddress());

      // Execute graduation
      await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );

      // Verify ASTER was swapped
      const asterAfter = await asterToken.balanceOf(await bondingCurve.getAddress());
      expect(asterAfter).to.equal(0, "ASTER should be fully swapped");

      // Verify WBNB was received (approximately)
      const wbnbAfter = await wbnbToken.balanceOf(await graduationManager.getAddress());
      expect(wbnbAfter).to.be.gt(wbnbBefore, "Should receive WBNB from swap");

      console.log(`Swapped ${ethers.formatEther(asterBefore)} ASTER for ${ethers.formatEther(wbnbAfter)} WBNB`);
    });

    it("should get accurate swap quote from PancakeSwap", async function () {
      const asterToken = await ethers.getContractAt("IERC20", ASTER_ADDRESS);
      const pancakeRouter = await ethers.getContractAt(
        "IPancakeRouter",
        PANCAKE_ROUTER
      );

      const asterAmount = ethers.parseEther("100");

      // Get amounts out from PancakeSwap
      const path = [ASTER_ADDRESS, WBNB_ADDRESS];
      const amounts = await pancakeRouter.getAmountsOut(asterAmount, path);

      expect(amounts.length).to.equal(2);
      expect(amounts[0]).to.equal(asterAmount);
      expect(amounts[1]).to.be.gt(0, "Should return non-zero WBNB amount");

      console.log(`100 ASTER → ${ethers.formatEther(amounts[1])} WBNB (quote)`);
    });
  });

  describe("PancakeSwap Pair Creation", function () {
    it("should create Token/WBNB pair on real PancakeSwap Factory", async function () {
      const pancakeFactory = await ethers.getContractAt(
        "IPancakeFactory",
        PANCAKE_FACTORY
      );

      // Accumulate ASTER in bonding curve
      const asterToken = await ethers.getContractAt("IERC20", ASTER_ADDRESS);
      const buyAmount = ethers.parseEther("110");
      await asterToken.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Check if pair exists before graduation
      const pairBefore = await pancakeFactory.getPair(
        await pumpToken.getAddress(),
        WBNB_ADDRESS
      );
      expect(pairBefore).to.equal(ethers.ZeroAddress, "Pair should not exist yet");

      // Execute graduation
      await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );

      // Verify pair was created
      const pairAfter = await pancakeFactory.getPair(
        await pumpToken.getAddress(),
        WBNB_ADDRESS
      );
      expect(pairAfter).to.not.equal(ethers.ZeroAddress, "Pair should be created");

      console.log(`Created PancakeSwap pair at: ${pairAfter}`);

      // Verify it's a real pair contract
      const pairContract = await ethers.getContractAt("IERC20", pairAfter);
      const pairName = await pairContract.name();
      expect(pairName).to.include("Pancake", "Should be a PancakeSwap LP token");
    });

    it("should return correct pair address from factory", async function () {
      const asterToken = await ethers.getContractAt("IERC20", ASTER_ADDRESS);
      const pancakeFactory = await ethers.getContractAt(
        "IPancakeFactory",
        PANCAKE_FACTORY
      );

      // Graduate the token
      const buyAmount = ethers.parseEther("110");
      await asterToken.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );

      // Get pair address both ways
      const pairFromFactory = await pancakeFactory.getPair(
        await pumpToken.getAddress(),
        WBNB_ADDRESS
      );

      // Verify pair has non-zero supply
      const pairContract = await ethers.getContractAt("IERC20", pairFromFactory);
      const totalSupply = await pairContract.totalSupply();
      expect(totalSupply).to.be.gt(0, "Pair should have liquidity");

      console.log(`Pair total supply: ${ethers.formatEther(totalSupply)} LP tokens`);
    });
  });

  describe("Liquidity Addition", function () {
    it("should add liquidity with correct token/WBNB ratio", async function () {
      const asterToken = await ethers.getContractAt("IERC20", ASTER_ADDRESS);
      const wbnbToken = await ethers.getContractAt("IERC20", WBNB_ADDRESS);
      const pancakeFactory = await ethers.getContractAt(
        "IPancakeFactory",
        PANCAKE_FACTORY
      );

      // Graduate the token
      const buyAmount = ethers.parseEther("110");
      await asterToken.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Get reserves before graduation
      const [realAsterBefore, realTokenBefore] = await bondingCurve.getReserves();

      await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );

      // Get pair and check reserves
      const pairAddress = await pancakeFactory.getPair(
        await pumpToken.getAddress(),
        WBNB_ADDRESS
      );

      const pairContract = await ethers.getContractAt(
        ["function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"],
        pairAddress
      );

      const reserves = await pairContract.getReserves();

      // Determine which is token0 and token1
      const token0 = await pumpToken.getAddress() < WBNB_ADDRESS
        ? await pumpToken.getAddress()
        : WBNB_ADDRESS;

      const tokenReserve = token0 === await pumpToken.getAddress() ? reserves[0] : reserves[1];
      const wbnbReserve = token0 === await pumpToken.getAddress() ? reserves[1] : reserves[0];

      expect(tokenReserve).to.be.gt(0, "Should have token reserves");
      expect(wbnbReserve).to.be.gt(0, "Should have WBNB reserves");

      console.log(`Liquidity added: ${ethers.formatEther(tokenReserve)} tokens, ${ethers.formatEther(wbnbReserve)} WBNB`);
    });

    it("should transfer all remaining tokens to liquidity pool", async function () {
      const asterToken = await ethers.getContractAt("IERC20", ASTER_ADDRESS);
      const pancakeFactory = await ethers.getContractAt(
        "IPancakeFactory",
        PANCAKE_FACTORY
      );

      // Get bonding curve token balance before
      const bcTokenBalanceBefore = await pumpToken.balanceOf(await bondingCurve.getAddress());

      // Graduate
      const buyAmount = ethers.parseEther("110");
      await asterToken.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );

      // Bonding curve should have no tokens left
      const bcTokenBalanceAfter = await pumpToken.balanceOf(await bondingCurve.getAddress());
      expect(bcTokenBalanceAfter).to.equal(0, "Bonding curve should have no tokens");

      // Pair should have the tokens
      const pairAddress = await pancakeFactory.getPair(
        await pumpToken.getAddress(),
        WBNB_ADDRESS
      );
      const pairTokenBalance = await pumpToken.balanceOf(pairAddress);
      expect(pairTokenBalance).to.be.gt(0, "Pair should have tokens");

      console.log(`Transferred ${ethers.formatEther(pairTokenBalance)} tokens to LP`);
    });
  });

  describe("LP Token Burning", function () {
    it("should burn LP tokens to address(0) for permanent lock", async function () {
      const asterToken = await ethers.getContractAt("IERC20", ASTER_ADDRESS);
      const pancakeFactory = await ethers.getContractAt(
        "IPancakeFactory",
        PANCAKE_FACTORY
      );

      // Graduate
      const buyAmount = ethers.parseEther("110");
      await asterToken.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );

      // Get pair address
      const pairAddress = await pancakeFactory.getPair(
        await pumpToken.getAddress(),
        WBNB_ADDRESS
      );

      const pairContract = await ethers.getContractAt("IERC20", pairAddress);

      // Check LP tokens at address(0)
      const burnedLPTokens = await pairContract.balanceOf(ethers.ZeroAddress);
      expect(burnedLPTokens).to.be.gt(0, "LP tokens should be burned");

      // GraduationManager should have no LP tokens
      const gmLPTokens = await pairContract.balanceOf(await graduationManager.getAddress());
      expect(gmLPTokens).to.equal(0, "GraduationManager should not hold LP tokens");

      console.log(`Burned ${ethers.formatEther(burnedLPTokens)} LP tokens (permanently locked)`);
    });

    it("should make liquidity permanently locked (unretrievable)", async function () {
      const asterToken = await ethers.getContractAt("IERC20", ASTER_ADDRESS);
      const pancakeFactory = await ethers.getContractAt(
        "IPancakeFactory",
        PANCAKE_FACTORY
      );

      // Graduate
      const buyAmount = ethers.parseEther("110");
      await asterToken.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );

      const pairAddress = await pancakeFactory.getPair(
        await pumpToken.getAddress(),
        WBNB_ADDRESS
      );

      const pairContract = await ethers.getContractAt("IERC20", pairAddress);

      // Total supply should equal burned amount (minus minimum liquidity)
      const totalSupply = await pairContract.totalSupply();
      const burnedAmount = await pairContract.balanceOf(ethers.ZeroAddress);

      // Account for PancakeSwap's MINIMUM_LIQUIDITY (1000 wei locked permanently)
      const MINIMUM_LIQUIDITY = 1000n;
      expect(totalSupply - burnedAmount).to.be.lte(MINIMUM_LIQUIDITY, "All LP tokens should be burned except minimum");

      console.log(`Total LP: ${ethers.formatEther(totalSupply)}, Burned: ${ethers.formatEther(burnedAmount)}`);
    });
  });

  describe("Complete Graduation Flow", function () {
    it("should execute complete end-to-end graduation successfully", async function () {
      const asterToken = await ethers.getContractAt("IERC20", ASTER_ADDRESS);
      const wbnbToken = await ethers.getContractAt("IERC20", WBNB_ADDRESS);
      const pancakeFactory = await ethers.getContractAt(
        "IPancakeFactory",
        PANCAKE_FACTORY
      );

      // 1. Verify initial state
      expect(await bondingCurve.graduated()).to.be.false;
      const creatorAllocationBefore = await pumpToken.creatorAllocation();
      expect(creatorAllocationBefore).to.be.gt(0);

      // 2. Accumulate ASTER through trading
      const buyAmount = ethers.parseEther("110");
      await asterToken.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // 3. Verify graduation threshold met
      const [realAster] = await bondingCurve.getReserves();
      expect(realAster).to.be.gte(ethers.parseEther("100"), "Should meet graduation threshold");

      // 4. Execute graduation
      const graduationTx = await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );
      const receipt = await graduationTx.wait();

      // 5. Verify bonding curve marked as graduated
      expect(await bondingCurve.graduated()).to.be.true;

      // 6. Verify PancakeSwap pair created
      const pairAddress = await pancakeFactory.getPair(
        await pumpToken.getAddress(),
        WBNB_ADDRESS
      );
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);

      // 7. Verify liquidity added
      const pairContract = await ethers.getContractAt("IERC20", pairAddress);
      const pairBalance = await pumpToken.balanceOf(pairAddress);
      expect(pairBalance).to.be.gt(0);

      // 8. Verify LP tokens burned
      const burnedLP = await pairContract.balanceOf(ethers.ZeroAddress);
      expect(burnedLP).to.be.gt(0);

      // 9. Verify creator allocation unlocked
      // Creator should be able to transfer their tokens now
      const creatorBalance = await pumpToken.balanceOf(await creator.getAddress());
      expect(creatorBalance).to.be.gt(0, "Creator should have received allocation");

      console.log("\n✅ Complete Graduation Flow Verified:");
      console.log(`  - Gas used: ${receipt!.gasUsed}`);
      console.log(`  - Pair created: ${pairAddress}`);
      console.log(`  - Liquidity: ${ethers.formatEther(pairBalance)} tokens`);
      console.log(`  - LP burned: ${ethers.formatEther(burnedLP)}`);
      console.log(`  - Creator received: ${ethers.formatEther(creatorBalance)} tokens`);
    });

    it("should handle graduation with exact threshold amount", async function () {
      const asterToken = await ethers.getContractAt("IERC20", ASTER_ADDRESS);

      // Buy exactly enough to reach 100 ASTER threshold
      // Account for fees: need slightly more than 100 to have 100 in reserves
      const buyAmount = ethers.parseEther("101"); // 1% fee means ~100 ASTER in reserves

      await asterToken.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Should be able to graduate
      await expect(
        graduationManager.executeGraduation(
          await pumpToken.getAddress(),
          await bondingCurve.getAddress()
        )
      ).to.not.be.reverted;

      expect(await bondingCurve.graduated()).to.be.true;
    });

    it("should emit Graduated event on bonding curve", async function () {
      const asterToken = await ethers.getContractAt("IERC20", ASTER_ADDRESS);

      const buyAmount = ethers.parseEther("110");
      await asterToken.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // Check for Graduated event
      await expect(
        graduationManager.executeGraduation(
          await pumpToken.getAddress(),
          await bondingCurve.getAddress()
        )
      ).to.emit(bondingCurve, "Graduated");
    });
  });

  describe("Gas Costs", function () {
    it("should complete graduation within 3M gas target", async function () {
      const asterToken = await ethers.getContractAt("IERC20", ASTER_ADDRESS);

      const buyAmount = ethers.parseEther("110");
      await asterToken.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      const tx = await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );
      const receipt = await tx.wait();

      const gasUsed = receipt!.gasUsed;
      const target = 3_000_000n;

      console.log(`Graduation gas used: ${gasUsed} (target: ${target})`);
      expect(gasUsed).to.be.lte(target, "Should be within 3M gas target");
    });
  });
});
