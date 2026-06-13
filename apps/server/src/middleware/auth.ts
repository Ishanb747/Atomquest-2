import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'TOKEN_MISSING', message: 'Authorization header required' });
    return;
  }

  const token = authHeader.slice(7);
  if (!token || token.split('.').length !== 3) {
    res.status(401).json({ error: 'TOKEN_INVALID', message: 'Invalid token format' });
    return;
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Token has expired' });
      return;
    }
    res.status(401).json({ error: 'TOKEN_INVALID', message: 'Invalid token' });
  }
}

export function requireRole(role: 'AGENT' | 'CUSTOMER') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ error: 'FORBIDDEN', message: `Role ${role} required` });
      return;
    }
    next();
  };
}