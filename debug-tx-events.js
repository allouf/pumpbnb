// Debug script to analyze the transaction events
const { createPublicClient, http, decodeEventLog, parseAbiItem } = require('viem');
const { bscTestnet } = require('viem/chains');

async function debugTransaction() {
  const client = createPublicClient({
    chain: bscTestnet,
    transport: http('https://bsc-testnet-rpc.publicnode.com')
  });
  
  const txHash = '0xe50cc920adaf21f5e4fcf867358b0dcd46d9afae4bea86e81347bd8a8a79ea1b';
  const bondingCurveAddress = '0xDf41DA00149B6361bDc40023da88b6E8006f4aE7';
  
  try {
    console.log('🔍 Analyzing transaction:', txHash);
    console.log('📍 Expected bonding curve:', bondingCurveAddress);
    
    // Get transaction receipt
    const receipt = await client.getTransactionReceipt({ hash: txHash });
    
    console.log('\n📋 Transaction Receipt:');
    console.log('- Status:', receipt.status);
    console.log('- Block:', receipt.blockNumber.toString());
    console.log('- Logs count:', receipt.logs.length);
    
    // Define possible event ABIs to try
    const eventABIs = [
      // Current ABI format
      parseAbiItem('event Buy(address indexed buyer, uint256 asterIn, uint256 tokensOut, uint256 creatorFee, uint256 protocolFee, uint256 timestamp)'),
      parseAbiItem('event Sell(address indexed seller, uint256 tokensIn, uint256 asterOut, uint256 creatorFee, uint256 protocolFee, uint256 timestamp)'),
      
      // Alternative formats
      parseAbiItem('event Trade(address indexed trader, bool isBuy, uint256 amountIn, uint256 amountOut, uint256 fee)'),
      parseAbiItem('event TokenPurchase(address indexed buyer, uint256 asterAmount, uint256 tokenAmount)'),
      parseAbiItem('event TokenSale(address indexed seller, uint256 tokenAmount, uint256 asterAmount)'),
      
      // ERC20 Transfer events (these should also be present)
      parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
      parseAbiItem('event Approval(address indexed owner, address indexed spender, uint256 value)')
    ];
    
    console.log('\n📝 Analyzing logs:');
    
    let bondingCurveEvents = [];
    let otherEvents = [];
    
    receipt.logs.forEach((log, i) => {
      console.log(`\n  Log ${i}:`);
      console.log(`    Address: ${log.address}`);
      console.log(`    Topics: ${log.topics.length}`);
      console.log(`    Data length: ${log.data.length}`);
      console.log(`    Is from bonding curve: ${log.address.toLowerCase() === bondingCurveAddress.toLowerCase()}`);
      
      if (log.address.toLowerCase() === bondingCurveAddress.toLowerCase()) {
        bondingCurveEvents.push(log);
      } else {
        otherEvents.push(log);
      }
      
      // Try to decode with each ABI
      for (const abi of eventABIs) {
        try {
          const decoded = decodeEventLog({
            abi: [abi],
            data: log.data,
            topics: log.topics
          });
          
          console.log(`    ✅ Decoded as ${decoded.eventName}:`, decoded.args);
        } catch (e) {
          // Continue trying other ABIs
        }
      }
    });
    
    console.log('\n📊 Summary:');
    console.log('- Bonding curve events:', bondingCurveEvents.length);
    console.log('- Other contract events:', otherEvents.length);
    
    if (bondingCurveEvents.length === 0) {
      console.log('\n❌ No events found from the bonding curve contract!');
      console.log('   This might indicate:');
      console.log('   1. Wrong bonding curve address');
      console.log('   2. Transaction was to a different contract');
      console.log('   3. The transaction failed');
    }
    
  } catch (error) {
    console.error('❌ Error analyzing transaction:', error);
  }
}

debugTransaction().catch(console.error);