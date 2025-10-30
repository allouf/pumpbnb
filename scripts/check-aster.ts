import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("\n🔍 Checking ASTER Token Addresses...\n");

  // Expected mainnet ASTER from Constants.sol
  const mainnetAster = "0x000Ae314E2A2172a039B26378814C252734f556A";

  //Load deployment
  const deploymentPath = path.join(__dirname, "..", "deployments", "bsc-testnet.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

  const mockAsterAddress = deployment.contracts.MockASTER;
  const bondingCurveAddress = deployment.contracts.SampleBondingCurve;

  console.log(`📍 Mainnet ASTER (hardcoded in Constants.sol): ${mainnetAster}`);
  console.log(`📍 Mock ASTER (deployed on testnet): ${mockAsterAddress}`);
  console.log(`📍 Sample Bonding Curve: ${bondingCurveAddress}\n`);

  // Check what ASTER address the bonding curve is using
  const bondingCurve = await ethers.getContractAt("BondingCurve", bondingCurveAddress);
  const asterTokenInContract = await bondingCurve.asterToken();

  console.log(`🔗 BondingCurve expects ASTER at: ${asterTokenInContract}`);
  console.log(`Match with mainnet? ${asterTokenInContract.toLowerCase() === mainnetAster.toLowerCase()}`);
  console.log(`Match with Mock ASTER? ${asterTokenInContract.toLowerCase() === mockAsterAddress.toLowerCase()}\n`);

  if (asterTokenInContract.toLowerCase() !== mockAsterAddress.toLowerCase()) {
    console.log("❌ PROBLEM FOUND:");
    console.log("   The BondingCurve contract is configured to use mainnet ASTER");
    console.log("   but you have Mock ASTER deployed at a different address!\n");
    console.log("💡 Solutions:");
    console.log("   1. Deploy Mock ASTER at the exact mainnet address (0x000Ae314...)");
    console.log("   2. Modify Constants.sol to make ASTER address configurable");
    console.log("   3. Redeploy all contracts with correct ASTER address\n");
  } else {
    console.log("✅ ASTER addresses match! Bonding curve is correctly configured.");
  }

  // Check if we can interact with the ASTER token at mainnet address
  const [signer] = await ethers.getSigners();
  try {
    const mainnetAsterContract = await ethers.getContractAt("MockERC20", mainnetAster);
    const balance = await mainnetAsterContract.balanceOf(signer.address);
    console.log(`💰 Your balance at mainnet ASTER address: ${ethers.formatEther(balance)} ASTER`);

    // Try to check if it's actually deployed
    const code = await ethers.provider.getCode(mainnetAster);
    if (code === "0x") {
      console.log(`⚠️  No contract deployed at mainnet ASTER address on testnet!`);
    } else {
      console.log(`✅ Contract exists at mainnet ASTER address`);
    }
  } catch (error: any) {
    console.log(`❌ Cannot interact with mainnet ASTER address: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
