import mongoose, { Schema, Document, Types } from 'mongoose';

export interface MaterialInput {
  name: string;
  quantity: number;
  unit: string;
  unitCost: number; 
  storeId: Types.ObjectId; // references Store _id
  createdBy: Types.ObjectId; // references Admin _id
  updatedBy?: Types.ObjectId; // references Admin _id, optional
  imageUrl: string; 
  status?: 'pending' | 'approved' | 'rejected';
}

export interface MaterialDocument extends MaterialInput, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<MaterialDocument>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    unitCost: { type: Number, required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: false }, // add here
    imageUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);
export const Material = mongoose.model<MaterialDocument>('Material', MaterialSchema);
