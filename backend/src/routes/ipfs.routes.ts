import { Router, Request, Response } from 'express';
import { ipfsService } from '../services/ipfs.service';
import logger from '../utils/logger';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
  },
  fileFilter: (_req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * Upload image file to IPFS
 * POST /api/ipfs/upload
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    // Type assertion for multer file
    const file = (req as any).file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No file provided',
      });
      return;
    }

    const ipfsHash = await ipfsService.uploadFile(file.buffer, file.originalname);
    const url = ipfsService.getGatewayUrl(ipfsHash);

    logger.info(`Image uploaded to IPFS: ${ipfsHash}`);

    res.json({
      success: true,
      data: {
        ipfsHash,
        url,
      },
    });
  } catch (error: any) {
    logger.error('Error uploading image to IPFS:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload image to IPFS',
    });
  }
});

/**
 * Upload JSON metadata to IPFS
 * POST /api/ipfs/upload-json
 */
router.post('/upload-json', async (req: Request, res: Response): Promise<void> => {
  try {
    const metadata = req.body;

    if (!metadata || typeof metadata !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Invalid metadata provided',
      });
      return;
    }

    const ipfsHash = await ipfsService.uploadJSON(metadata);
    const url = ipfsService.getGatewayUrl(ipfsHash);

    logger.info(`Metadata uploaded to IPFS: ${ipfsHash}`);

    res.json({
      success: true,
      data: {
        ipfsHash,
        url,
      },
    });
  } catch (error: any) {
    logger.error('Error uploading metadata to IPFS:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload metadata to IPFS',
    });
  }
});

/**
 * Get metadata from IPFS
 * GET /api/ipfs/:hash
 */
router.get('/:hash', async (req: Request, res: Response): Promise<void> => {
  try {
    const { hash } = req.params;

    if (!hash) {
      res.status(400).json({
        success: false,
        error: 'IPFS hash required',
      });
      return;
    }

    const metadata = await ipfsService.getJSON(hash);

    res.json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    logger.error(`Error fetching metadata from IPFS (${req.params.hash}):`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch metadata from IPFS',
    });
  }
});

/**
 * Test Pinata connection
 * GET /api/ipfs/test-connection
 */
router.get('/test/connection', async (_req: Request, res: Response): Promise<void> => {
  try {
    const isConnected = await ipfsService.testConnection();

    res.json({
      success: true,
      data: {
        connected: isConnected,
      },
    });
  } catch (error: any) {
    logger.error('Error testing Pinata connection:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test Pinata connection',
    });
  }
});

export default router;
