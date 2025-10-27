import { prisma } from './database.service';
import { UserPortfolio, PaginationParams, PaginatedResponse } from '../types';
// import { NotFoundError } from '../utils/errors'; // TODO: Use for error handling
import { ethers } from 'ethers';
import { provider } from './indexer.service';
import PumpTokenABI from '../../../artifacts/contracts/PumpToken.sol/PumpToken.json';

export class UserService {
  /**
   * Get user portfolio
   */
  async getUserPortfolio(userAddress: string): Promise<UserPortfolio> {
    const holdings = await prisma.userPortfolio.findMany({
      where: { userAddress: userAddress.toLowerCase() },
    });

    let totalValue = BigInt(0);
    let totalProfitLoss = BigInt(0);

    const tokens = holdings.map((holding) => {
      const balance = BigInt(holding.balance);
      // TODO: Fetch token stats separately for accurate pricing
      const currentPrice = BigInt('0'); // Simplified for now
      const value = (balance * currentPrice) / BigInt(10 ** 18);

      const invested = BigInt(holding.totalInvested);
      const profitLoss = value - invested;
      const profitLossPercent =
        invested > BigInt(0) ? ((profitLoss * BigInt(10000)) / invested).toString() : '0';

      totalValue += value;
      totalProfitLoss += profitLoss;

      return {
        tokenAddress: holding.tokenAddress,
        balance: holding.balance,
        value: value.toString(),
        profitLoss: profitLoss.toString(),
        profitLossPercent,
      };
    });

    return {
      address: userAddress.toLowerCase(),
      tokens,
      totalValue: totalValue.toString(),
      totalProfitLoss: totalProfitLoss.toString(),
    };
  }

  /**
   * Update user portfolio after a trade
   */
  async updatePortfolio(
    userAddress: string,
    tokenAddress: string,
    balanceChange: string,
    investedChange: string
  ): Promise<void> {
    const existing = await prisma.userPortfolio.findUnique({
      where: {
        userAddress_tokenAddress: {
          userAddress: userAddress.toLowerCase(),
          tokenAddress: tokenAddress.toLowerCase(),
        },
      },
    });

    if (existing) {
      const newBalance = BigInt(existing.balance) + BigInt(balanceChange);
      const newInvested = BigInt(existing.totalInvested) + BigInt(investedChange);

      if (newBalance <= BigInt(0)) {
        // Remove if balance is zero
        await prisma.userPortfolio.delete({
          where: {
            userAddress_tokenAddress: {
              userAddress: userAddress.toLowerCase(),
              tokenAddress: tokenAddress.toLowerCase(),
            },
          },
        });
      } else {
        await prisma.userPortfolio.update({
          where: {
            userAddress_tokenAddress: {
              userAddress: userAddress.toLowerCase(),
              tokenAddress: tokenAddress.toLowerCase(),
            },
          },
          data: {
            balance: newBalance.toString(),
            totalInvested: newInvested.toString(),
          },
        });
      }
    } else if (BigInt(balanceChange) > BigInt(0)) {
      // Create new entry
      await prisma.userPortfolio.create({
        data: {
          userAddress: userAddress.toLowerCase(),
          tokenAddress: tokenAddress.toLowerCase(),
          balance: balanceChange,
          totalInvested: investedChange,
        },
      });
    }
  }

  /**
   * Get user transaction history
   */
  async getUserHistory(
    userAddress: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 20, sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where: { trader: userAddress.toLowerCase() },
        skip,
        take: limit,
        orderBy: { timestamp: sortOrder },
        include: {
          token: {
            select: {
              name: true,
              symbol: true,
              imageUrl: true,
            },
          },
        },
      }),
      prisma.trade.count({ where: { trader: userAddress.toLowerCase() } }),
    ]);

    return {
      data: trades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user P&L data
   */
  async getUserPnL(userAddress: string): Promise<any> {
    const portfolio = await this.getUserPortfolio(userAddress);

    // Get all trades to calculate realized P&L
    const trades = await prisma.trade.findMany({
      where: { trader: userAddress.toLowerCase() },
    });

    let realizedPnL = BigInt(0);
    let totalBuyVolume = BigInt(0);
    let totalSellVolume = BigInt(0);

    for (const trade of trades) {
      if (trade.isBuy) {
        totalBuyVolume += BigInt(trade.amountIn);
      } else {
        totalSellVolume += BigInt(trade.amountOut);
        // Realized P&L on sells (simplified)
        realizedPnL += BigInt(trade.amountOut) - BigInt(trade.amountIn);
      }
    }

    const unrealizedPnL = BigInt(portfolio.totalProfitLoss);
    const totalPnL = realizedPnL + unrealizedPnL;

    return {
      realizedPnL: realizedPnL.toString(),
      unrealizedPnL: unrealizedPnL.toString(),
      totalPnL: totalPnL.toString(),
      totalBuyVolume: totalBuyVolume.toString(),
      totalSellVolume: totalSellVolume.toString(),
      totalTrades: trades.length,
    };
  }

  /**
   * Add token to watchlist
   */
  async addToWatchlist(userAddress: string, tokenAddress: string): Promise<void> {
    await prisma.watchlist.upsert({
      where: {
        userAddress_tokenAddress: {
          userAddress: userAddress.toLowerCase(),
          tokenAddress: tokenAddress.toLowerCase(),
        },
      },
      create: {
        userAddress: userAddress.toLowerCase(),
        tokenAddress: tokenAddress.toLowerCase(),
      },
      update: {},
    });
  }

  /**
   * Remove token from watchlist
   */
  async removeFromWatchlist(userAddress: string, tokenAddress: string): Promise<void> {
    await prisma.watchlist.delete({
      where: {
        userAddress_tokenAddress: {
          userAddress: userAddress.toLowerCase(),
          tokenAddress: tokenAddress.toLowerCase(),
        },
      },
    });
  }

  /**
   * Get user watchlist
   */
  async getWatchlist(userAddress: string): Promise<any[]> {
    const watchlist = await prisma.watchlist.findMany({
      where: { userAddress: userAddress.toLowerCase() },
    });

    // TODO: Fetch token details separately
    return watchlist.map((item) => ({
      tokenAddress: item.tokenAddress,
      addedAt: item.addedAt,
    }));
  }

  /**
   * Sync user balances from blockchain
   */
  async syncBalances(userAddress: string): Promise<void> {
    const tokens = await prisma.token.findMany();

    for (const token of tokens) {
      try {
        const tokenContract = new ethers.Contract(token.address, PumpTokenABI.abi, provider);
        const balance = await tokenContract.balanceOf(userAddress);

        if (balance > BigInt(0)) {
          await prisma.userPortfolio.upsert({
            where: {
              userAddress_tokenAddress: {
                userAddress: userAddress.toLowerCase(),
                tokenAddress: token.address,
              },
            },
            create: {
              userAddress: userAddress.toLowerCase(),
              tokenAddress: token.address,
              balance: balance.toString(),
              totalInvested: '0', // Cannot determine from on-chain data
            },
            update: {
              balance: balance.toString(),
            },
          });
        }
      } catch (error) {
        // Skip if error
        continue;
      }
    }
  }
}

export const userService = new UserService();
export default userService;
