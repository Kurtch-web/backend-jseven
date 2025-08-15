import mongoose, { Schema, Document, Types } from "mongoose";
import { Specification, SpecificationSchema } from "./specification.model";
import { Review, ReviewSchema } from "./review.model";

export interface ProductInput {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  sku: string;
  brand: string;
  category: Types.ObjectId;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: { url: string; alt: string; isMain?: boolean }[];
  image: string;
  stock: number;
  createdBy: Types.ObjectId; // new field
  lowStockThreshold?: number;
  inStock?: boolean;
  specifications?: Specification[];
  reviews?: Review[];
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: "cm" | "in" | "mm";
  };
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  viewCount?: number;
  salesCount?: number;
}

export interface ProductDocument extends ProductInput, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 200, text: true },
    slug: { type: String, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, maxlength: 2000, trim: true, text: true },
    shortDescription: { type: String, trim: true, maxlength: 500 },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    brand: { type: String, required: true, maxlength: 100, trim: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, required: true },
        isMain: { type: Boolean, default: false },
      },
    ],
    image: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    inStock: { type: Boolean, default: true, index: true },
    specifications: [SpecificationSchema],
    reviews: [ReviewSchema],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    weight: { type: Number, min: 0 },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: { type: String, enum: ["cm", "in", "mm"], default: "cm" },
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    seoTitle: { type: String, maxlength: 60, trim: true },
    seoDescription: { type: String, maxlength: 160, trim: true },
    viewCount: { type: Number, default: 0, min: 0 },
    salesCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const Product = mongoose.model<ProductDocument>("Product", ProductSchema);
