// src/validators/auth.validator.ts
import { z } from "zod";


export const adminRegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(5, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  affiliation: z.string().min(1, "Affiliation is required"),
  governmentIdType: z.string().min(1, "Government ID type is required"),
  governmentIdNumber: z.string().min(1, "Government ID number is required"),
});


export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

