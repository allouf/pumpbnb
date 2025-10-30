import { ethers } from "hardhat";

/**
 * Script to buy tokens on the bonding curve
 * Usage: npx hardhat run scripts/buy-tokens.ts --network bscTestnet
 */

async function main() {
  console.log("\n💰 Buying Tokens on Bonding Curve...\n");

  // Contract addresses from your token creation
  const mockAsterAddress = "0x2e5bEffE46eAADAb062ED2b520a0d95654CEdF5A";
  const bondingCurveAddress = "0xFd1472827D78fD7d22ADC447F7838cf8572bcadd";
  const tokenAddress = "0x923CeD1C6196Dcb6C87B77C393eCe4D6f397b559";

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`👤 Buyer Address: ${signer.address}`);

  // Connect to contracts
  const mockAster = await ethers.getContractAt("MockERC20", mockAsterAddress);
  const bondingCurve = await ethers.getContractAt("BondingCurve", bondingCurveAddress);
  const token = await ethers.getContractAt("PumpToken", tokenAddress);

  // Check balances before
  const asterBalanceBefore = await mockAster.balanceOf(signer.address);
  const tokenBalanceBefore = await token.balanceOf(signer.address);
  console.log(`\n📊 Balances Before:`);
  console.log(`   ASTER: ${ethers.formatEther(asterBalanceBefore)} ASTER`);
  console.log(`   PTEST: ${ethers.formatEther(tokenBalanceBefore)} PTEST`);

  // Check bonding curve reserves
  const reserves = await bondingCurve.getReserves();
  console.log(`\n📈 Bonding Curve Reserves:`);
  console.log(`   Real ASTER: ${ethers.formatEther(reserves[0])} ASTER`);
  console.log(`   Real Tokens: ${ethers.formatEther(reserves[1])} PTEST`);
  console.log(`   Virtual ASTER: ${ethers.formatEther(reserves[2])} ASTER`);
  console.log(`   Virtual Tokens: ${ethers.formatEther(reserves[3])} PTEST`);

  // Amount to spend (100 ASTER)
  const amountToSpend = ethers.parseEther("100");
  console.log(`\n💵 Spending: ${ethers.formatEther(amountToSpend)} ASTER`);

  // Step 1: Approve ASTER spending
  console.log("\n1️⃣ Approving ASTER spending...");
  const approveTx = await mockAster.approve(bondingCurveAddress, amountToSpend);
  console.log(`   📤 Transaction: ${approveTx.hash}`);
  await approveTx.wait();
  console.log(`   ✅ Approved!`);

  // Step 2: Calculate expected output
  const buyAmountResult = await bondingCurve.getBuyAmount(amountToSpend);
  const expectedOutput = buyAmountResult[0]; // First element is the token amount
  const creatorFee = buyAmountResult[1];
  const protocolFee = buyAmountResult[2];
  console.log(`\n2️⃣ Expected Output: ${ethers.formatEther(expectedOutput)} PTEST`);
  console.log(`   Creator Fee: ${ethers.formatEther(creatorFee)} ASTER (0.3%)`);
  console.log(`   Protocol Fee: ${ethers.formatEther(protocolFee)} ASTER (0.7%)`);

  // Step 3: Buy tokens with 1% slippage tolerance
  const minOutput = expectedOutput * BigInt(99) / BigInt(100);
  console.log(`   Min Output (1% slippage): ${ethers.formatEther(minOutput)} PTEST`);

  console.log("\n3️⃣ Buying tokens...");
  const buyTx = await bondingCurve.buyWithAster(amountToSpend, minOutput);
  console.log(`   📤 Transaction: ${buyTx.hash}`);
  const receipt = await buyTx.wait();
  console.log(`   ✅ Purchase confirmed in block ${receipt?.blockNumber}!`);

  // Check balances after
  const asterBalanceAfter = await mockAster.balanceOf(signer.address);
  const tokenBalanceAfter = await token.balanceOf(signer.address);
  console.log(`\n📊 Balances After:`);
  console.log(`   ASTER: ${ethers.formatEther(asterBalanceAfter)} ASTER`);
  console.log(`   PTEST: ${ethers.formatEther(tokenBalanceAfter)} PTEST`);

  // Calculate changes
  const asterSpent = asterBalanceBefore - asterBalanceAfter;
  const tokensReceived = tokenBalanceAfter - tokenBalanceBefore;
  console.log(`\n💸 Transaction Summary:`);
  console.log(`   ASTER Spent: ${ethers.formatEther(asterSpent)} ASTER`);
  console.log(`   PTEST Received: ${ethers.formatEther(tokensReceived)} PTEST`);
  console.log(`   Price per Token: ${ethers.formatEther(asterSpent * BigInt(1e18) / tokensReceived)} ASTER`);

  // Check updated reserves
  const reservesAfter = await bondingCurve.getReserves();
  console.log(`\n📈 Updated Bonding Curve Reserves:`);
  console.log(`   Real ASTER: ${ethers.formatEther(reservesAfter[0])} ASTER`);
  console.log(`   Real Tokens: ${ethers.formatEther(reservesAfter[1])} PTEST`);

  // Check fee distribution
  const protocolFees = await bondingCurve.protocolFees();
  const creatorFees = await bondingCurve.creatorFees();
  console.log(`\n💰 Fees Collected (1% of trade):`);
  console.log(`   Protocol Fees (0.7%): ${ethers.formatEther(protocolFees)} ASTER`);
  console.log(`   Creator Fees (0.3%): ${ethers.formatEther(creatorFees)} ASTER`);

  console.log("\n✅ SUCCESS! You've successfully bought tokens on the bonding curve!");
  console.log("\n🔗 View transaction on BSCScan:");
  console.log(`   https://testnet.bscscan.com/tx/${buyTx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
