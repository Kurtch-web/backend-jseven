// models/notification.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  type: string; // e.g., "material", "order", etc.
  relatedId?: string; // e.g., Material ID
  forRole: string; // e.g., "SuperAdmin"
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  relatedId: { type: String },
  forRole: { type: String, default: "SuperAdmin" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
