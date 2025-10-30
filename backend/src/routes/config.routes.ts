import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/config
 * Returns all contract addresses and blockchain configuration
 * Frontend should fetch this on startup instead of using hardcoded addresses
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const chainId = parseInt(process.env.CHAIN_ID || '97');
    const isMainnet = chainId === 56;

    res.json({
      success: true,
      data: {
        // Network configuration
        chainId,
        networkName: isMainnet ? 'BSC Mainnet' : 'BSC Testnet',
        rpcUrl: isMainnet
          ? process.env.BSC_MAINNET_RPC
          : process.env.BSC_TESTNET_RPC,

        // Contract addresses
        contracts: {
          tokenFactory: process.env.TOKEN_FACTORY_ADDRESS,
          platformConfig: process.env.PLATFORM_CONFIG_ADDRESS,
          graduationManager: process.env.GRADUATION_MANAGER_ADDRESS,
          asterToken: process.env.ASTER_TOKEN_ADDRESS,
          sampleToken: process.env.SAMPLE_TOKEN_ADDRESS,

          // External contracts (PancakeSwap)
          pancakeRouter: isMainnet
            ? '0x10ED43C718714eb63d5aA57B78B54704E256024E' // Mainnet
            : '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3', // Testnet
          pancakeFactory: isMainnet
            ? '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73' // Mainnet
            : '0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc', // Testnet
          wbnb: isMainnet
            ? '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' // Mainnet
            : '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', // Testnet
        },

        // Platform configuration
        fees: {
          bondingCurve: {
            total: 100, // 1% (100 bps)
            creator: 30, // 0.3% (30 bps)
            protocol: 70, // 0.7% (70 bps)
          },
          postGraduation: {
            total: 30, // 0.3% (30 bps)
            creator: 15, // 0.15% (15 bps)
            protocol: 15, // 0.15% (15 bps)
          },
        },

        // Token creation parameters
        tokenConfig: {
          totalSupply: '1000000000', // 1 billion tokens
          creatorAllocation: '200000000', // 200M (20%)
          bondingCurveAllocation: '800000000', // 800M (80%)
          virtualAsterReserve: '200000000', // 200M ASTER virtual reserve
          graduationThreshold: '100', // 100 ASTER
        },
      },
    });
  })
);

export default router;
