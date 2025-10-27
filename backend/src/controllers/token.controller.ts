import { Request, Response } from 'express';
import { tokenService } from '../services/token.service';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class TokenController {
  /**
   * GET /api/tokens
   * Get all tokens with pagination
   */
  getAllTokens = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const result = await tokenService.getAllTokens({ page, limit, sortBy, sortOrder });

    res.json({
      success: true,
      ...result,
    });
  });

  /**
   * GET /api/tokens/:address
   * Get token by address
   */
  getTokenByAddress = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    const token = await tokenService.getTokenByAddress(address);

    res.json({
      success: true,
      data: token,
    });
  });

  /**
   * GET /api/tokens/trending
   * Get trending tokens
   */
  getTrendingTokens = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const tokens = await tokenService.getTrendingTokens(limit);

    res.json({
      success: true,
      data: tokens,
    });
  });

  /**
   * GET /api/tokens/recent
   * Get recently created tokens
   */
  getRecentTokens = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const tokens = await tokenService.getRecentTokens(limit);

    res.json({
      success: true,
      data: tokens,
    });
  });

  /**
   * GET /api/tokens/graduated
   * Get graduated tokens
   */
  getGraduatedTokens = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await tokenService.getGraduatedTokens({ page, limit });

    res.json({
      success: true,
      ...result,
    });
  });

  /**
   * GET /api/tokens/:address/holders
   * Get token holders
   */
  getTokenHolders = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const holders = await tokenService.getTokenHolders(address, limit);

    res.json({
      success: true,
      data: holders,
    });
  });

  /**
   * GET /api/tokens/search
   * Search tokens by name or symbol
   */
  searchTokens = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required',
      });
    }

    const tokens = await tokenService.searchTokens(query, limit);

    res.json({
      success: true,
      data: tokens,
    });
  });

  /**
   * POST /api/tokens/metadata
   * Create token metadata and upload to IPFS
   */
  createTokenMetadata = asyncHandler(async (req: AuthRequest, res: Response) => {
    const metadata = req.body;

    const ipfsHash = await tokenService.createTokenMetadata(metadata);

    res.json({
      success: true,
      data: {
        ipfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      },
    });
  });

  /**
   * GET /api/tokens/creator/:address
   * Get tokens by creator address
   */
  getTokensByCreator = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await tokenService.getTokensByCreator(address, { page, limit });

    res.json({
      success: true,
      ...result,
    });
  });
}

export const tokenController = new TokenController();
export default tokenController;
