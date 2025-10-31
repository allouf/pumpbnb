/**
 * Script to manually index a specific token by fetching its TokenCreated event
 * Usage: npm run index-token <token-address>
 */

import { ethers } from 'ethers';
import { config } from '../src/config';
import { prisma } from '../src/services/database.service';
import TokenFactoryABI from '../artifacts/contracts/TokenFactory.sol/TokenFactory.json';

async function indexToken(tokenAddress: string): Promise<void> {
  try {
    console.log(`Indexing token: ${tokenAddress}`);

    // Initialize provider
    const provider = new ethers.JsonRpcProvider(config.bscTestnetRpc);
    console.log('Connected to BSC Testnet RPC');

    // Initialize TokenFactory contract
    const tokenFactoryContract = new ethers.Contract(
      config.tokenFactoryAddress,
      TokenFactoryABI.abi,
      provider
    );

    // Get current block
    const currentBlock = await provider.getBlockNumber();
    console.log(`Current block: ${currentBlock}`);

    // Query TokenCreated events for this specific token (last 10000 blocks)
    const fromBlock = Math.max(0, currentBlock - 10000);
    console.log(`Searching from block ${fromBlock} to ${currentBlock}...`);

    const filter = tokenFactoryContract.filters.TokenCreated();
    const events = await tokenFactoryContract.queryFilter(filter, fromBlock, currentBlock);

    console.log(`Found ${events.length} total TokenCreated events`);

    // Find the event for our token
    const tokenEvent = events.find((event: any) =>
      event.args && event.args[0].toLowerCase() === tokenAddress.toLowerCase()
    );

    if (!tokenEvent) {
      console.error(`❌ No TokenCreated event found for ${tokenAddress}`);
      console.log('Token might have been created before block', fromBlock);
      console.log('Try increasing the block range or provide the creation block number');
      process.exit(1);
    }

    const eventLog = tokenEvent as ethers.EventLog;
    const args = eventLog.args;
    const [token, bondingCurve, creator, name, symbol] = args;

    console.log(`✅ Found TokenCreated event:`);
    console.log(`   Token: ${token}`);
    console.log(`   Bonding Curve: ${bondingCurve}`);
    console.log(`   Creator: ${creator}`);
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Block: ${eventLog.blockNumber}`);

    // Check if already indexed
    const existing = await prisma.token.findUnique({
      where: { address: token.toLowerCase() },
    });

    if (existing) {
      console.log(`⚠️  Token ${token} already exists in database`);
      console.log('Skipping...');
      await prisma.$disconnect();
      return;
    }

    // Get block timestamp
    const block = await provider.getBlock(eventLog.blockNumber);
    const timestamp = block ? new Date(block.timestamp * 1000) : new Date();

    // Store token in database
    await prisma.token.create({
      data: {
        address: token.toLowerCase(),
        name,
        symbol,
        description: '', // Will be updated from IPFS metadata
        imageUrl: '', // Will be updated from IPFS metadata
        creator: creator.toLowerCase(),
        totalSupply: '1000000000000000000000000000', // 1 billion with 18 decimals
        bondingCurve: bondingCurve.toLowerCase(),
        createdAt: timestamp,
        blockNumber: eventLog.blockNumber,
        isGraduated: false,
      },
    });

    // Initialize token stats
    await prisma.tokenStats.create({
      data: {
        tokenAddress: token.toLowerCase(),
        price: '0',
        marketCap: '0',
        volume24h: '0',
        liquidity: '0',
        trades24h: 0,
        holders: 1, // Creator is first holder
        priceChange24h: '0',
      },
    });

    console.log(`✅ Token ${token} indexed successfully!`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error indexing token:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Get token address from command line
const tokenAddress = process.argv[2];

if (!tokenAddress) {
  console.error('Usage: npm run index-token <token-address>');
  process.exit(1);
}

if (!ethers.isAddress(tokenAddress)) {
  console.error(`Invalid Ethereum address: ${tokenAddress}`);
  process.exit(1);
}

indexToken(tokenAddress);
