import { ethers } from "ethers";

/**
 * Generate a new testnet wallet
 * ONLY USE FOR TESTNET - NEVER FOR MAINNET
 */

async function main() {
  console.log("\n🔑 Generating NEW BSC Testnet Wallet\n");
  console.log("=".repeat(60));
  console.log("\n⚠️  WARNING: USE ONLY FOR TESTNET - NEVER MAINNET!\n");
  console.log("=".repeat(60));

  // Generate new random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("\n✅ Wallet Generated:\n");
  console.log(`Address:      ${wallet.address}`);
  console.log(`Private Key:  ${wallet.privateKey}`);
  console.log(`\nMnemonic (12 words):`);
  console.log(`${wallet.mnemonic?.phrase}\n`);

  console.log("=".repeat(60));
  console.log("\n📝 Next Steps:\n");
  console.log("1. SAVE THIS INFORMATION SECURELY (for testnet only!)");
  console.log("\n2. Import to MetaMask:");
  console.log("   - Open MetaMask");
  console.log("   - Click account icon > Import Account");
  console.log("   - Paste private key (without 0x prefix):");
  console.log(`   - ${wallet.privateKey.substring(2)}`);
  console.log("\n3. Switch to BSC Testnet in MetaMask:");
  console.log("   - Network Name: BSC Testnet");
  console.log("   - RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/");
  console.log("   - Chain ID: 97");
  console.log("   - Symbol: BNB");
  console.log("   - Explorer: https://testnet.bscscan.com");
  console.log("\n4. Get Testnet BNB:");
  console.log(`   - Go to: https://testnet.bnbchain.org/faucet-smart`);
  console.log(`   - Paste your address: ${wallet.address}`);
  console.log(`   - Click "Give me BNB"`);
  console.log(`   - Wait ~30 seconds`);
  console.log("\n5. Add to .env file:");
  console.log(`   - PRIVATE_KEY=${wallet.privateKey.substring(2)}`);
  console.log("\n" + "=".repeat(60));
  console.log("\n⚠️  SECURITY REMINDERS:\n");
  console.log("   - This wallet is for TESTNET ONLY");
  console.log("   - Never use this private key on mainnet");
  console.log("   - Never send real BNB/tokens to this address");
  console.log("   - Keep .env file in .gitignore");
  console.log("\n" + "=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
