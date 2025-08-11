import cors from "cors";
import { ForbiddenError } from "../utils/errors";

const whitelist = [
  "http://127.0.0.1:5500", 
  "http://localhost:5500",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://j-seven-coral.vercel.app",
];

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    console.log("Checking origin:", origin);
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new ForbiddenError("CORS policy: This origin is not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
  credentials: true, // ✅ Required for cookies
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);
