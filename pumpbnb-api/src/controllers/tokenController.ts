import { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../config/database';

// Get all tokens with filtering and pagination
export const getTokens = async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      category, 
      featured, 
      nsfw = 'false',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      isActive: true
    };

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (nsfw === 'false') {
      where.isNsfw = false;
    }

    if (category === 'graduated') {
      where.isGraduated = true;
    } else if (category === 'about-to-graduate') {
      where.graduationProgress = { gte: 80 };
      where.isGraduated = false;
    } else if (category === 'newly-created') {
      where.graduationProgress = { lt: 10 };
      where.isGraduated = false;
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'marketCap') {
      orderBy.marketCap = order;
    } else if (sortBy === 'volume24h') {
      orderBy.volume24h = order;
    } else if (sortBy === 'priceChange24h') {
      orderBy.priceChange24h = order;
    } else {
      orderBy.createdAt = order;
    }

    const [tokens, totalCount] = await Promise.all([
      prisma.token.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              walletAddress: true
            }
          },
          _count: {
            select: {
              comments: true,
              trades: true,
              watchlists: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limitNum
      }),
      prisma.token.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: tokens,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasMore: pageNum < totalPages
      }
    });
  } catch (error: any) {
    console.error('Get tokens error:', error);
    res.status(500).json({
      error: 'Failed to fetch tokens',
      message: 'An error occurred while fetching tokens'
    });
  }
};

// Get single token by ID or address
export const getToken = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const token = await prisma.token.findFirst({
      where: {
        OR: [
          { id },
          { contractAddress: id }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            walletAddress: true,
            twitterHandle: true
          }
        },
        _count: {
          select: {
            comments: true,
            trades: true,
            watchlists: true
          }
        }
      }
    });

    if (!token) {
      return res.status(404).json({
        error: 'Token not found',
        message: 'The requested token does not exist'
      });
    }

    res.status(200).json({
      success: true,
      data: token
    });
  } catch (error: any) {
    console.error('Get token error:', error);
    res.status(500).json({
      error: 'Failed to fetch token',
      message: 'An error occurred while fetching token'
    });
  }
};

// Create new token
export const createToken = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      name,
      symbol,
      description,
      imageUrl,
      websiteUrl,
      twitterUrl,
      telegramUrl,
      discordUrl,
      totalSupply = '1000000000'
    } = req.body;

    // Check if symbol already exists
    const existingToken = await prisma.token.findFirst({
      where: { 
        symbol: symbol.toUpperCase(),
        isActive: true 
      }
    });

    if (existingToken) {
      return res.status(409).json({
        error: 'Symbol already exists',
        message: 'A token with this symbol already exists'
      });
    }

    // Create token
    const token = await prisma.token.create({
      data: {
        name,
        symbol: symbol.toUpperCase(),
        description,
        imageUrl,
        websiteUrl,
        twitterUrl,
        telegramUrl,
        discordUrl,
        totalSupply,
        creatorId: req.user!.id,
        price: 0.0001, // Starting price
        marketCap: 100 // Starting market cap
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            walletAddress: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Token created successfully',
      data: token
    });
  } catch (error: any) {
    console.error('Create token error:', error);
    res.status(500).json({
      error: 'Failed to create token',
      message: 'An error occurred while creating token'
    });
  }
};

// Update token (only by creator or admin)
export const updateToken = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const {
      description,
      imageUrl,
      websiteUrl,
      twitterUrl,
      telegramUrl,
      discordUrl
    } = req.body;

    // Check if token exists and user is creator
    const existingToken = await prisma.token.findUnique({
      where: { id }
    });

    if (!existingToken) {
      return res.status(404).json({
        error: 'Token not found',
        message: 'The requested token does not exist'
      });
    }

    if (existingToken.creatorId !== req.user!.id) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'Only the token creator can update this token'
      });
    }

    // Update token
    const token = await prisma.token.update({
      where: { id },
      data: {
        description,
        imageUrl,
        websiteUrl,
        twitterUrl,
        telegramUrl,
        discordUrl,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            walletAddress: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Token updated successfully',
      data: token
    });
  } catch (error: any) {
    console.error('Update token error:', error);
    res.status(500).json({
      error: 'Failed to update token',
      message: 'An error occurred while updating token'
    });
  }
};

// Get trending tokens
export const getTrendingTokens = async (req: Request, res: Response) => {
  try {
    const tokens = await prisma.token.findMany({
      where: {
        isActive: true,
        volume24h: { gt: 0 }
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: [
        { volume24h: 'desc' },
        { priceChange24h: 'desc' }
      ],
      take: 10
    });

    res.status(200).json({
      success: true,
      data: tokens
    });
  } catch (error: any) {
    console.error('Get trending tokens error:', error);
    res.status(500).json({
      error: 'Failed to fetch trending tokens',
      message: 'An error occurred while fetching trending tokens'
    });
  }
};

// Validation rules
export const createTokenValidation = [
  body('name').isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('symbol').isLength({ min: 1, max: 10 }).withMessage('Symbol must be 1-10 characters'),
  body('description').isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('imageUrl').optional().isURL().withMessage('Invalid image URL'),
  body('websiteUrl').optional().isURL().withMessage('Invalid website URL'),
  body('twitterUrl').optional().isURL().withMessage('Invalid Twitter URL'),
  body('telegramUrl').optional().isURL().withMessage('Invalid Telegram URL'),
  body('discordUrl').optional().isURL().withMessage('Invalid Discord URL'),
  body('totalSupply').optional().isNumeric().withMessage('Total supply must be numeric')
];

export const updateTokenValidation = [
  body('description').optional().isLength({ min: 10, max: 1000 }),
  body('imageUrl').optional().isURL(),
  body('websiteUrl').optional().isURL(),
  body('twitterUrl').optional().isURL(),
  body('telegramUrl').optional().isURL(),
  body('discordUrl').optional().isURL()
];

export const getTokensValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isIn(['graduated', 'about-to-graduate', 'newly-created']),
  query('featured').optional().isBoolean(),
  query('nsfw').optional().isBoolean(),
  query('sortBy').optional().isIn(['createdAt', 'marketCap', 'volume24h', 'priceChange24h']),
  query('order').optional().isIn(['asc', 'desc'])
];