import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../utils/jwt";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import jwt from 'jsonwebtoken';
import { getEnv } from "../config/env";

export interface JwtPayload {
  id: string;
  role: string;
  name?: string; // ✅ Add this
  email?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}


export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.cookies?.token && typeof req.cookies.token === "string") {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    typeof req.headers.authorization === "string" &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Add these logs here:
  console.log("req.cookies:", req.cookies);
  console.log("typeof req.cookies.token:", typeof req.cookies?.token);
  console.log("token value:", token);

  if (!token) {
    return next(new UnauthorizedError("Unauthorized: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, getEnv.JWT_SECRET) as JwtPayload;

    if (!decoded || typeof decoded !== "object" || !decoded.id || !decoded.role) {
      return next(new UnauthorizedError("Invalid token payload"));
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return next(new UnauthorizedError("Invalid or expired token"));
  }
};



export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return next(new ForbiddenError("Forbidden: Insufficient role"));
    }
    next();
  };
};

export const requireAuth = (allowedRoles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, (err?: any) => {
      if (err) return next(err);

      if (allowedRoles.length && !allowedRoles.includes(req.user?.role || "")) {
        return next(new ForbiddenError("You do not have permission to access this route"));
      }

      next();
    });
  };
};


export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError("Unauthorized"));

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("Forbidden: Insufficient role"));
    }
    next();
  };
};

export { verifyJWT };