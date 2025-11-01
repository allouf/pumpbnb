import { Router, Request, Response } from 'express';
import { prisma } from '../services/database.service';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/migrations/fix-image-urls
 * Fix image URLs for all tokens with IPFS metadata
 */
router.post('/fix-image-urls', async (_req: Request, res: Response) => {
  try {
    logger.info('[Migration] Starting fix-image-urls migration');

    const tokens = await prisma.token.findMany({
      where: {
        AND: [
          { ipfsHash: { not: null } },
          { ipfsHash: { not: '' } },
        ],
      },
    });

    logger.info(`[Migration] Found ${tokens.length} tokens to check/fix`);

    const results = {
      total: tokens.length,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const token of tokens) {
      try {
        logger.info(`[Migration] Processing token: ${token.symbol} (${token.address})`);

        // Fetch metadata from IPFS
        const ipfsUrl = `https://ipfs.io/ipfs/${token.ipfsHash}`;
        const response = await fetch(ipfsUrl);
        const metadata: any = await response.json();

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

        logger.info(`[Migration] Updated ${token.symbol} - imageUrl: ${imageUrl}`);
        results.updated++;
      } catch (error: any) {
        logger.error(`[Migration] Error updating ${token.symbol}:`, error);
        results.failed++;
        results.errors.push(`${token.symbol}: ${error.message}`);
      }
    }

    logger.info('[Migration] Migration complete!', results);

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    logger.error('[Migration] Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
