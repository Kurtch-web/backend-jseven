import { Document } from "mongoose";

export interface IAdmin extends Document {
  _id: any;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: "Admin" | "SuperAdmin";
  affiliation: string;
  governmentIdType: string;
  governmentIdNumber: string;
  idDocumentUrl: string;
  selfieWithIdUrl?: string;
  isIdentityVerified: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}
