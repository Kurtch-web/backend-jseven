import { Document } from "mongoose";

// Only for regular users
export interface IUser extends Document {
  email: string;
  password: string;
  role: "user"; // Fixed role
  fullName: string;
  phoneNumber?: string;
  // Add more user-specific fields here
}
