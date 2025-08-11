//utils/hash.ts
import * as bcrypt from "bcrypt";


const SALT_ROUNDS = 10;

export const hashPassword = async (password: string) =>
  await bcrypt.hash(password, SALT_ROUNDS);

export const compareHash = async (input: string, hash: string) =>
  await bcrypt.compare(input, hash);
