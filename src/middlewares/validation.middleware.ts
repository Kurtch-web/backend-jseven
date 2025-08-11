import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: ZodSchema<any>) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    schema.parse(req.body);  // <=== Only validate req.body here
    next();
  } catch (error) {
    console.error("Zod Validation Error:", error);
    return res.status(400).json({ error: "Invalid form data", details: error });
  }
};
