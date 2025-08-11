// validators/user.validator.ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  phoneNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  password: z.string().min(6).optional(),
});
