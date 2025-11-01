/**
 * Script to check if a token is indexed in the database
 * Usage: npx ts-node scripts/check-token-indexed.ts <token-address>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkToken(tokenAddress: string) {
  try {
    console.log(`\n🔍 Checking token: ${tokenAddress}\n`);

    const token = await prisma.token.findUnique({
      where: { address: tokenAddress.toLowerCase() },
      include: {
        stats: true,
      },
    });

    if (token) {
      console.log('✅ Token found in database:');
      console.log(JSON.stringify(token, null, 2));
    } else {
      console.log('❌ Token NOT found in database');
      console.log('   The indexer may not have processed it yet.');
      console.log('   Check the indexer logs or wait a few minutes.');
    }

    // Check indexer state
    const indexerState = await prisma.indexerState.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (indexerState) {
      console.log(`\n📊 Indexer state:`);
      console.log(`   Last indexed block: ${indexerState.lastIndexedBlock}`);
      console.log(`   Last updated: ${indexerState.updatedAt}`);
    }

    // Check total tokens
    const totalTokens = await prisma.token.count();
    console.log(`\n📈 Total tokens indexed: ${totalTokens}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const tokenAddress = process.argv[2];

if (!tokenAddress) {
  console.error('Usage: npx ts-node scripts/check-token-indexed.ts <token-address>');
  process.exit(1);
}

checkToken(tokenAddress);
