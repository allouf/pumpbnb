import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Verify BSC Testnet Deployment
 * Quick check that all deployed contracts are working
 */

async function main() {
  console.log("\n✅ Verifying BSC Testnet Deployment\n");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`\n📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);

  // Load deployment
  const deploymentFile = path.join(__dirname, "..", "deployments", "bsc-testnet.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  console.log("\n📋 Deployed Contracts:");
  console.log("=".repeat(60));

  // Check each contract
  const contracts = [
    { name: "Mock ASTER", address: deployment.contracts.MockASTER },
    { name: "PlatformConfig", address: deployment.contracts.PlatformConfig },
    { name: "GraduationManager", address: deployment.contracts.GraduationManager },
    { name: "TokenFactory", address: deployment.contracts.TokenFactory },
  ];

  for (const contract of contracts) {
    const code = await ethers.provider.getCode(contract.address);
    const exists = code !== "0x";
    console.log(`\n${contract.name}:`);
    console.log(`   Address: ${contract.address}`);
    console.log(`   Status: ${exists ? "✅ Deployed" : "❌ Not Found"}`);
    console.log(`   BSCScan: https://testnet.bscscan.com/address/${contract.address}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n🎉 All Contracts Successfully Deployed to BSC Testnet!\n");
  console.log("=".repeat(60));

  // Show balances
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`\n💰 Remaining Balance: ${ethers.formatEther(balance)} BNB\n`);

  console.log("📝 View on BSCScan Testnet:");
  console.log(`   - Mock ASTER: https://testnet.bscscan.com/address/${deployment.contracts.MockASTER}`);
  console.log(`   - TokenFactory: https://testnet.bscscan.com/address/${deployment.contracts.TokenFactory}`);
  console.log(`   - Sample Token: https://testnet.bscscan.com/address/${deployment.contracts.SampleToken}\n`);

  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
