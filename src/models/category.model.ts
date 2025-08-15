import mongoose, { Schema, Document } from "mongoose";

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
  parentCategory?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; // 🆕 Add this
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    parentCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true }, // 🆕 reference to Admin
  },
  { timestamps: true }
);

export const Category = mongoose.model<CategoryDocument>("Category", CategorySchema);
