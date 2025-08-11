import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Environment variable ${key} is missing`);
  }
  return value;
}

export const getEnv = {
  MONGO_URI: getEnvVariable("MONGO_URI"),
  PORT: process.env.PORT || "3000",
  JWT_SECRET: getEnvVariable("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  EMAIL_FROM: getEnvVariable("EMAIL_FROM"),
  EMAIL_PASSWORD: getEnvVariable("EMAIL_PASSWORD"),
};
