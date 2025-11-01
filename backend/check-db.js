const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://pumpbnb_user:nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb@dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com/pumpbnb?sslmode=require'
    }
  }
});

async function checkDatabase() {
  console.log('=== DATABASE CHECK ===\n');

  // Check tokens
  const tokens = await prisma.token.findMany({
    select: {
      address: true,
      name: true,
      symbol: true,
      bondingCurve: true,
      createdAt: true,
    }
  });
  console.log(`Tokens: ${tokens.length}`);
  tokens.forEach(t => {
    console.log(`  - ${t.name} (${t.symbol}): ${t.address}`);
    console.log(`    Bonding Curve: ${t.bondingCurve}`);
  });

  // Check trades
  console.log('\nTrades:');
  const tradesCount = await prisma.trade.count();
  console.log(`  Total: ${tradesCount}`);

  const recentTrades = await prisma.trade.findMany({
    take: 5,
    orderBy: { timestamp: 'desc' },
    select: {
      trader: true,
      tokenAddress: true,
      isBuy: true,
      amountIn: true,
      amountOut: true,
      timestamp: true,
      txHash: true,
    }
  });

  recentTrades.forEach(t => {
    console.log(`  - ${t.isBuy ? 'BUY' : 'SELL'}: ${t.trader.slice(0, 8)}... on ${t.tokenAddress.slice(0, 8)}...`);
    console.log(`    In: ${Number(t.amountIn) / 1e18}, Out: ${Number(t.amountOut) / 1e18}`);
    console.log(`    TX: ${t.txHash}`);
  });

  // Check indexer state
  console.log('\nIndexer State:');
  const indexerState = await prisma.indexerState.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  if (indexerState) {
    console.log(`  Last indexed block: ${indexerState.lastIndexedBlock}`);
    console.log(`  Updated at: ${indexerState.updatedAt}`);
  } else {
    console.log('  No indexer state found');
  }

  await prisma.$disconnect();
}

checkDatabase().catch(console.error);
