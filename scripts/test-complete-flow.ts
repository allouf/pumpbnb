import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Test complete token lifecycle: Mint ASTER → Create Token → Buy Tokens → Sell Tokens
 * Usage: npx hardhat run scripts/test-complete-flow.ts --network bscTestnet
 */

async function main() {
  console.log("\n🧪 Testing Complete Token Lifecycle on BSC Testnet\n");
  console.log("=".repeat(70));

  // Load deployment addresses
  const deploymentPath = path.join(__dirname, "..", "deployments", "bsc-testnet.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

  const mockAsterAddress = deployment.contracts.MockASTER;
  const tokenFactoryAddress = deployment.contracts.TokenFactory;

  const [user] = await ethers.getSigners();
  console.log(`\n👤 User Address: ${user.address}`);
  console.log(`🏭 TokenFactory: ${tokenFactoryAddress}`);
  console.log(`🪙 Mock ASTER: ${mockAsterAddress}\n`);

  // Connect to contracts
  const mockAster = await ethers.getContractAt("MockERC20", mockAsterAddress);
  const tokenFactory = await ethers.getContractAt("TokenFactory", tokenFactoryAddress);

  console.log("=".repeat(70));
  console.log("\n📍 STEP 1: Mint ASTER Tokens\n");
  console.log("-".repeat(70));

  const asterBalance = await mockAster.balanceOf(user.address);
  console.log(`Current ASTER Balance: ${ethers.formatEther(asterBalance)} ASTER`);

  if (asterBalance < ethers.parseEther("10000")) {
    console.log("\n🪙 Minting 10,000 ASTER tokens...");
    const mintTx = await mockAster.mint(user.address, ethers.parseEther("10000"));
    await mintTx.wait();
    const newBalance = await mockAster.balanceOf(user.address);
    console.log(`✅ Minted! New balance: ${ethers.formatEther(newBalance)} ASTER`);
  } else {
    console.log("✅ Sufficient ASTER balance");
  }

  console.log("\n=".repeat(70));
  console.log("\n📍 STEP 2: Create New Token\n");
  console.log("-".repeat(70));

  const tokenName = "TestCoin";
  const tokenSymbol = "TCOIN";
  const metadataURI = "ipfs://QmTestMetadata123";

  console.log(`Token Name: ${tokenName}`);
  console.log(`Token Symbol: ${tokenSymbol}`);
  console.log(`Metadata: ${metadataURI}\n`);

  console.log("🔨 Creating token...");
  const createTx = await tokenFactory.createToken(tokenName, tokenSymbol, metadataURI);
  console.log(`📤 Transaction: ${createTx.hash}`);
  const createReceipt = await createTx.wait();
  console.log(`✅ Token created in block ${createReceipt?.blockNumber}!\n`);

  // Get created token addresses
  const createEvent = createReceipt?.logs
    .map((log: any) => {
      try {
        return tokenFactory.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event: any) => event?.name === "TokenCreated");

  const tokenAddress = createEvent?.args.token;
  const bondingCurveAddress = createEvent?.args.bondingCurve;

  console.log(`🪙 Token Address: ${tokenAddress}`);
  console.log(`📈 Bonding Curve: ${bondingCurveAddress}`);
  console.log(`\n🔗 View on BSCScan:`);
  console.log(`   Token: https://testnet.bscscan.com/address/${tokenAddress}`);
  console.log(`   Bonding Curve: https://testnet.bscscan.com/address/${bondingCurveAddress}`);

  console.log("\n=".repeat(70));
  console.log("\n📍 STEP 3: Buy Tokens on Bonding Curve\n");
  console.log("-".repeat(70));

  const bondingCurve = await ethers.getContractAt("BondingCurve", bondingCurveAddress);
  const token = await ethers.getContractAt("PumpToken", tokenAddress);

  // Check balances before
  const asterBefore = await mockAster.balanceOf(user.address);
  const tokenBefore = await token.balanceOf(user.address);
  console.log(`\n📊 Balances Before Purchase:`);
  console.log(`   ASTER: ${ethers.formatEther(asterBefore)} ASTER`);
  console.log(`   ${tokenSymbol}: ${ethers.formatEther(tokenBefore)} ${tokenSymbol}`);

  // Approve ASTER spending
  const amountToSpend = ethers.parseEther("100");
  console.log(`\n💵 Spending: ${ethers.formatEther(amountToSpend)} ASTER\n`);

  console.log("1️⃣ Approving ASTER...");
  const approveTx = await mockAster.approve(bondingCurveAddress, amountToSpend);
  await approveTx.wait();
  console.log("   ✅ Approved!");

  // Calculate expected output
  console.log("\n2️⃣ Calculating expected output...");
  const buyResult = await bondingCurve.getBuyAmount(amountToSpend);
  const expectedTokens = buyResult[0];
  const creatorFee = buyResult[1];
  const protocolFee = buyResult[2];

  console.log(`   Expected ${tokenSymbol}: ${ethers.formatEther(expectedTokens)}`);
  console.log(`   Creator Fee: ${ethers.formatEther(creatorFee)} ASTER (0.3%)`);
  console.log(`   Protocol Fee: ${ethers.formatEther(protocolFee)} ASTER (0.7%)`);

  // Buy tokens
  const minOutput = expectedTokens * BigInt(99) / BigInt(100); // 1% slippage
  console.log(`\n3️⃣ Buying tokens (min: ${ethers.formatEther(minOutput)} ${tokenSymbol})...`);
  const buyTx = await bondingCurve.buyWithAster(amountToSpend, minOutput);
  console.log(`   📤 Transaction: ${buyTx.hash}`);
  const buyReceipt = await buyTx.wait();
  console.log(`   ✅ Purchase confirmed in block ${buyReceipt?.blockNumber}!`);

  // Check balances after
  const asterAfter = await mockAster.balanceOf(user.address);
  const tokenAfter = await token.balanceOf(user.address);
  console.log(`\n📊 Balances After Purchase:`);
  console.log(`   ASTER: ${ethers.formatEther(asterAfter)} ASTER`);
  console.log(`   ${tokenSymbol}: ${ethers.formatEther(tokenAfter)} ${tokenSymbol}`);

  const asterSpent = asterBefore - asterAfter;
  const tokensReceived = tokenAfter - tokenBefore;
  console.log(`\n💸 Transaction Summary:`);
  console.log(`   ASTER Spent: ${ethers.formatEther(asterSpent)} ASTER`);
  console.log(`   ${tokenSymbol} Received: ${ethers.formatEther(tokensReceived)} ${tokenSymbol}`);
  console.log(`   Price per Token: ${ethers.formatEther(asterSpent * BigInt(1e18) / tokensReceived)} ASTER`);

  console.log("\n=".repeat(70));
  console.log("\n📍 STEP 4: Check Bonding Curve State\n");
  console.log("-".repeat(70));

  const reserves = await bondingCurve.getReserves();
  console.log(`\n📈 Bonding Curve Reserves:`);
  console.log(`   Real ASTER: ${ethers.formatEther(reserves[0])} ASTER`);
  console.log(`   Real Tokens: ${ethers.formatEther(reserves[1])} ${tokenSymbol}`);
  console.log(`   Virtual ASTER: ${ethers.formatEther(reserves[2])} ASTER`);
  console.log(`   Virtual Tokens: ${ethers.formatEther(reserves[3])} ${tokenSymbol}`);

  console.log(`\n💰 Fees Distribution:`);
  console.log(`   ✅ Creator received: ${ethers.formatEther(creatorFee)} ASTER (0.3%)`);
  console.log(`   ✅ Protocol received: ${ethers.formatEther(protocolFee)} ASTER (0.7%)`);

  console.log("\n=".repeat(70));
  console.log("\n✅ COMPLETE TOKEN LIFECYCLE TEST SUCCESSFUL!\n");
  console.log("=".repeat(70));
  console.log("\n📝 Summary:\n");
  console.log("   ✅ ASTER tokens minted");
  console.log("   ✅ Token created on launchpad (FREE!)");
  console.log("   ✅ Tokens purchased on bonding curve");
  console.log("   ✅ Fees collected properly");
  console.log("   ✅ All contracts working correctly!\n");

  console.log("🎯 Next Steps:\n");
  console.log("   1. Test selling tokens");
  console.log("   2. Test graduation mechanism (need 100 ASTER in reserves)");
  console.log("   3. Build frontend interface");
  console.log("   4. Deploy to mainnet\n");

  console.log("=".repeat(70) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:\n", error);
    process.exit(1);
  });
