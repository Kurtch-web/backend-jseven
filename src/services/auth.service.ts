//services/auth.services.ts
import bcrypt from "bcrypt";


import  User  from "../models/user.model";
import { SuperAdmin } from "../models/superadmin.model";
import { compareHash } from "../utils/hash";
import { signJWT } from "../utils/jwt";
import { UnauthorizedError } from "../utils/errors";
import { IUser } from "../interfaces/user.interface";
import crypto from "crypto";
import nodemailer from "nodemailer";
import VerificationToken from "../models/verificationToken.model"; // create this model
import { sendVerificationEmail } from "../utils/email";

const generateToken = () => crypto.randomBytes(32).toString("hex");

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new UnauthorizedError("Invalid credentials");

  const isValid = await compareHash(password, user.password);
  if (!isValid) throw new UnauthorizedError("Invalid credentials");

  const token = signJWT({ id: user._id, role: user.role });
  return token;
};


export interface RegisterUserInput {
  email: string;
  password: string;
  role: "user";
  fullName: string;
  phoneNumber?: string;
}

export const registerUser = async ({
  email,
  password,
  role,
  fullName,
  phoneNumber,
}: RegisterUserInput): Promise<IUser> => {
  if (role !== "user") throw new Error("Forbidden role");

  const existing = await User.findOne({ email });
  if (existing) throw new Error("User already exists");

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({
    email,
    password: hashed,
    role,
    fullName,
    phoneNumber,
    isVerified: false,
  });

  await user.save();

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  await new VerificationToken({
    userId: user._id,
    token: hashedToken,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  }).save();

  const verifyUrl = `http://localhost:3000/auth/verify-email?token=${token}&id=${user._id}`;
  await sendVerificationEmail(user.email, user.fullName, verifyUrl);

  return user;
};