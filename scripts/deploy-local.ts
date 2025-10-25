import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Local Network Deployment Script (No testnet BNB needed!)
 *
 * This deploys to local Hardhat network for testing while waiting for testnet BNB
 *
 * Run: npx hardhat run scripts/deploy-local.ts --network localhost
 * (Make sure hardhat node is running: npx hardhat node)
 */

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
    SampleToken?: string;
    SampleBondingCurve?: string;
  };
  externalContracts: {
    WBNB?: string;
    PancakeFactory?: string;
    PancakeRouter?: string;
  };
}

async function main() {
  console.log("\n🚀 Starting Local Network Deployment\n");
  console.log("=".repeat(60));
  console.log("\n💡 This deploys to local Hardhat network (no testnet BNB needed!)");
  console.log("   While we wait for testnet BNB, we can test locally\n");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`\n📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  console.log("\n" + "=".repeat(60));

  const deploymentAddresses: DeploymentAddresses = {
    network: "Localhost",
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {} as any,
    externalContracts: {},
  };

  // Step 1: Deploy Mock ASTER
  console.log("\n📦 Step 1: Deploying Mock ASTER Token...");
  console.log("-".repeat(60));

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockAster = await MockERC20.deploy(
    "Mock ASTER",
    "ASTER",
    18,
    ethers.parseEther("1000000000")
  );
  await mockAster.waitForDeployment();
  const mockAsterAddress = await mockAster.getAddress();

  console.log(`✅ Mock ASTER deployed to: ${mockAsterAddress}`);
  deploymentAddresses.contracts.MockASTER = mockAsterAddress;

  // Step 2: Deploy Mock WBNB
  console.log("\n📦 Step 2: Deploying Mock WBNB...");
  console.log("-".repeat(60));

  const mockWBNB = await MockERC20.deploy(
    "Wrapped BNB",
    "WBNB",
    18,
    ethers.parseEther("1000000000")
  );
  await mockWBNB.waitForDeployment();
  const mockWBNBAddress = await mockWBNB.getAddress();

  console.log(`✅ Mock WBNB deployed to: ${mockWBNBAddress}`);
  deploymentAddresses.externalContracts.WBNB = mockWBNBAddress;

  // Step 3: Deploy Mock PancakeSwap contracts
  console.log("\n📦 Step 3: Deploying Mock PancakeSwap...");
  console.log("-".repeat(60));

  const MockPancakeFactory = await ethers.getContractFactory("MockPancakeFactory");
  const mockFactory = await MockPancakeFactory.deploy();
  await mockFactory.waitForDeployment();
  const mockFactoryAddress = await mockFactory.getAddress();

  console.log(`✅ Mock PancakeFactory deployed to: ${mockFactoryAddress}`);
  deploymentAddresses.externalContracts.PancakeFactory = mockFactoryAddress;

  const MockPancakeRouter = await ethers.getContractFactory("MockPancakeRouter");
  const mockRouter = await MockPancakeRouter.deploy(mockFactoryAddress, mockWBNBAddress);
  await mockRouter.waitForDeployment();
  const mockRouterAddress = await mockRouter.getAddress();

  console.log(`✅ Mock PancakeRouter deployed to: ${mockRouterAddress}`);
  deploymentAddresses.externalContracts.PancakeRouter = mockRouterAddress;

  // Step 4: Deploy PlatformConfig
  console.log("\n📦 Step 4: Deploying PlatformConfig...");
  console.log("-".repeat(60));

  const PlatformConfig = await ethers.getContractFactory("PlatformConfig");
  const platformConfig = await PlatformConfig.deploy(
    deployer.address,
    deployer.address,
    deployer.address
  );
  await platformConfig.waitForDeployment();
  const platformConfigAddress = await platformConfig.getAddress();

  console.log(`✅ PlatformConfig deployed to: ${platformConfigAddress}`);
  deploymentAddresses.contracts.PlatformConfig = platformConfigAddress;

  // Step 5: Deploy GraduationManager
  console.log("\n📦 Step 5: Deploying GraduationManager...");
  console.log("-".repeat(60));

  const GraduationManager = await ethers.getContractFactory("GraduationManager");
  const graduationManager = await GraduationManager.deploy(platformConfigAddress);
  await graduationManager.waitForDeployment();
  const graduationManagerAddress = await graduationManager.getAddress();

  console.log(`✅ GraduationManager deployed to: ${graduationManagerAddress}`);
  deploymentAddresses.contracts.GraduationManager = graduationManagerAddress;

  // Step 6: Deploy TokenFactory
  console.log("\n📦 Step 6: Deploying TokenFactory...");
  console.log("-".repeat(60));

  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const virtualAsterReserve = ethers.parseEther("200");
  const tokenFactory = await TokenFactory.deploy(platformConfigAddress, virtualAsterReserve);
  await tokenFactory.waitForDeployment();
  const tokenFactoryAddress = await tokenFactory.getAddress();

  console.log(`✅ TokenFactory deployed to: ${tokenFactoryAddress}`);
  deploymentAddresses.contracts.TokenFactory = tokenFactoryAddress;

  // Save deployment addresses
  console.log("\n💾 Saving Deployment Addresses...");
  console.log("-".repeat(60));

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "localhost.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentAddresses, null, 2));

  console.log(`✅ Deployment addresses saved to: ${deploymentFile}`);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("\n🎉 Local Deployment Complete!\n");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:\n");
  console.log(`   Mock ASTER:         ${deploymentAddresses.contracts.MockASTER}`);
  console.log(`   Mock WBNB:          ${deploymentAddresses.externalContracts.WBNB}`);
  console.log(`   Mock PancakeFactory: ${deploymentAddresses.externalContracts.PancakeFactory}`);
  console.log(`   Mock PancakeRouter:  ${deploymentAddresses.externalContracts.PancakeRouter}`);
  console.log(`   PlatformConfig:     ${deploymentAddresses.contracts.PlatformConfig}`);
  console.log(`   GraduationManager:  ${deploymentAddresses.contracts.GraduationManager}`);
  console.log(`   TokenFactory:       ${deploymentAddresses.contracts.TokenFactory}`);

  console.log("\n" + "=".repeat(60));
  console.log("\n📝 Next Steps:\n");
  console.log("   1. Run tests on local network:");
  console.log("      npx hardhat test --network localhost");
  console.log("\n   2. Create a sample token:");
  console.log("      npx hardhat console --network localhost");
  console.log("      > const factory = await ethers.getContractAt('TokenFactory', '" + tokenFactoryAddress + "')");
  console.log("      > await factory.createToken('Test Token', 'TEST', 'ipfs://test')");
  console.log("\n   3. When testnet BNB arrives:");
  console.log("      npx hardhat run scripts/deploy-testnet.ts --network bscTestnet");
  console.log("\n" + "=".repeat(60) + "\n");

  return deploymentAddresses;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:\n", error);
    process.exit(1);
  });
