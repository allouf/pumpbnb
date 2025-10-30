import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Script to create a test token on BSC Testnet via TokenFactory
 * Usage: npx hardhat run scripts/create-test-token.ts --network bscTestnet
 */

async function main() {
  console.log("\n🚀 Creating Test Token on PumpBNB...\n");

  // Load deployment addresses
  const deploymentPath = path.join(__dirname, "..", "deployments", "bsc-testnet.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Deployment file not found. Please deploy contracts first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  const tokenFactoryAddress = deployment.contracts.TokenFactory;
  const mockAsterAddress = deployment.contracts.MockASTER;

  if (!tokenFactoryAddress || !mockAsterAddress) {
    throw new Error("Required contract addresses not found in deployment file");
  }

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`👤 Creator Address: ${signer.address}`);
  console.log(`🏭 TokenFactory: ${tokenFactoryAddress}`);
  console.log(`🪙 Mock ASTER: ${mockAsterAddress}`);

  // Check ASTER balance
  const mockAster = await ethers.getContractAt("MockERC20", mockAsterAddress);
  const asterBalance = await mockAster.balanceOf(signer.address);
  console.log(`💰 Your ASTER Balance: ${ethers.formatEther(asterBalance)} ASTER\n`);

  // Token details
  const tokenName = "PumpTest Token";
  const tokenSymbol = "PTEST";
  const metadataURI = "ipfs://QmTest123456789"; // Mock IPFS URI for testing

  console.log("📝 Token Details:");
  console.log(`   Name: ${tokenName}`);
  console.log(`   Symbol: ${tokenSymbol}`);
  console.log(`   Total Supply: 1,000,000,000 tokens`);
  console.log(`   Bonding Curve: 800,000,000 tokens (80%)`);
  console.log(`   Creator (locked): 200,000,000 tokens (20%)`);
  console.log(`   Metadata: ${metadataURI}\n`);

  // Connect to TokenFactory
  const tokenFactory = await ethers.getContractAt("TokenFactory", tokenFactoryAddress);

  // Token creation is FREE (no platform fee)
  console.log(`💵 Creation Fee: 0 BNB (FREE!) ✅\n`);

  // Create token
  console.log("🔨 Creating token...");
  const tx = await tokenFactory.createToken(tokenName, tokenSymbol, metadataURI);
  console.log(`📤 Transaction sent: ${tx.hash}`);
  console.log(`⏳ Waiting for confirmation...`);

  const receipt = await tx.wait();
  console.log(`✅ Transaction confirmed in block ${receipt?.blockNumber}!\n`);

  // Parse events to get token and bonding curve addresses
  const createEvent = receipt?.logs
    .map((log: any) => {
      try {
        return tokenFactory.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event: any) => event?.name === "TokenCreated");

  if (createEvent) {
    const { token, bondingCurve, creator } = createEvent.args;
    console.log("🎉 SUCCESS! Token created:\n");
    console.log(`   🪙 Token Address: ${token}`);
    console.log(`   📈 Bonding Curve: ${bondingCurve}`);
    console.log(`   👤 Creator: ${creator}\n`);

    console.log("🔗 View on BSCScan:");
    console.log(`   Token: https://testnet.bscscan.com/address/${token}`);
    console.log(`   Bonding Curve: https://testnet.bscscan.com/address/${bondingCurve}\n`);

    // Check token details
    const pumpToken = await ethers.getContractAt("PumpToken", token);
    const name = await pumpToken.name();
    const symbol = await pumpToken.symbol();
    const totalSupply = await pumpToken.totalSupply();
    const creatorBalance = await pumpToken.balanceOf(creator);
    const bondingCurveBalance = await pumpToken.balanceOf(bondingCurve);

    console.log("📊 Token Info:");
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} tokens`);
    console.log(`   Creator Balance (locked): ${ethers.formatEther(creatorBalance)} tokens`);
    console.log(`   Bonding Curve Balance: ${ethers.formatEther(bondingCurveBalance)} tokens\n`);

    console.log("🎯 Next Steps:");
    console.log("   1. Approve ASTER spending for the bonding curve");
    console.log("   2. Buy tokens using buyTokens() function");
    console.log("   3. Test trading and graduation mechanics\n");

    console.log("💡 Quick Test Commands:");
    console.log(`   # Approve 1000 ASTER for trading`);
    console.log(`   npx hardhat console --network bscTestnet`);
    console.log(`   > const aster = await ethers.getContractAt("MockERC20", "${mockAsterAddress}")`);
    console.log(`   > await aster.approve("${bondingCurve}", ethers.parseEther("1000"))`);
    console.log(`   `);
    console.log(`   # Buy tokens (spend 100 ASTER)`);
    console.log(`   > const bc = await ethers.getContractAt("BondingCurve", "${bondingCurve}")`);
    console.log(`   > await bc.buyTokens(ethers.parseEther("100"), 0)`);

  } else {
    console.log("⚠️  Could not parse TokenCreated event from transaction receipt");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
