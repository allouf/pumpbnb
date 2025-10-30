import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * BSC Testnet Deployment Script
 *
 * Deploys all PumpBNB contracts to BSC Testnet for integration testing
 *
 * Prerequisites:
 * 1. Set PRIVATE_KEY in .env (account with testnet BNB)
 * 2. Get testnet BNB from faucet: https://testnet.bnbchain.org/faucet-smart
 *
 * Run: npx hardhat run scripts/deploy-testnet.ts --network bscTestnet
 */

// BSC Testnet Contract Addresses
const BSC_TESTNET_ADDRESSES = {
  ASTER: "0x0000000000000000000000000000000000000000", // ASTER not on testnet - will need to deploy mock
  WBNB: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
  PANCAKE_FACTORY: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
  PANCAKE_ROUTER: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
};

interface DeploymentAddresses {
  network: string;
  chainId: number;
  deployer: string;
  timestamp: string;
  contracts: {
    MockASTER?: string;
    PlatformConfig: string;
    GraduationManager: string;
    TokenFactory: string;
    // Sample token for testing
    SampleToken?: string;
    SampleBondingCurve?: string;
  };
  externalContracts: {
    WBNB: string;
    PancakeFactory: string;
    PancakeRouter: string;
  };
}

async function main() {
  console.log("\n🚀 Starting BSC Testnet Deployment\n");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`\n📍 Network: BSC Testnet (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} BNB`);

  if (balance < ethers.parseEther("0.1")) {
    console.log("\n⚠️  WARNING: Low balance! Get testnet BNB from faucet:");
    console.log("   https://testnet.bnbchain.org/faucet-smart\n");
  }

  console.log("\n" + "=".repeat(60));

  const deploymentAddresses: DeploymentAddresses = {
    network: "BSC Testnet",
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {} as any,
    externalContracts: {
      WBNB: BSC_TESTNET_ADDRESSES.WBNB,
      PancakeFactory: BSC_TESTNET_ADDRESSES.PANCAKE_FACTORY,
      PancakeRouter: BSC_TESTNET_ADDRESSES.PANCAKE_ROUTER,
    },
  };

  // Step 1: Deploy Mock ASTER token (since ASTER is not on testnet)
  console.log("\n📦 Step 1: Deploying Mock ASTER Token...");
  console.log("-".repeat(60));

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockAster = await MockERC20.deploy(
    "Mock ASTER",
    "ASTER",
    18,
    ethers.parseEther("1000000000") // 1 billion tokens
  );
  await mockAster.waitForDeployment();
  const mockAsterAddress = await mockAster.getAddress();

  console.log(`✅ Mock ASTER deployed to: ${mockAsterAddress}`);
  deploymentAddresses.contracts.MockASTER = mockAsterAddress;

  // Step 2: Deploy PlatformConfig
  console.log("\n📦 Step 2: Deploying PlatformConfig...");
  console.log("-".repeat(60));

  const PlatformConfig = await ethers.getContractFactory("PlatformConfig");
  const platformConfig = await PlatformConfig.deploy(
    deployer.address, // protocol fee recipient
    deployer.address, // admin
    deployer.address, // pauser
    mockAsterAddress  // ASTER token (Mock ASTER on testnet)
  );
  await platformConfig.waitForDeployment();
  const platformConfigAddress = await platformConfig.getAddress();

  console.log(`✅ PlatformConfig deployed to: ${platformConfigAddress}`);
  console.log(`   Using ASTER token: ${mockAsterAddress}`);
  deploymentAddresses.contracts.PlatformConfig = platformConfigAddress;

  // Step 3: Deploy GraduationManager
  console.log("\n📦 Step 3: Deploying GraduationManager...");
  console.log("-".repeat(60));

  const GraduationManager = await ethers.getContractFactory("GraduationManager");
  const graduationManager = await GraduationManager.deploy(platformConfigAddress);
  await graduationManager.waitForDeployment();
  const graduationManagerAddress = await graduationManager.getAddress();

  console.log(`✅ GraduationManager deployed to: ${graduationManagerAddress}`);
  deploymentAddresses.contracts.GraduationManager = graduationManagerAddress;

  // Step 4: Deploy TokenFactory
  console.log("\n📦 Step 4: Deploying TokenFactory...");
  console.log("-".repeat(60));

  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const virtualAsterReserve = ethers.parseEther("200"); // 200 ASTER virtual reserve
  const tokenFactory = await TokenFactory.deploy(
    platformConfigAddress,
    virtualAsterReserve
  );
  await tokenFactory.waitForDeployment();
  const tokenFactoryAddress = await tokenFactory.getAddress();

  console.log(`✅ TokenFactory deployed to: ${tokenFactoryAddress}`);
  deploymentAddresses.contracts.TokenFactory = tokenFactoryAddress;

  // Step 5: Create a sample token for testing
  console.log("\n📦 Step 5: Creating Sample Token for Testing...");
  console.log("-".repeat(60));

  try {
    const createTx = await tokenFactory.createToken(
      "Test Meme Token",
      "TEST",
      "ipfs://test-token-metadata"
    );
    const receipt = await createTx.wait();

    // Get the created token address
    const allTokens = await tokenFactory.getAllTokens(0, 100);
    const sampleTokenAddress = allTokens[allTokens.length - 1];
    const sampleBondingCurveAddress = await tokenFactory.getBondingCurve(sampleTokenAddress);

    console.log(`✅ Sample Token created: ${sampleTokenAddress}`);
    console.log(`✅ Sample BondingCurve: ${sampleBondingCurveAddress}`);

    deploymentAddresses.contracts.SampleToken = sampleTokenAddress;
    deploymentAddresses.contracts.SampleBondingCurve = sampleBondingCurveAddress;
  } catch (error) {
    console.log(`⚠️  Failed to create sample token: ${error}`);
    console.log(`   You may need to update Constants.sol and redeploy`);
  }

  // Save deployment addresses
  console.log("\n💾 Saving Deployment Addresses...");
  console.log("-".repeat(60));

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "bsc-testnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentAddresses, null, 2));

  console.log(`✅ Deployment addresses saved to: ${deploymentFile}`);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("\n🎉 Deployment Complete!\n");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:\n");
  console.log(`   Mock ASTER:         ${deploymentAddresses.contracts.MockASTER}`);
  console.log(`   PlatformConfig:     ${deploymentAddresses.contracts.PlatformConfig}`);
  console.log(`   GraduationManager:  ${deploymentAddresses.contracts.GraduationManager}`);
  console.log(`   TokenFactory:       ${deploymentAddresses.contracts.TokenFactory}`);

  if (deploymentAddresses.contracts.SampleToken) {
    console.log(`\n   Sample Token:       ${deploymentAddresses.contracts.SampleToken}`);
    console.log(`   Sample BondingCurve: ${deploymentAddresses.contracts.SampleBondingCurve}`);
  }

  console.log("\n🔗 External Contracts:\n");
  console.log(`   WBNB:               ${BSC_TESTNET_ADDRESSES.WBNB}`);
  console.log(`   PancakeFactory:     ${BSC_TESTNET_ADDRESSES.PANCAKE_FACTORY}`);
  console.log(`   PancakeRouter:      ${BSC_TESTNET_ADDRESSES.PANCAKE_ROUTER}`);

  console.log("\n" + "=".repeat(60));
  console.log("\n📝 Next Steps:\n");
  console.log("   1. Verify contracts on BSCScan Testnet:");
  console.log("      npx hardhat verify --network bscTestnet <address>");
  console.log("\n   2. Fund test accounts with Mock ASTER:");
  console.log(`      Contract: ${deploymentAddresses.contracts.MockASTER}`);
  console.log("\n   3. Run testnet integration tests:");
  console.log("      npx hardhat test test/integration/testnet/*.test.ts --network bscTestnet");
  console.log("\n   4. Interact via BSCScan Testnet:");
  console.log(`      https://testnet.bscscan.com/address/${platformConfigAddress}`);
  console.log("\n" + "=".repeat(60) + "\n");

  // Return addresses for programmatic use
  return deploymentAddresses;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:\n", error);
    process.exit(1);
  });
