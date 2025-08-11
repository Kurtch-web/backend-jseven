// middlewares/jwt.middleware.ts (your Express middleware)
import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../utils/jwt'; // adjust path
export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token;
    if (!token || typeof token !== 'string') {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = verifyJWT(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ message: err.message || 'Invalid token' });
  }
}

