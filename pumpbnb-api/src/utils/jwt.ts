import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email?: string;
  walletAddress?: string;
}

export const generateToken = (user: User): string => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email || undefined,
    walletAddress: user.walletAddress || undefined,
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback-secret',
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'pumpbnb-api',
      audience: 'pumpbnb-frontend'
    } as jwt.SignOptions
  );
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret',
      {
        issuer: 'pumpbnb-api',
        audience: 'pumpbnb-frontend'
      }
    ) as JwtPayload;
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
};