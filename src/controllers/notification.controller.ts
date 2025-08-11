// controllers/notification.controller.ts
import { Request, Response } from "express";
import { Notification } from "../models/notification.model";

export async function getNotifications(req: Request, res: Response) {
  const notifications = await Notification.find({ forRole: "SuperAdmin" })
    .sort({ createdAt: -1 });
  res.json(notifications);
}
