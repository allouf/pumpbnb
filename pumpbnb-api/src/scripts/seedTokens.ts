import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleTokens = [
  {
    contractAddress: '0x1234567890123456789012345678901234567890',
    name: 'The Lion',
    symbol: 'LION',
    description: 'The Lion Does Not Concern Himself with New All-Time Highs',
    price: 0.0052,
    marketCap: 4200000,
    volume24h: 850000,
    priceChange24h: 15.6,
    imageUrl: '/api/placeholder/100/100',
    websiteUrl: 'https://thelion.io',
    twitterUrl: 'https://twitter.com/thelion',
    telegramUrl: 'https://t.me/thelion'
  },
  {
    contractAddress: '0x2345678901234567890123456789012345678901',
    name: 'All Roads Lead To Rome',
    symbol: 'ROME',
    description: 'If You See This, Your Time is Coming',
    price: 0.0032,
    marketCap: 1600000,
    volume24h: 320000,
    priceChange24h: 8.3,
    imageUrl: '/api/placeholder/100/100',
    websiteUrl: 'https://rome.coin',
    twitterUrl: 'https://twitter.com/romecoin'
  },
  {
    contractAddress: '0x3456789012345678901234567890123456789012',
    name: 'Cap',
    symbol: 'CAP',
    description: 'X Users Bet Against Each Other on Anything with CAP',
    price: 0.0041,
    marketCap: 2000000,
    volume24h: 500000,
    priceChange24h: 12.1,
    imageUrl: '/api/placeholder/100/100'
  },
  {
    contractAddress: '0x4567890123456789012345678901234567890123',
    name: 'Telepath8',
    symbol: 'P8BTC',
    description: 'Neuralink Patient Launches Streamer Coin Via Telepathy',
    price: 0.00089,
    marketCap: 321900,
    volume24h: 89000,
    priceChange24h: 25.4,
    imageUrl: '/api/placeholder/100/100',
    websiteUrl: 'https://telepath8.io'
  },
  {
    contractAddress: '0x5678901234567890123456789012345678901234',
    name: 'Arcade',
    symbol: 'ARC',
    description: 'Arcade Livestream: Top Players Win',
    price: 0.00043,
    marketCap: 156300,
    volume24h: 34000,
    priceChange24h: 6.7,
    imageUrl: '/api/placeholder/100/100',
    telegramUrl: 'https://t.me/arcade'
  },
  {
    contractAddress: '0x6789012345678901234567890123456789012345',
    name: 'Moonshot',
    symbol: 'MOON',
    description: 'To the moon and beyond!',
    price: 0.0067,
    marketCap: 5500000,
    volume24h: 1200000,
    priceChange24h: 22.8,
    imageUrl: '/api/placeholder/100/100',
    websiteUrl: 'https://moonshot.crypto',
    twitterUrl: 'https://twitter.com/moonshot'
  },
  {
    contractAddress: '0x7890123456789012345678901234567890123456',
    name: 'Diamond Hands',
    symbol: 'DIAMOND',
    description: 'Hold strong, diamond hands prevail',
    price: 0.0028,
    marketCap: 980000,
    volume24h: 180000,
    priceChange24h: -5.2,
    imageUrl: '/api/placeholder/100/100'
  },
  {
    contractAddress: '0x8901234567890123456789012345678901234567',
    name: 'Rocket Fuel',
    symbol: 'FUEL',
    description: 'Powering the next generation of DeFi',
    price: 0.0091,
    marketCap: 7800000,
    volume24h: 1800000,
    priceChange24h: 18.9,
    imageUrl: '/api/placeholder/100/100',
    websiteUrl: 'https://rocketfuel.defi',
    twitterUrl: 'https://twitter.com/rocketfuel'
  }
];

async function seedTokens() {
  try {
    console.log('🌱 Seeding tokens...');
    
    // Clear existing data
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
    
    // Create a default user
    const defaultUser = await prisma.user.create({
      data: {
        username: 'system',
        walletAddress: '0x0000000000000000000000000000000000000000',
        displayName: 'System Creator'
      }
    });
    
    console.log('✅ Created default user:', defaultUser.id);
    
    // Create new tokens
    for (const tokenData of sampleTokens) {
      await prisma.token.create({
        data: {
          ...tokenData,
          creatorId: defaultUser.id
        }
      });
    }
    
    console.log(`✅ Successfully seeded ${sampleTokens.length} tokens`);
    
    // Display created tokens
    const tokens = await prisma.token.findMany();
    console.log('\n📋 Created tokens:');
    tokens.forEach((token, index) => {
      console.log(`${index + 1}. ${token.name} (${token.symbol}) - $${token.marketCap.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding tokens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTokens();