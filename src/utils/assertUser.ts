import { Request } from 'express';

export function assertUser(req: Request): asserts req is Request & {
  user: { _id: string; email: string; role: string };
} {
  if (!req.user || !req.user.id) {
    throw new Error('Unauthorized: req.user is missing');
  }
}
