// src/routes/debug.routes.ts
import { Router, Request, Response } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/collections", async (req: Request, res: Response) => {
  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(500).json({ error: "MongoDB is not connected" });
    }

    const collections = await db.listCollections().toArray();
    res.json({
      db: mongoose.connection.name,
      collections: collections.map((c) => c.name),
    });
  } catch (err) {
    console.error("❌ Error listing collections:", err);
    res.status(500).json({ error: "Could not list collections", details: err });
  }
});

export default router;
