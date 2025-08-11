// src/types/express/index.d.ts

import { UserRole } from '../../constants/roles'; // optional if you're using roles enum

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        role: UserRole | string; // or just 'string' if not using enums
      };
    }
  }
}
