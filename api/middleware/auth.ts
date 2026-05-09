import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not set');
    console.error('Please set JWT_SECRET in your .env file or environment variables');
    process.exit(1);
  }
  return secret;
}

// Lazy load JWT_SECRET after dotenv is configured
let JWT_SECRET: string;

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    name: string;
  };
}

export function generateToken(user: { id: number; username: string; role: string; name: string }) {
  if (!JWT_SECRET) JWT_SECRET = getJwtSecret();
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string) {
  if (!JWT_SECRET) JWT_SECRET = getJwtSecret();
  return jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string; name: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: '未提供认证令牌' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: '令牌无效或已过期' });
  }
}

export function roleMiddleware(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: '未认证' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: '权限不足' });
      return;
    }
    next();
  };
}
