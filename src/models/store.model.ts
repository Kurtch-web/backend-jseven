import mongoose, { Schema, Document } from 'mongoose';

export interface Address {
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface BusinessHours {
  [day: string]: string; // e.g. "Monday": "9:00 AM - 6:00 PM"
}

export interface StoreInput {
  name: string;
  displayName?: string;
  email?: string;
  phone?: string;
  address?: Address;
  vatNumber?: string;
  logoUrl?: string;
  businessHours?: BusinessHours;
  attachments?: string[]; // URLs to files
  createdBy: string;
}

export interface StoreDocument extends StoreInput, Document {
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<Address>({
  streetAddress: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
}, { _id: false });

const StoreSchema = new Schema<StoreDocument>(
  {
    name: { type: String, required: true },
    displayName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: AddressSchema },
    vatNumber: { type: String },
    logoUrl: { type: String },
    businessHours: { type: Schema.Types.Mixed }, // flexible object
    attachments: [{ type: String }], // array of URLs
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const Store = mongoose.model<StoreDocument>('Store', StoreSchema);
