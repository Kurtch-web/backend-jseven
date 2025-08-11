import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../utils/jwt";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    role: string;
    [key: string]: any;
  };
}

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new UnauthorizedError("No token provided"));
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyJWT(token) as AuthenticatedRequest["user"];

      if (!decoded) {
        return next(new UnauthorizedError("Invalid or expired token"));
      }

      if (!roles.includes(decoded.role)) {
        return next(new ForbiddenError("Forbidden: Insufficient role"));
      }

      req.user = decoded;
      next();
    } catch (err) {
      return next(new UnauthorizedError("Invalid or expired token"));
    }
  };
};
