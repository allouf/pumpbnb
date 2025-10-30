import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Script to mint Mock ASTER tokens on BSC Testnet
 * Usage: npx hardhat run scripts/mint-aster.ts --network bscTestnet
 */

async function main() {
  console.log("\n🪙 Minting Mock ASTER Tokens...\n");

  // Load deployment addresses
  const deploymentPath = path.join(__dirname, "..", "deployments", "bsc-testnet.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Deployment file not found. Please deploy contracts first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  const mockAsterAddress = deployment.contracts.MockASTER;

  if (!mockAsterAddress) {
    throw new Error("MockASTER address not found in deployment file");
  }

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`📍 Your Address: ${signer.address}`);
  console.log(`📍 Mock ASTER: ${mockAsterAddress}`);

  // Connect to Mock ASTER contract
  const mockAster = await ethers.getContractAt("MockERC20", mockAsterAddress);

  // Check current balance
  const balanceBefore = await mockAster.balanceOf(signer.address);
  console.log(`\n💰 Current ASTER Balance: ${ethers.formatEther(balanceBefore)} ASTER`);

  // Amount to mint (default: 10,000 ASTER)
  const amountToMint = ethers.parseEther("10000");
  console.log(`\n🔨 Minting ${ethers.formatEther(amountToMint)} ASTER...`);

  // Mint tokens
  const tx = await mockAster.mint(signer.address, amountToMint);
  console.log(`📤 Transaction sent: ${tx.hash}`);
  console.log(`⏳ Waiting for confirmation...`);

  await tx.wait();
  console.log(`✅ Transaction confirmed!`);

  // Check new balance
  const balanceAfter = await mockAster.balanceOf(signer.address);
  console.log(`\n💰 New ASTER Balance: ${ethers.formatEther(balanceAfter)} ASTER`);
  console.log(`📈 Minted: ${ethers.formatEther(balanceAfter - balanceBefore)} ASTER`);

  console.log("\n✅ SUCCESS! You now have ASTER tokens to test the launchpad.");
  console.log("\n📝 Next steps:");
  console.log("   1. Open your frontend at http://localhost:3000");
  console.log("   2. Connect your wallet (same address as deployer)");
  console.log("   3. Create a new token - it's FREE (only gas costs)!");
  console.log("   4. Use your ASTER tokens to buy tokens on the bonding curve");
  console.log("\n🔗 View on BSCScan:");
  console.log(`   https://testnet.bscscan.com/address/${mockAsterAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
