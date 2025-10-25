import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * BSC Testnet Deployment Verification Script
 *
 * Verifies all deployed contracts on BSCScan Testnet
 *
 * Prerequisites:
 * 1. Contracts deployed: npx hardhat run scripts/deploy-testnet.ts --network bscTestnet
 * 2. BSCSCAN_API_KEY in .env
 *
 * Run: npx hardhat run scripts/verify-testnet.ts --network bscTestnet
 */

async function main() {
  console.log("\n🔍 Starting BSC Testnet Contract Verification\n");
  console.log("=".repeat(60));

  // Load deployment addresses
  const deploymentFile = path.join(__dirname, "..", "deployments", "bsc-testnet.json");

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(
      `Deployment file not found: ${deploymentFile}\n` +
      `Please deploy contracts first: npx hardhat run scripts/deploy-testnet.ts --network bscTestnet`
    );
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  console.log(`\n✅ Loaded deployment from: ${deploymentFile}`);
  console.log(`   Network: ${deployment.network}`);
  console.log(`   Chain ID: ${deployment.chainId}`);
  console.log(`   Deployed: ${deployment.timestamp}`);

  console.log("\n" + "=".repeat(60));

  const [deployer] = await ethers.getSigners();

  // Verify Mock ASTER
  if (deployment.contracts.MockASTER) {
    console.log("\n📝 Verifying Mock ASTER...");
    console.log("-".repeat(60));

    try {
      await hre.run("verify:verify", {
        address: deployment.contracts.MockASTER,
        constructorArguments: [
          "Mock ASTER",
          "ASTER",
          18,
          ethers.parseEther("1000000000"), // 1 billion tokens
        ],
      });
      console.log(`✅ Mock ASTER verified: ${deployment.contracts.MockASTER}`);
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ Mock ASTER already verified: ${deployment.contracts.MockASTER}`);
      } else {
        console.log(`⚠️  Mock ASTER verification failed: ${error.message}`);
      }
    }
  }

  // Verify PlatformConfig
  console.log("\n📝 Verifying PlatformConfig...");
  console.log("-".repeat(60));

  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.PlatformConfig,
      constructorArguments: [
        deployment.deployer, // protocol fee recipient
        deployment.deployer, // admin
        deployment.deployer, // pauser
      ],
    });
    console.log(`✅ PlatformConfig verified: ${deployment.contracts.PlatformConfig}`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`✅ PlatformConfig already verified: ${deployment.contracts.PlatformConfig}`);
    } else {
      console.log(`⚠️  PlatformConfig verification failed: ${error.message}`);
    }
  }

  // Verify GraduationManager
  console.log("\n📝 Verifying GraduationManager...");
  console.log("-".repeat(60));

  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.GraduationManager,
      constructorArguments: [deployment.contracts.PlatformConfig],
    });
    console.log(`✅ GraduationManager verified: ${deployment.contracts.GraduationManager}`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`✅ GraduationManager already verified: ${deployment.contracts.GraduationManager}`);
    } else {
      console.log(`⚠️  GraduationManager verification failed: ${error.message}`);
    }
  }

  // Verify TokenFactory
  console.log("\n📝 Verifying TokenFactory...");
  console.log("-".repeat(60));

  try {
    const virtualAsterReserve = ethers.parseEther("200"); // 200 ASTER virtual reserve

    await hre.run("verify:verify", {
      address: deployment.contracts.TokenFactory,
      constructorArguments: [deployment.contracts.PlatformConfig, virtualAsterReserve],
    });
    console.log(`✅ TokenFactory verified: ${deployment.contracts.TokenFactory}`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`✅ TokenFactory already verified: ${deployment.contracts.TokenFactory}`);
    } else {
      console.log(`⚠️  TokenFactory verification failed: ${error.message}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Verification Complete!\n");
  console.log("=".repeat(60));

  console.log("\n📋 Verified Contracts:\n");
  if (deployment.contracts.MockASTER) {
    console.log(`   Mock ASTER:`);
    console.log(`   https://testnet.bscscan.com/address/${deployment.contracts.MockASTER}#code\n`);
  }

  console.log(`   PlatformConfig:`);
  console.log(`   https://testnet.bscscan.com/address/${deployment.contracts.PlatformConfig}#code\n`);

  console.log(`   GraduationManager:`);
  console.log(`   https://testnet.bscscan.com/address/${deployment.contracts.GraduationManager}#code\n`);

  console.log(`   TokenFactory:`);
  console.log(`   https://testnet.bscscan.com/address/${deployment.contracts.TokenFactory}#code\n`);

  console.log("=".repeat(60));
  console.log("\n📝 Next Steps:\n");
  console.log("   1. View verified contracts on BSCScan Testnet");
  console.log("   2. Interact with contracts via BSCScan UI");
  console.log("   3. Run testnet integration tests");
  console.log("   4. Share contract addresses with team\n");
  console.log("=".repeat(60) + "\n");
}

// Execute verification
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed:\n", error);
    process.exit(1);
  });
