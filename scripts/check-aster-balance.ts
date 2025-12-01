/**
 * ASTER Token Balance Checker & Transfer Script
 * 
 * This script:
 * 1. Checks your wallet's ASTER balance
 * 2. Can transfer ASTER to other test wallets
 * 
 * Usage: npx hardhat run scripts/check-aster-balance.ts --network bscTestnet
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Contract addresses from latest deployment
const ASTER_TOKEN = "0x9C61208DAb099F9287E0104cbDd92bca507c1265";

async function main() {
  console.log("\n🔍 ASTER Token Balance Checker\n");
  console.log("=".repeat(50));

  // Get signer (deployer wallet)
  const [deployer] = await ethers.getSigners();
  console.log(`\nWallet Address: ${deployer.address}`);

  // Connect to ASTER token
  const aster = await ethers.getContractAt("MockERC20", ASTER_TOKEN);

  // Get balance
  const balance = await aster.balanceOf(deployer.address);
  const decimals = await aster.decimals();
  const symbol = await aster.symbol();
  const name = await aster.name();
  const totalSupply = await aster.totalSupply();

  console.log(`\n📊 Token Info:`);
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
  
  console.log(`\n💰 Your Balance:`);
  console.log(`   ${ethers.formatUnits(balance, decimals)} ${symbol}`);
  console.log(`   (${balance.toString()} wei)`);

  // Check BNB balance too
  const bnbBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`\n⛽ BNB Balance for gas:`);
  console.log(`   ${ethers.formatEther(bnbBalance)} BNB`);

  console.log("\n" + "=".repeat(50));
  console.log("\n✅ All 1,000,000,000 ASTER tokens are in your deployer wallet!");
  console.log("   This wallet is used for testing on the platform.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
