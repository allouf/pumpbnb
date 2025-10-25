import { ethers } from "hardhat";

/**
 * Check BSC Testnet balance
 */

async function main() {
  console.log("\n💰 Checking BSC Testnet Balance\n");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`\n📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Address: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} BNB`);

  console.log("\n" + "=".repeat(60));

  if (balance === 0n) {
    console.log("\n⚠️  NO BALANCE - Get testnet BNB:\n");
    console.log("1. Go to: https://testnet.bnbchain.org/faucet-smart");
    console.log(`2. Paste address: ${deployer.address}`);
    console.log("3. Click 'Give me BNB'");
    console.log("4. Wait 30-60 seconds");
    console.log("5. Run this script again to verify\n");
  } else if (balance < ethers.parseEther("0.1")) {
    console.log("\n⚠️  LOW BALANCE - Consider getting more BNB");
    console.log("   Recommended: 0.5 BNB for full deployment + testing\n");
  } else {
    console.log("\n✅ SUFFICIENT BALANCE - Ready to deploy!\n");
  }

  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
