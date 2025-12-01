/**
 * Database Cleanup Script (One-Time)
 * 
 * This script clears old data from the database when contracts are redeployed.
 * It runs automatically during backend deployment to Render.
 * After successful cleanup, it marks itself as complete to avoid running again.
 * 
 * Usage: npx ts-node src/scripts/cleanup-old-data.ts
 * Or: node dist/scripts/cleanup-old-data.js (after build)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// New contract addresses (Dec 1, 2025 deployment)
const NEW_TOKEN_FACTORY = '0x535dD472F8A7B20B8c852A9fa7AFc1028D22E52D'.toLowerCase();
const NEW_SAMPLE_TOKEN = '0x1Fc9e9982A27Ea1762dB7385E031563d7a09fA78'.toLowerCase();

// Old bonding curve addresses (tokens created with old factory - 200 ASTER virtual reserve)
const OLD_BONDING_CURVES = [
  '0x94f0c4b589e44f94f203e6a6d4c6395f2d0ac884'.toLowerCase(), // Top Coin bonding curve
];

async function cleanupOldData() {
  console.log('🧹 Database Cleanup Script (One-Time)\n');
  console.log('='.repeat(50));

  try {
    // Check if cleanup was already performed
    const cleanupMarker = await prisma.indexerState.findFirst({
      where: { key: 'cleanup_dec1_2025_complete' },
    });

    if (cleanupMarker) {
      console.log('✅ Cleanup already performed on', cleanupMarker.value);
      console.log('   Skipping to preserve data.\n');
      return;
    }

    // Check if there are any tokens to clean up
    const totalTokens = await prisma.token.count();
    
    if (totalTokens === 0) {
      console.log('✅ Database is empty. Marking cleanup as complete.\n');
      await markCleanupComplete();
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
      console.log('✅ No old deployment tokens found. Marking cleanup as complete.\n');
      await markCleanupComplete();
      return;
    }

    console.log(`⚠️  Found ${oldTokens.length} token(s) from old deployment:`);
    oldTokens.forEach(t => console.log(`   - ${t.name} (${t.symbol}): ${t.address}`));
    console.log('\nStarting cleanup...\n');

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

    // Mark cleanup as complete
    await markCleanupComplete();

    console.log('\n🎉 Database cleanup complete!');
    console.log('='.repeat(50));
    console.log('\nNew contract addresses:');
    console.log(`  TokenFactory: ${NEW_TOKEN_FACTORY}`);
    console.log(`  Sample Token: ${NEW_SAMPLE_TOKEN}`);
    console.log('\nThe indexer will now start indexing from the new contracts.\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    // Don't throw - allow the server to start even if cleanup fails
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Mark cleanup as complete to prevent future runs
 */
async function markCleanupComplete() {
  try {
    await prisma.indexerState.upsert({
      where: { key: 'cleanup_dec1_2025_complete' },
      update: { value: new Date().toISOString() },
      create: {
        key: 'cleanup_dec1_2025_complete',
        value: new Date().toISOString(),
      },
    });
    console.log('\n✅ Marked cleanup as complete (will not run again)');
  } catch (error) {
    console.warn('⚠️  Could not mark cleanup as complete:', error);
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
