/**
 * Database Cleanup Script (One-Time)
 * 
 * This script clears old data from the database when contracts are redeployed.
 * It runs automatically during backend deployment to Render.
 * It only runs if it detects tokens from the OLD deployment (200 ASTER virtual reserve).
 * 
 * Usage: npx ts-node src/scripts/cleanup-old-data.ts
 * Or: node dist/scripts/cleanup-old-data.js (after build)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Old bonding curve addresses (tokens created with old factory - 200 ASTER virtual reserve)
// These are the ONLY tokens that should trigger cleanup
const OLD_BONDING_CURVES = [
  '0x94f0c4b589e44f94f203e6a6d4c6395f2d0ac884'.toLowerCase(), // Top Coin (old factory)
  '0x9aadf72c679240b4f575fa37f7732bf54a0761f9'.toLowerCase(), // New token accidentally created via old factory
];

async function cleanupOldData() {
  console.log('\n🧹 Database Cleanup Script\n');
  console.log('='.repeat(50));

  try {
    // Check if there are any tokens to clean up
    const totalTokens = await prisma.token.count();
    
    if (totalTokens === 0) {
      console.log('✅ Database is empty. Nothing to clean.\n');
      return;
    }

    console.log(`Found ${totalTokens} token(s) in database.`);

    // Check for tokens with old bonding curves (200 ASTER virtual reserve)
    const oldTokens = await prisma.token.findMany({
      where: {
        bondingCurve: {
          in: OLD_BONDING_CURVES,
        },
      },
    });

    if (oldTokens.length === 0) {
      console.log('✅ No old deployment tokens found. Skipping cleanup.\n');
      return;
    }

    console.log(`⚠️  Found ${oldTokens.length} token(s) from OLD deployment:`);
    oldTokens.forEach(t => console.log(`   - ${t.name} (${t.symbol}): ${t.address}`));
    console.log('\nThese tokens use 200 ASTER virtual reserve (should be 10,000).');
    console.log('Starting cleanup...\n');

    // Delete in order to respect foreign key constraints
    const tables = [
      { name: 'OHLCVData', delete: () => prisma.oHLCVData.deleteMany() },
      { name: 'CommentLike', delete: () => prisma.commentLike.deleteMany() },
      { name: 'Comment', delete: () => prisma.comment.deleteMany() },
      { name: 'UserFavorite', delete: () => prisma.userFavorite.deleteMany() },
      { name: 'TokenHolder', delete: () => prisma.tokenHolder.deleteMany() },
      { name: 'GraduationEvent', delete: () => prisma.graduationEvent.deleteMany() },
      { name: 'Watchlist', delete: () => prisma.watchlist.deleteMany() },
      { name: 'UserPortfolio', delete: () => prisma.userPortfolio.deleteMany() },
      { name: 'Trade', delete: () => prisma.trade.deleteMany() },
      { name: 'TokenStats', delete: () => prisma.tokenStats.deleteMany() },
      { name: 'Token', delete: () => prisma.token.deleteMany() },
      { name: 'PlatformStats', delete: () => prisma.platformStats.deleteMany() },
      { name: 'IndexerState', delete: () => prisma.indexerState.deleteMany() },
    ];

    for (const table of tables) {
      try {
        const result = await table.delete();
        console.log(`  ✓ Cleared ${table.name}: ${result.count} records deleted`);
      } catch (error: any) {
        console.log(`  ⚠️  ${table.name}: ${error.message}`);
      }
    }

    console.log('\n🎉 Database cleanup complete!');
    console.log('='.repeat(50));
    console.log('\nOld tokens removed. New tokens will use 10,000 ASTER virtual reserve.');
    console.log('The indexer will now start fresh.\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    // Don't throw - allow the server to start even if cleanup fails
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  cleanupOldData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { cleanupOldData };
