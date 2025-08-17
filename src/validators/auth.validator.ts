// src/validators/auth.validator.ts
import { z } from "zod";


export const adminRegisterSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phoneNumber: z.string(),
  password: z.string().min(6),
  affiliation: z.string(),
  governmentIdType: z.string(),
  governmentIdNumber: z.string()
});


export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

