import { prisma } from '../services/database.service';
import logger from './logger';

/**
 * Auto-create user profile if it doesn't exist
 * Similar to Pump.fun behavior - creates profiles automatically on first interaction
 *
 * @param walletAddress - The wallet address to create profile for
 * @returns The user object (existing or newly created)
 */
export async function ensureUserExists(walletAddress: string) {
  try {
    const normalizedAddress = walletAddress.toLowerCase();

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      // Generate default username like Pump.fun (first 6 chars after 0x)
      // Example: 0x5f9ce34bb... -> 5f9ce3
      const defaultUsername = normalizedAddress.slice(2, 8);

      // Count tokens created by this user (they may have created tokens before profile)
      const tokensCreated = await prisma.token.count({
        where: { creator: normalizedAddress },
      });

      // Create the user profile
      user = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          username: defaultUsername,
          createdTokensCount: tokensCreated,
        },
      });

      logger.info(`[AutoUser] Created profile for ${walletAddress} with username: ${defaultUsername}`);
    }

    return user;
  } catch (error: any) {
    logger.error(`[AutoUser] Error ensuring user exists for ${walletAddress}:`, error);
    // Return null instead of throwing to prevent blocking operations
    return null;
  }
}

/**
 * Batch ensure multiple users exist
 * Useful for bulk operations like fetching comment authors
 *
 * @param addresses - Array of wallet addresses
 */
export async function ensureUsersExist(addresses: string[]) {
  const uniqueAddresses = [...new Set(addresses.map(a => a.toLowerCase()))];

  try {
    for (const address of uniqueAddresses) {
      await ensureUserExists(address);
    }
  } catch (error: any) {
    logger.error(`[AutoUser] Error in batch user creation:`, error);
  }
}
