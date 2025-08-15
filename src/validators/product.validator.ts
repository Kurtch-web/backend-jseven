import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  slug: z.string().optional(),
  description: z.string().max(2000).trim(),
  shortDescription: z.string().max(500).trim().optional(),
  sku: z.string().toUpperCase().min(1).max(50),
  brand: z.string().max(100).trim(),
  category: z.string().min(1, "Category ID is required"),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().min(1),
        isMain: z.boolean().optional(),
      })
    )
    .optional(),
  image: z.string().url(),
  stock: z.number().min(0),
  lowStockThreshold: z.number().min(0).optional(),
  inStock: z.boolean().optional(),
  specifications: z
    .array(
      z.object({
        name: z.string().trim(),
        value: z.string().trim(),
      })
    )
    .optional(),
  tags: z.array(z.string().trim().toLowerCase()).optional(),
  seoTitle: z.string().max(60).trim().optional(),
  seoDescription: z.string().max(160).trim().optional(),
});
