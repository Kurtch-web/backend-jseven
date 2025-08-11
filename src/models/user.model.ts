// src/models/user.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  role: "user";
  fullName: string;
  phoneNumber?: string;
  isVerified: boolean;

  
  // Add these for reset password
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user"], default: "user" },
    fullName: { type: String, required: true },
    phoneNumber: { type: String },
    isVerified: { type: Boolean, default: false },


     // New fields for password reset token
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  {
    collection: "Users",
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", userSchema);