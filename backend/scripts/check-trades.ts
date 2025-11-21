import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTrades() {
  // Your wallet address
  const userAddress = '0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94';

  console.log(`\n🔍 Checking trades for: ${userAddress}\n`);

  // Find tokens created by this user
  const tokens = await prisma.token.findMany({
    where: { creator: userAddress.toLowerCase() },
    select: {
      address: true,
      name: true,
      symbol: true,
      bondingCurve: true,
    },
  });

  if (tokens.length === 0) {
    console.log('❌ No tokens found for this address');
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ Found ${tokens.length} token(s):\n`);

  for (const token of tokens) {
    console.log(`📦 Token: ${token.name} (${token.symbol})`);
    console.log(`   Address: ${token.address}`);
    console.log(`   Bonding Curve: ${token.bondingCurve}\n`);

    // Get all trades for this token
    const allTrades = await prisma.trade.findMany({
      where: { tokenAddress: token.address },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        trader: true,
        isBuy: true,
        amountIn: true,
        amountOut: true,
        asterAmount: true,
        tokenAmount: true,
        fee: true,
        timestamp: true,
        txHash: true,
      },
    });

    console.log(`   📊 Total Trades: ${allTrades.length}`);

    const buys = allTrades.filter(t => t.isBuy);
    const sells = allTrades.filter(t => !t.isBuy);

    console.log(`   🟢 Buys: ${buys.length}`);
    console.log(`   🔴 Sells: ${sells.length}\n`);

    // Show recent trades
    console.log(`   📋 Recent trades (last 5):`);
    allTrades.slice(0, 5).forEach((trade, index) => {
      const type = trade.isBuy ? '🟢 BUY ' : '🔴 SELL';
      const tokenAmt = Number(trade.tokenAmount || trade.amountOut) / 1e18;
      const asterAmt = Number(trade.asterAmount || trade.amountIn) / 1e18;

      console.log(`   ${index + 1}. ${type}`);
      console.log(`      Trader: ${trade.trader}`);
      console.log(`      Amount: ${tokenAmt.toFixed(2)} tokens for ${asterAmt.toFixed(4)} ASTER`);
      console.log(`      Time: ${trade.timestamp.toLocaleString()}`);
      console.log(`      TxHash: ${trade.txHash}`);
      console.log('');
    });

    // Check if there are any sells by the creator
    const creatorTrades = allTrades.filter(
      t => t.trader.toLowerCase() === userAddress.toLowerCase()
    );

    console.log(`   👤 Your Trades: ${creatorTrades.length}`);
    const yourBuys = creatorTrades.filter(t => t.isBuy);
    const yourSells = creatorTrades.filter(t => !t.isBuy);
    console.log(`   🟢 Your Buys: ${yourBuys.length}`);
    console.log(`   🔴 Your Sells: ${yourSells.length}\n`);

    if (yourSells.length > 0) {
      console.log(`   📋 Your Sell Transactions:`);
      yourSells.forEach((trade, index) => {
        const tokenAmt = Number(trade.tokenAmount || trade.amountIn) / 1e18;
        const asterAmt = Number(trade.asterAmount || trade.amountOut) / 1e18;

        console.log(`   ${index + 1}. 🔴 SELL`);
        console.log(`      Amount: ${tokenAmt.toFixed(2)} tokens for ${asterAmt.toFixed(4)} ASTER`);
        console.log(`      Time: ${trade.timestamp.toLocaleString()}`);
        console.log(`      TxHash: ${trade.txHash}`);
        console.log('');
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  await prisma.$disconnect();
}

checkTrades().catch(console.error);
