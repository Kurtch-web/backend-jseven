import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import { getEnv } from "../config/env";
import { UnauthorizedError } from "./errors";

const secret = getEnv.JWT_SECRET;
const expiresIn = getEnv.JWT_EXPIRES_IN as `${number}${"ms" | "s" | "m" | "h" | "d" | "w" | "y"}`;

/**
 * Sign a JWT with payload.
 */
export const signJWT = (payload: string | object | Buffer): string => {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, secret, options);
};

/**
 * Verify a JWT and return the decoded payload.
 */
export const verifyJWT = <T extends JwtPayload = any>(token: string): T => {
  try {
    return jwt.verify(token, secret) as T;
  } catch (err: any) {
    throw new UnauthorizedError(err.message || "Invalid token");
  }
};
