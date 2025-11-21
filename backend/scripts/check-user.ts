import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  const address = '0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94';

  console.log(`Checking user: ${address}`);

  const user = await prisma.user.findUnique({
    where: { walletAddress: address.toLowerCase() },
  });

  if (user) {
    console.log('User found:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('User NOT found in database');

    // Check if user has any activity (trades, tokens, etc.)
    const trades = await prisma.trade.count({
      where: { trader: address.toLowerCase() }
    });

    const tokensCreated = await prisma.token.count({
      where: { creator: address.toLowerCase() }
    });

    const comments = await prisma.comment.count({
      where: { userAddress: address.toLowerCase() }
    });

    console.log(`\nActivity found:`);
    console.log(`- Trades: ${trades}`);
    console.log(`- Tokens created: ${tokensCreated}`);
    console.log(`- Comments: ${comments}`);

    if (trades > 0 || tokensCreated > 0 || comments > 0) {
      console.log('\nUser has activity but no profile record!');
      console.log('Creating auto-generated profile...');

      // Generate username like Pump.fun (first 6 chars, lowercase)
      const defaultUsername = address.slice(2, 8).toLowerCase(); // Skip "0x"

      const newUser = await prisma.user.create({
        data: {
          walletAddress: address.toLowerCase(),
          username: defaultUsername,
          createdTokensCount: tokensCreated,
        },
      });

      console.log('\nUser profile created:');
      console.log(JSON.stringify(newUser, null, 2));
    }
  }

  await prisma.$disconnect();
}

checkUser().catch(console.error);
