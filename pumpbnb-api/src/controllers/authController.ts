import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';

// Register with email/password
export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName || email.split('@')[0],
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        walletAddress: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = generateToken(user as any);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user,
      token
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
};

// Login with email/password
export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user info (without password hash)
    const { passwordHash, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
};

// Wallet authentication (MetaMask, Trust Wallet, etc.)
export const walletAuth = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { walletAddress, signature, message } = req.body;

    // TODO: Verify signature against message
    // This would typically involve verifying the signature was signed by the wallet
    // For now, we'll skip signature verification for demo purposes

    // Find or create user
    let user: any = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      // Create new user with wallet
      const newUser = await prisma.user.create({
        data: {
          walletAddress,
          displayName: `User ${walletAddress.slice(-4)}`,
        }
      });
      
      user = {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        walletAddress: newUser.walletAddress,
        createdAt: newUser.createdAt
      };
    }

    // Generate JWT token
    const token = generateToken(user as any);

    res.status(200).json({
      success: true,
      message: 'Wallet authentication successful',
      user,
      token
    });
  } catch (error: any) {
    console.error('Wallet auth error:', error);
    res.status(500).json({
      error: 'Wallet authentication failed',
      message: 'An error occurred during wallet authentication'
    });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        bio: true,
        avatar: true,
        walletAddress: true,
        twitterHandle: true,
        discordHandle: true,
        telegramHandle: true,
        totalTrades: true,
        totalVolume: true,
        winRate: true,
        reputation: true,
        createdAt: true
      }
    });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'An error occurred while fetching profile'
    });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { displayName, bio, twitterHandle, discordHandle, telegramHandle } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        displayName,
        bio,
        twitterHandle,
        discordHandle,
        telegramHandle
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        bio: true,
        walletAddress: true,
        twitterHandle: true,
        discordHandle: true,
        telegramHandle: true,
        createdAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'An error occurred while updating profile'
    });
  }
};

// Validation rules
export const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('displayName').optional().isLength({ min: 2, max: 50 })
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

export const walletAuthValidation = [
  body('walletAddress').isLength({ min: 42, max: 42 }).withMessage('Invalid wallet address'),
  body('signature').notEmpty().withMessage('Signature is required'),
  body('message').notEmpty().withMessage('Message is required')
];

export const updateProfileValidation = [
  body('displayName').optional().isLength({ min: 2, max: 50 }),
  body('bio').optional().isLength({ max: 500 }),
  body('twitterHandle').optional().isLength({ min: 1, max: 50 }),
  body('discordHandle').optional().isLength({ min: 1, max: 50 }),
  body('telegramHandle').optional().isLength({ min: 1, max: 50 })
];