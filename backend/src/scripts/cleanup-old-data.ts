/**
 * Database Cleanup Script
 * 
 * This script clears old data from the database when contracts are redeployed.
 * It runs automatically during backend deployment to Render.
 * 
 * Usage: npx ts-node src/scripts/cleanup-old-data.ts
 * Or: node dist/scripts/cleanup-old-data.js (after build)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// New contract addresses (Dec 1, 2025 deployment)
const NEW_TOKEN_FACTORY = '0x535dD472F8A7B20B8c852A9fa7AFc1028D22E52D'.toLowerCase();
const NEW_ASTER_TOKEN = '0x9C61208DAb099F9287E0104cbDd92bca507c1265'.toLowerCase();

async function cleanupOldData() {
  console.log('🧹 Starting database cleanup for new contract deployment...\n');

  try {
    // Check if cleanup is needed by looking for old tokens
    const totalTokens = await prisma.token.count();
    
    if (totalTokens === 0) {
      console.log('✅ Database is already clean. No cleanup needed.\n');
      return;
    }

    console.log(`Found ${totalTokens} tokens in database. Checking if cleanup is needed...`);

    // Check if we have any tokens from the new deployment
    const sampleToken = await prisma.token.findFirst({
      where: {
        address: '0x1Fc9e9982A27Ea1762dB7385E031563d7a09fA78'.toLowerCase(),
      },
    });

    // If sample token exists, new deployment data is already indexed
    // Only cleanup if no new tokens exist (all old data)
    const hasNewDeploymentData = sampleToken !== null;

    if (hasNewDeploymentData) {
      console.log('✅ New deployment data detected. Skipping cleanup to preserve data.\n');
      return;
    }

    console.log('⚠️  Old deployment data detected. Starting cleanup...\n');

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

    console.log('\n🎉 Database cleanup complete!\n');
    console.log('New contract addresses:');
    console.log(`  TokenFactory: ${NEW_TOKEN_FACTORY}`);
    console.log(`  ASTER Token:  ${NEW_ASTER_TOKEN}`);
    console.log('\nThe indexer will now start indexing from the new contracts.\n');

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
