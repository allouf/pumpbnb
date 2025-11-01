/**
 * Fix image URLs for existing tokens
 * Converts IPFS hashes to full ipfs:// URIs
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching ALL tokens with IPFS hashes...');

  const tokens = await prisma.token.findMany({
    where: {
      ipfsHash: {
        not: null,
        not: '',
      },
    },
  });

  console.log(`Found ${tokens.length} tokens to check/fix`);

  for (const token of tokens) {
    try {
      console.log(`\nFixing token: ${token.symbol} (${token.address})`);
      console.log(`IPFS Hash: ${token.ipfsHash}`);

      // Fetch metadata from IPFS
      const ipfsUrl = `https://ipfs.io/ipfs/${token.ipfsHash}`;
      console.log(`Fetching metadata from: ${ipfsUrl}`);

      const response = await fetch(ipfsUrl);
      const metadata = await response.json();

      console.log('Metadata:', JSON.stringify(metadata, null, 2));

      let imageUrl = '';
      let description = metadata.description || '';

      if (metadata.image) {
        if (metadata.image.startsWith('ipfs://')) {
          imageUrl = metadata.image;
        } else if (metadata.image.startsWith('Qm') || metadata.image.startsWith('bafy')) {
          imageUrl = `ipfs://${metadata.image}`;
        } else if (metadata.image.startsWith('http')) {
          imageUrl = metadata.image;
        } else {
          imageUrl = `ipfs://${metadata.image}`;
        }
      }

      // Extract social links
      let website = metadata.external_url || '';
      let twitter = '';
      let telegram = '';
      let discord = '';

      if (metadata.properties?.social) {
        twitter = metadata.properties.social.twitter || '';
        telegram = metadata.properties.social.telegram || '';
        website = metadata.properties.social.website || website;
        discord = metadata.properties.social.discord || '';
      }

      console.log(`Updating with:`);
      console.log(`  Description: ${description}`);
      console.log(`  Image URL: ${imageUrl}`);
      console.log(`  Website: ${website}`);
      console.log(`  Twitter: ${twitter}`);
      console.log(`  Telegram: ${telegram}`);

      await prisma.token.update({
        where: { id: token.id },
        data: {
          description,
          imageUrl,
          website,
          twitter,
          telegram,
          discord,
        },
      });

      console.log(`✓ Updated ${token.symbol}`);
    } catch (error) {
      console.error(`✗ Error updating ${token.symbol}:`, error.message);
    }
  }

  console.log('\n✓ Migration complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
