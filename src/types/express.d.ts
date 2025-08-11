import { UserRole } from "../models/user.model"; // adjust if needed

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}
