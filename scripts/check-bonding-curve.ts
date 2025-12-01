import { ethers } from "hardhat";

// Token and bonding curve addresses from the user's NEW token
const BONDING_CURVE_ADDRESS = "0x9aadf72c679240b4f575fa37f7732bf54a0761f9";

// New TokenFactory address
const NEW_TOKEN_FACTORY = "0x535dD472F8A7B20B8c852A9fa7AFc1028D22E52D";

async function main() {
  console.log("\n🔍 Checking Bonding Curve Configuration\n");
  console.log("=".repeat(60));

  // Connect to bonding curve
  const bondingCurve = await ethers.getContractAt("BondingCurve", BONDING_CURVE_ADDRESS);
  
  // Get reserves
  const reserves = await bondingCurve.getReserves();
  const price = await bondingCurve.getPrice();
  const virtualAsterReserve = await bondingCurve.virtualAsterReserve();
  const graduated = await bondingCurve.graduated();

  console.log("\n📊 Bonding Curve State:");
  console.log(`   Address: ${BONDING_CURVE_ADDRESS}`);
  console.log(`   Virtual ASTER Reserve: ${ethers.formatEther(virtualAsterReserve)} ASTER`);
  console.log(`   Real ASTER Reserve: ${ethers.formatEther(reserves[0])} ASTER`);
  console.log(`   Real Token Reserve: ${ethers.formatEther(reserves[1])} tokens`);
  console.log(`   Total ASTER Reserve: ${ethers.formatEther(reserves[2])} ASTER`);
  console.log(`   Total Token Reserve: ${ethers.formatEther(reserves[3])} tokens`);
  console.log(`   Current Price: ${ethers.formatEther(price)} ASTER/token`);
  console.log(`   Graduated: ${graduated}`);

  // Check TokenFactory
  console.log("\n📦 TokenFactory Check:");
  const tokenFactory = await ethers.getContractAt("TokenFactory", NEW_TOKEN_FACTORY);
  const factoryVirtualReserve = await tokenFactory.virtualAsterReserve();
  console.log(`   Factory Virtual Reserve: ${ethers.formatEther(factoryVirtualReserve)} ASTER`);

  // Calculate expected initial price
  console.log("\n📐 Price Analysis:");
  const expectedInitialPrice = Number(ethers.formatEther(virtualAsterReserve)) / 1_000_000_000;
  console.log(`   Expected Initial Price: ${expectedInitialPrice} ASTER/token`);
  console.log(`   Current Price: ${Number(ethers.formatEther(price)).toFixed(12)} ASTER/token`);
  
  console.log("\n" + "=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
