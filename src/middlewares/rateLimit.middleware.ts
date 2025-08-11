//middlewares/rateLimit.middleware.ts
import { Request, Response, NextFunction } from "express";

const requestLog = new Map<string, { timestamps: number[]; banUntil?: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const MAX_REQUESTS = 5;
const BAN_TIME_MS = 60 * 60 * 1000; // 1 hour ban after max requests

export const apiLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || "unknown";
  const now = Date.now();

  // Initialize or fetch record for IP
  const record = requestLog.get(ip) || { timestamps: [], banUntil: undefined };

  // If IP is currently banned
  if (record.banUntil && record.banUntil > now) {
    const remaining = Math.ceil((record.banUntil - now) / 60000);
    console.log(`⛔ Banned IP tried to access: ${ip} (${remaining} minutes left)`);
    return res.status(429).json({
      message: `Too many requests. IP temporarily banned. Try again in ${remaining} minutes.`,
    });
  }


  record.timestamps = record.timestamps.filter(ts => now - ts <= WINDOW_MS);


  record.timestamps.push(now);


  if (record.timestamps.length > MAX_REQUESTS) {
    record.banUntil = now + BAN_TIME_MS;
    requestLog.set(ip, record);
    console.log(`🔒 IP ${ip} has been banned until ${new Date(record.banUntil).toISOString()}`);
    return res.status(429).json({
      message: `Too many requests. IP temporarily banned for 1 hour.`,
    });
  }

  // Save updated state
  requestLog.set(ip, record);

  next();
};
