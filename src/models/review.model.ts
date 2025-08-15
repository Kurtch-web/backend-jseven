import { Schema, Types } from "mongoose";

export interface Review {
  customerId: Types.ObjectId;
  rating: number;
  comment?: string;
  isVerified?: boolean;
  helpfulCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const ReviewSchema = new Schema<Review>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
    isVerified: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);
