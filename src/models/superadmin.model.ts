import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISuperAdmin extends Document {
  _id: string;
  email: string;
  password: string;
  role: 'SuperAdmin';
  createdAt?: Date;
  updatedAt?: Date;
}

const SuperAdminSchema: Schema<ISuperAdmin> = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: 'SuperAdmin' },
  },
  { timestamps: true }
);

// Export the Mongoose model, specifying a hidden collection name for security
export const SuperAdmin: Model<ISuperAdmin> = mongoose.model<ISuperAdmin>(
  'SuperAdmin',
  SuperAdminSchema,
  '__sys_superadmins' // Hidden/obscure collection name
);
