import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { adminService } from '../services/admin.service';

export class AdminController {
  /**
   * POST /api/admin/index-token
   * Manually index a specific token by its address
   */
  indexToken = asyncHandler(async (req: Request, res: Response) => {
    const { tokenAddress } = req.body;

    const result = await adminService.indexToken(tokenAddress);

    res.json({
      success: true,
      message: result.alreadyIndexed
        ? 'Token was already indexed'
        : 'Token indexed successfully',
      data: result,
    });
  });

  /**
   * POST /api/admin/reindex-blocks
   * Re-index a range of blocks
   */
  reindexBlocks = asyncHandler(async (req: Request, res: Response) => {
    const { fromBlock, toBlock } = req.body;

    const result = await adminService.reindexBlocks(fromBlock, toBlock);

    res.json({
      success: true,
      message: `Re-indexed blocks ${fromBlock} to ${result.toBlock}`,
      data: result,
    });
  });

  /**
   * GET /api/admin/indexer-status
   * Get current indexer status
   */
  getIndexerStatus = asyncHandler(async (req: Request, res: Response) => {
    const status = await adminService.getIndexerStatus();

    res.json({
      success: true,
      data: status,
    });
  });
}

export const adminController = new AdminController();
