import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: 'Admin';
  affiliation: string;
  governmentIdType: string;
  governmentIdNumber: string;
  idDocumentUrl: string;
  selfieWithIdUrl?: string;
  isIdentityVerified: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;

  // 👇 Added for password reset
  resetPasswordCode?: string;
  resetPasswordExpires?: Date;

  fullName: string; // <- virtual
}

const AdminSchema = new Schema<IAdmin>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true, select: false }, // hide by default
    role: { type: String, enum: ['Admin'], default: 'Admin' },
    affiliation: { type: String, required: true },
    governmentIdType: { type: String, required: true },
    governmentIdNumber: { type: String, required: true },
    idDocumentUrl: { type: String, required: true },
    selfieWithIdUrl: { type: String },
    isIdentityVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },

    // 👇 New fields for forgot/reset password
    resetPasswordCode: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false }
  },
  { timestamps: true }
);

// ✅ Virtual field for full name
AdminSchema.virtual("fullName").get(function (this: IAdmin) {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON and Object outputs
AdminSchema.set("toJSON", { virtuals: true });
AdminSchema.set("toObject", { virtuals: true });

export const Admin = mongoose.model<IAdmin>("Admin", AdminSchema);
