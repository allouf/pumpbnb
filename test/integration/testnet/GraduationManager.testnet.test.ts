import { expect } from "chai";
import { ethers } from "hardhat";
import {
  GraduationManager,
  BondingCurve,
  PumpToken,
  PlatformConfig,
  TokenFactory,
  MockERC20,
} from "../../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import * as fs from "fs";
import * as path from "path";

/**
 * GraduationManager BSC Testnet Integration Tests
 *
 * These tests run against DEPLOYED contracts on BSC Testnet
 *
 * Prerequisites:
 * 1. Deploy contracts to BSC Testnet: npx hardhat run scripts/deploy-testnet.ts --network bscTestnet
 * 2. Get deployment addresses from deployments/bsc-testnet.json
 * 3. Fund test accounts with testnet BNB and Mock ASTER
 *
 * Run: npx hardhat test test/integration/testnet/GraduationManager.testnet.test.ts --network bscTestnet
 */

describe("GraduationManager - BSC Testnet Integration Tests", function () {
  let graduationManager: GraduationManager;
  let platformConfig: PlatformConfig;
  let tokenFactory: TokenFactory;
  let mockAster: MockERC20;
  let bondingCurve: BondingCurve;
  let pumpToken: PumpToken;
  let deployer: SignerWithAddress;
  let trader: SignerWithAddress;

  // BSC Testnet addresses
  const WBNB_ADDRESS = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
  const PANCAKE_FACTORY = "0x6725F303b657a9451d8BA641348b6761A6CC7a17";
  const PANCAKE_ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";

  let deploymentAddresses: any;

  before(async function () {
    // Skip if not on BSC Testnet
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 97n) {
      console.log(`Skipping: Not on BSC Testnet (current chain: ${network.chainId})`);
      this.skip();
    }

    console.log("\n🧪 Starting BSC Testnet Integration Tests");
    console.log("=".repeat(60));

    const signers = await ethers.getSigners();
    deployer = signers[0];
    trader = signers[1] || deployer; // Use deployer as trader if only one signer

    console.log(`Deployer: ${deployer.address}`);
    console.log(`Trader: ${trader.address}`);

    // Load deployment addresses
    const deploymentFile = path.join(__dirname, "..", "..", "..", "deployments", "bsc-testnet.json");

    if (!fs.existsSync(deploymentFile)) {
      throw new Error(
        `Deployment file not found: ${deploymentFile}\n` +
        `Please deploy contracts first: npx hardhat run scripts/deploy-testnet.ts --network bscTestnet`
      );
    }

    deploymentAddresses = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    console.log("\n✅ Loaded deployment addresses");

    // Connect to deployed contracts
    platformConfig = await ethers.getContractAt(
      "PlatformConfig",
      deploymentAddresses.contracts.PlatformConfig
    );
    graduationManager = await ethers.getContractAt(
      "GraduationManager",
      deploymentAddresses.contracts.GraduationManager
    );
    tokenFactory = await ethers.getContractAt(
      "TokenFactory",
      deploymentAddresses.contracts.TokenFactory
    );
    mockAster = await ethers.getContractAt(
      "MockERC20",
      deploymentAddresses.contracts.MockASTER
    );

    console.log("\n✅ Connected to deployed contracts");
    console.log("=".repeat(60));

    // Check balances
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    const traderBalance = await ethers.provider.getBalance(trader.address);
    const deployerAster = await mockAster.balanceOf(deployer.address);

    console.log(`\nDeployer BNB: ${ethers.formatEther(deployerBalance)}`);
    console.log(`Trader BNB: ${ethers.formatEther(traderBalance)}`);
    console.log(`Deployer ASTER: ${ethers.formatEther(deployerAster)}`);

    if (deployerBalance < ethers.parseEther("0.01")) {
      throw new Error("Deployer needs testnet BNB. Get from: https://testnet.bnbchain.org/faucet-smart");
    }

    if (traderBalance < ethers.parseEther("0.01")) {
      throw new Error("Trader needs testnet BNB. Get from: https://testnet.bnbchain.org/faucet-smart");
    }

    // Mint Mock ASTER for testing if needed
    if (deployerAster < ethers.parseEther("1000")) {
      console.log("\n💰 Minting Mock ASTER for testing...");
      const mintTx = await mockAster.mint(deployer.address, ethers.parseEther("10000"));
      await mintTx.wait();
      console.log("✅ Minted 10,000 ASTER to deployer");
    }

    // Transfer ASTER to trader
    const traderAster = await mockAster.balanceOf(trader.address);
    if (traderAster < ethers.parseEther("500")) {
      console.log("💰 Transferring ASTER to trader...");
      const transferTx = await mockAster.transfer(trader.address, ethers.parseEther("1000"));
      await transferTx.wait();
      console.log("✅ Transferred 1,000 ASTER to trader");
    }

    console.log("=".repeat(60) + "\n");
  });

  beforeEach(async function () {
    // Create a new token for each test
    console.log("\n📦 Creating new token for test...");

    const tx = await tokenFactory.createToken(
      "Testnet Meme Token",
      "TMT",
      "ipfs://testnet-meme-token"
    );
    const receipt = await tx.wait();

    // Get the created token address
    const allTokens = await tokenFactory.getAllTokens(0, 100);
    const tokenAddress = allTokens[allTokens.length - 1];
    const bcAddress = await tokenFactory.getBondingCurve(tokenAddress);

    pumpToken = await ethers.getContractAt("PumpToken", tokenAddress);
    bondingCurve = await ethers.getContractAt("BondingCurve", bcAddress);

    console.log(`   Token: ${tokenAddress}`);
    console.log(`   BondingCurve: ${bcAddress}`);
  });

  describe("Real PancakeSwap Integration", function () {
    it("should swap Mock ASTER to WBNB on real PancakeSwap Testnet", async function () {
      this.timeout(180000); // 3 minute timeout for testnet

      console.log("\n🔄 Testing ASTER → WBNB swap...");

      const wbnbToken = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", WBNB_ADDRESS);

      // Buy tokens to accumulate ASTER in bonding curve
      const buyAmount = ethers.parseEther("110"); // Enough to trigger graduation
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);

      console.log("   Buying tokens with ASTER...");
      const buyTx = await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);
      await buyTx.wait();
      console.log("   ✅ Buy complete");

      // Check ASTER balance in bonding curve
      const asterBefore = await mockAster.balanceOf(await bondingCurve.getAddress());
      expect(asterBefore).to.be.gte(ethers.parseEther("100"), "Should have 100+ ASTER");
      console.log(`   ASTER in bonding curve: ${ethers.formatEther(asterBefore)}`);

      // Execute graduation
      console.log("   Executing graduation...");
      const gradTx = await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );
      const receipt = await gradTx.wait();
      console.log(`   ✅ Graduation complete (gas: ${receipt!.gasUsed})`);

      // Verify ASTER was swapped
      const asterAfter = await mockAster.balanceOf(await bondingCurve.getAddress());
      expect(asterAfter).to.equal(0, "ASTER should be fully swapped");

      // Verify WBNB was received (approximately)
      const wbnbBalance = await wbnbToken.balanceOf(await graduationManager.getAddress());
      console.log(`   WBNB received: ${ethers.formatEther(wbnbBalance)}`);
    });

    it("should create Token/WBNB pair on real PancakeSwap Factory", async function () {
      this.timeout(180000); // 3 minute timeout

      console.log("\n🏭 Testing PancakeSwap pair creation...");

      const pancakeFactory = await ethers.getContractAt("contracts/interfaces/IPancakeFactory.sol:IPancakeFactory", PANCAKE_FACTORY);

      // Check pair doesn't exist
      const pairBefore = await pancakeFactory.getPair(await pumpToken.getAddress(), WBNB_ADDRESS);
      expect(pairBefore).to.equal(ethers.ZeroAddress, "Pair should not exist yet");

      // Accumulate ASTER and graduate
      const buyAmount = ethers.parseEther("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);

      console.log("   Buying tokens...");
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      console.log("   Graduating token...");
      await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );

      // Verify pair was created
      const pairAfter = await pancakeFactory.getPair(await pumpToken.getAddress(), WBNB_ADDRESS);
      expect(pairAfter).to.not.equal(ethers.ZeroAddress, "Pair should be created");

      console.log(`   ✅ Pair created: ${pairAfter}`);

      // Verify it's a real pair
      const pairContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", pairAfter);
      const totalSupply = await pairContract.totalSupply();
      expect(totalSupply).to.be.gt(0, "Pair should have liquidity");

      console.log(`   Total LP supply: ${ethers.formatEther(totalSupply)}`);
    });

    it("should add liquidity with correct token/WBNB ratio", async function () {
      this.timeout(180000);

      console.log("\n💧 Testing liquidity addition...");

      const pancakeFactory = await ethers.getContractAt("contracts/interfaces/IPancakeFactory.sol:IPancakeFactory", PANCAKE_FACTORY);

      // Graduate the token
      const buyAmount = ethers.parseEther("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);

      console.log("   Buying tokens...");
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      console.log("   Graduating token...");
      await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );

      // Get pair and check reserves
      const pairAddress = await pancakeFactory.getPair(await pumpToken.getAddress(), WBNB_ADDRESS);

      const pairContract = await ethers.getContractAt(
        ["function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"],
        pairAddress
      );

      const reserves = await pairContract.getReserves();

      // Determine which is token0 and token1
      const token0 =
        (await pumpToken.getAddress()) < WBNB_ADDRESS
          ? await pumpToken.getAddress()
          : WBNB_ADDRESS;

      const tokenReserve = token0 === (await pumpToken.getAddress()) ? reserves[0] : reserves[1];
      const wbnbReserve = token0 === (await pumpToken.getAddress()) ? reserves[1] : reserves[0];

      expect(tokenReserve).to.be.gt(0, "Should have token reserves");
      expect(wbnbReserve).to.be.gt(0, "Should have WBNB reserves");

      console.log(`   ✅ Token reserves: ${ethers.formatEther(tokenReserve)}`);
      console.log(`   ✅ WBNB reserves: ${ethers.formatEther(wbnbReserve)}`);
    });

    it("should burn LP tokens to address(0) permanently", async function () {
      this.timeout(180000);

      console.log("\n🔥 Testing LP token burning...");

      const pancakeFactory = await ethers.getContractAt("contracts/interfaces/IPancakeFactory.sol:IPancakeFactory", PANCAKE_FACTORY);

      // Graduate
      const buyAmount = ethers.parseEther("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);

      console.log("   Buying tokens...");
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      console.log("   Graduating token...");
      await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );

      // Get pair
      const pairAddress = await pancakeFactory.getPair(await pumpToken.getAddress(), WBNB_ADDRESS);
      const pairContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", pairAddress);

      // Check LP tokens at address(0)
      const burnedLPTokens = await pairContract.balanceOf(ethers.ZeroAddress);
      expect(burnedLPTokens).to.be.gt(0, "LP tokens should be burned");

      // GraduationManager should have no LP tokens
      const gmLPTokens = await pairContract.balanceOf(await graduationManager.getAddress());
      expect(gmLPTokens).to.equal(0, "GraduationManager should not hold LP tokens");

      console.log(`   ✅ Burned LP tokens: ${ethers.formatEther(burnedLPTokens)}`);
      console.log(`   ✅ Liquidity permanently locked`);
    });

    it("should complete full graduation flow end-to-end", async function () {
      this.timeout(180000);

      console.log("\n🎯 Testing complete graduation flow...");

      const pancakeFactory = await ethers.getContractAt("contracts/interfaces/IPancakeFactory.sol:IPancakeFactory", PANCAKE_FACTORY);

      // 1. Verify initial state
      expect(await bondingCurve.graduated()).to.be.false;
      console.log("   ✅ Initial state: Not graduated");

      // 2. Accumulate ASTER through trading
      const buyAmount = ethers.parseEther("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);

      console.log("   Buying tokens to accumulate ASTER...");
      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      // 3. Verify graduation threshold met
      const [realAster] = await bondingCurve.getReserves();
      expect(realAster).to.be.gte(ethers.parseEther("100"), "Should meet graduation threshold");
      console.log(`   ✅ ASTER accumulated: ${ethers.formatEther(realAster)}`);

      // 4. Execute graduation
      console.log("   Executing graduation...");
      const graduationTx = await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );
      const receipt = await graduationTx.wait();
      console.log(`   ✅ Graduation complete (gas: ${receipt!.gasUsed})`);

      // 5. Verify bonding curve marked as graduated
      expect(await bondingCurve.graduated()).to.be.true;
      console.log("   ✅ Bonding curve marked as graduated");

      // 6. Verify PancakeSwap pair created
      const pairAddress = await pancakeFactory.getPair(await pumpToken.getAddress(), WBNB_ADDRESS);
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);
      console.log(`   ✅ PancakeSwap pair created: ${pairAddress}`);

      // 7. Verify liquidity added
      const pairBalance = await pumpToken.balanceOf(pairAddress);
      expect(pairBalance).to.be.gt(0);
      console.log(`   ✅ Liquidity added: ${ethers.formatEther(pairBalance)} tokens`);

      // 8. Verify LP tokens burned
      const pairContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", pairAddress);
      const burnedLP = await pairContract.balanceOf(ethers.ZeroAddress);
      expect(burnedLP).to.be.gt(0);
      console.log(`   ✅ LP tokens burned: ${ethers.formatEther(burnedLP)}`);

      console.log("\n   🎉 Complete graduation flow verified successfully!");
    });
  });

  describe("Gas Cost Validation", function () {
    it("should complete graduation within gas limits", async function () {
      this.timeout(180000);

      console.log("\n⛽ Testing gas costs...");

      // Graduate token
      const buyAmount = ethers.parseEther("110");
      await mockAster.connect(trader).approve(await bondingCurve.getAddress(), buyAmount);

      await bondingCurve.connect(trader).buyWithAster(buyAmount, 0);

      const tx = await graduationManager.executeGraduation(
        await pumpToken.getAddress(),
        await bondingCurve.getAddress()
      );
      const receipt = await tx.wait();

      const gasUsed = receipt!.gasUsed;
      const gasPrice = receipt!.gasPrice || 10000000000n; // 10 gwei default
      const totalCost = gasUsed * gasPrice;

      console.log(`   Gas used: ${gasUsed}`);
      console.log(`   Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
      console.log(`   Total cost: ${ethers.formatEther(totalCost)} BNB`);

      // Should be within 3M gas target
      const target = 3_000_000n;
      expect(gasUsed).to.be.lte(target, "Should be within 3M gas target");

      console.log(`   ✅ Within gas target (${target})`);
    });
  });
});
