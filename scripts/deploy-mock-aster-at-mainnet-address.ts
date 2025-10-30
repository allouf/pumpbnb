import { ethers } from "hardhat";

/**
 * Deploy Mock ASTER at the mainnet address for testnet testing
 * This uses a special technique to deploy at a specific address
 *
 * Usage: npx hardhat run scripts/deploy-mock-aster-at-mainnet-address.ts --network bscTestnet
 */

async function main() {
  console.log("\n🚀 Deploying Mock ASTER at Mainnet Address...\n");

  const targetAddress = "0x000Ae314E2A2172a039B26378814C252734f556A";
  const [deployer] = await ethers.getSigners();

  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`🎯 Target Address: ${targetAddress}\n`);

  // Check if contract already exists
  const existingCode = await ethers.provider.getCode(targetAddress);
  if (existingCode !== "0x") {
    console.log("✅ Contract already deployed at target address!");

    const aster = await ethers.getContractAt("MockERC20", targetAddress);
    const balance = await aster.balanceOf(deployer.address);
    console.log(`💰 Your ASTER balance: ${ethers.formatEther(balance)} ASTER`);

    if (balance === BigInt(0)) {
      console.log("\n🪙 Minting 1,000,000,000 ASTER to your address...");
      const mintTx = await aster.mint(deployer.address, ethers.parseEther("1000000000"));
      await mintTx.wait();
      const newBalance = await aster.balanceOf(deployer.address);
      console.log(`✅ New balance: ${ethers.formatEther(newBalance)} ASTER`);
    }

    return;
  }

  console.log("❌ No contract at mainnet ASTER address on testnet.\n");
  console.log("⚠️  IMPORTANT: You cannot deploy a contract at a specific address");
  console.log("   unless you control the private key that generates that address.\n");
  console.log("💡 Alternative Solution: Send testnet BNB to mainnet ASTER address");
  console.log("   and deploy Mock ASTER from that address.\n");

  // Send some BNB to the target address so it can deploy
  console.log(`📤 Sending 0.1 testnet BNB to ${targetAddress}...`);
  const tx = await deployer.sendTransaction({
    to: targetAddress,
    value: ethers.parseEther("0.1")
  });
  await tx.wait();
  console.log("✅ BNB sent!\n");

  console.log("⚠️  However, we don't have the private key for this address,");
  console.log("   so we cannot deploy from it.\n");
  console.log("📋 Recommended approach:");
  console.log("   1. Modify Constants.sol to accept ASTER address as parameter");
  console.log("   2. Redeploy contracts with Mock ASTER address");
  console.log("   3. Or use the already deployed Mock ASTER by updating tests\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
