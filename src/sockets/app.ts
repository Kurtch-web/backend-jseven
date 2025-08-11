// app.ts
import express from "express";
import helmet from "helmet";
import { corsMiddleware } from "../config/server";
import authRoutes from "../routes/auth.routes";
import admin from "../routes/admin.routes";
import debugRoutes from "../routes/debug.routes";
import storeRoutes from '../routes/store.routes';
import materialRoutes from '../routes/material.routes';
import { Request, Response, NextFunction } from "express";
import cookieParser from 'cookie-parser';
const app = express();

const FRONTEND_ORIGINS = process.env.FRONTEND_ORIGINS
  ? process.env.FRONTEND_ORIGINS.split(",") // comma-separated list in .env
  : ["http://127.0.0.1:5500", "http://localhost:5500"]; // default dev frontend origins

const BACKEND_ORIGINS = process.env.BACKEND_ORIGINS
  ? process.env.BACKEND_ORIGINS.split(",")
  : ["http://localhost:3000"]; // default dev backend origin

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", ...FRONTEND_ORIGINS],
        styleSrc: ["'self'", "https://fonts.googleapis.com", ...FRONTEND_ORIGINS],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", ...BACKEND_ORIGINS, ...FRONTEND_ORIGINS],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.use(express.json());
app.use(corsMiddleware);
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/db", debugRoutes);
app.use('/stores', storeRoutes);
app.use('/materials', materialRoutes);
app.use('/admin', admin)
app.post('/logout', (req, res) => {
  res.cookie('token', '', {
  httpOnly: true,
  expires: new Date(0),
  path: '/',  // almost always needed
});
  res.status(200).json({ message: 'Logged out' });
});

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" });
});

export default app;
