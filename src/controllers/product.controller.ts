// src/controllers/product.controller.ts
import { Request, Response, NextFunction } from "express";
import { Product } from "../models/product.model";
import { BadRequestError, NotFoundError } from "../utils/errors";
import supabase from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { Notification } from "../models/notification.model";
import slugify from "slugify";

// Utility to sanitize request body for Product fields
function sanitizeProductBody(body: any) {
  const allowedFields = [
    "name", "description", "shortDescription", "sku", "brand", "category",
    "price", "originalPrice", "discount", "stock", "lowStockThreshold",
    "inStock", "specifications", "reviews", "rating", "reviewCount",
    "isActive", "isFeatured", "weight", "dimensions", "tags",
    "seoTitle", "seoDescription", "viewCount", "salesCount",
    "packageQuantity", "quality",
  ];
  return Object.keys(body)
    .filter((key) => allowedFields.includes(key))
    .reduce((acc: any, key) => {
      acc[key] = body[key];
      return acc;
    }, {});
}

// Utility: convert string/number to number if valid
const parseNumber = (val: any) => (val !== "" && val != null ? Number(val) : undefined);

export async function createProductController(req: Request, res: Response, next: NextFunction) {
  try {
    // --- Main image required ---
    if (!req.files || !req.files['image']) {
      throw new BadRequestError("Main product image file is required");
    }
    const mainImageFile = Array.isArray(req.files['image']) ? req.files['image'][0] : req.files['image'];

    // --- Required fields ---
    const { name, description, brand, category, price, stock, sku } = req.body;
    if (!name?.trim() || !description?.trim() || !brand?.trim() || !category || price == null || stock == null) {
      throw new BadRequestError("Missing required product fields");
    }

    // --- Upload main image ---
    const mainExt = mainImageFile.originalname.match(/\.[0-9a-z]+$/i)?.[0] || ".jpg";
    const mainFileName = `product-${uuidv4()}${mainExt}`;
    const { error: mainUploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(mainFileName, mainImageFile.buffer, { contentType: mainImageFile.mimetype, upsert: false });
    if (mainUploadError) throw new Error(`Failed to upload main image: ${mainUploadError.message}`);
    const mainImageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${mainFileName}`;

    // --- Gallery images (optional) ---
    let galleryImages: { url: string; alt: string; isMain?: boolean }[] = [];
    if (req.files['images']) {
      const galleryFiles = Array.isArray(req.files['images']) ? req.files['images'] : [req.files['images']];
      for (let i = 0; i < galleryFiles.length; i++) {
        const file = galleryFiles[i];
        const ext = file.originalname.match(/\.[0-9a-z]+$/i)?.[0] || ".jpg";
        const fileName = `product-gallery-${uuidv4()}${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(process.env.SUPABASE_BUCKET!)
          .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false });
        if (uploadError) continue; // skip failed gallery images
        const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${fileName}`;
        galleryImages.push({
          url,
          alt: req.body[`alt-${i}`] || "",
          isMain: req.body[`isMain-${i}`] === "true" || false,
        });
      }
    }

    // --- Specifications ---
    let specifications: { key: string; value: string }[] = [];
    if (req.body.specifications) {
      specifications = typeof req.body.specifications === "string"
        ? JSON.parse(req.body.specifications)
        : req.body.specifications;
    }

    // --- Tags ---
    let tags: string[] = [];
    if (req.body.tags) {
      tags = typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : req.body.tags;
    }

// --- Dimensions validation ---
let dimensions: string | undefined;
if (req.body.dimensions) {
  if (typeof req.body.dimensions === "string") {
    const dimStr = req.body.dimensions.trim(); // e.g., "60x40x25" or "60x40x25 cm"
    const [sizePart, unitPart] = dimStr.split(" "); // separate size and optional unit
    const dimRegex = /^\d+(\.\d+)?x\d+(\.\d+)?x\d+(\.\d+)?$/;
    if (!dimRegex.test(sizePart)) {
      throw new BadRequestError("Dimensions must be in the format LengthxWidthxHeight, e.g., 60x40x25");
    }
    const unit = unitPart && ["cm", "in", "mm"].includes(unitPart) ? unitPart : "cm";
    dimensions = `${sizePart} ${unit}`;
  } else if (typeof req.body.dimensions === "object") {
    const { size, unit } = req.body.dimensions;
    if (!size || !unit) throw new BadRequestError("Dimensions must include size and unit");
    const dimRegex = /^\d+(\.\d+)?x\d+(\.\d+)?x\d+(\.\d+)?$/;
    if (!dimRegex.test(size.trim())) {
      throw new BadRequestError("Dimensions size must be in the format LengthxWidthxHeight, e.g., 60x40x25");
    }
    if (!["cm", "in", "mm"].includes(unit)) {
      throw new BadRequestError("Dimensions unit must be one of: cm, in, mm");
    }
    dimensions = `${size.trim()} ${unit}`;
  }
}
    // --- Slug (unique) ---
    let slug = slugify(name, { lower: true, strict: true });
    let slugExists = await Product.findOne({ slug });
    let counter = 1;
    while (slugExists) {
      slug = `${slug}-${counter}`;
      slugExists = await Product.findOne({ slug });
      counter++;
    }

    // --- SKU (auto-generate & ensure unique) ---
    let baseSKU = sku
      ? sku.trim().toUpperCase()
      : name.trim().toUpperCase().replace(/\s+/g, "-").substring(0, 20);
    let uniqueSKU = baseSKU;
    counter = 1;
    while (await Product.findOne({ sku: uniqueSKU })) {
      uniqueSKU = `${baseSKU}-${counter}`;
      counter++;
    }

    // --- Create product ---
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      shortDescription: req.body.shortDescription?.trim(),
      sku: uniqueSKU,
      brand: brand.trim(),
      category,
      price: parseNumber(price),
      originalPrice: parseNumber(req.body.originalPrice),
      discount: parseNumber(req.body.discount),
      stock: parseNumber(stock),
      packageQuantity: req.body.packageQuantity?.trim(), 
      quality: req.body.quality || "standard",
      lowStockThreshold: parseNumber(req.body.lowStockThreshold),
      inStock: req.body.inStock !== undefined ? JSON.parse(req.body.inStock) : true,
      image: mainImageUrl,
      images: galleryImages,
      specifications,
      tags,
      rating: parseNumber(req.body.rating) || 0,
      reviewCount: parseNumber(req.body.reviewCount) || 0,
      isActive: req.body.isActive !== undefined ? JSON.parse(req.body.isActive) : true,
      isFeatured: req.body.isFeatured !== undefined ? JSON.parse(req.body.isFeatured) : false,
      weight: parseNumber(req.body.weight),
      dimensions,
      seoTitle: req.body.seoTitle?.trim(),
      seoDescription: req.body.seoDescription?.trim(),
      viewCount: parseNumber(req.body.viewCount) || 0,
      salesCount: parseNumber(req.body.salesCount) || 0,
      slug,
      createdBy: req.body.createdBy || req.user?.id,
    });

    // --- Notify SuperAdmin ---
    await Notification.create({
      title: "New Product Added",
      message: `${req.user?.name || "A user"} created a new product: ${name}`,
      type: "product",
      relatedId: product._id.toString(),
      forRole: "SuperAdmin",
      read: false,
    });

    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    next(err);
  }
}


// GET ALL PRODUCTS
export const getAllProductsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Populate both `createdBy` and `category` fields
    const products = await Product.find()
      .populate("createdBy", "fullName email") // populate Admin
      .populate("category", "name _id")        // populate Category
      .lean();

    res.status(200).json({ data: products });
  } catch (err) {
    next(err);
  }
};
// GET SINGLE PRODUCT
export async function getProductByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      throw new NotFoundError("Product not found");
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// UPDATE PRODUCT
export async function updateProductController(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Optional: Validate name length
    if (req.body.name && req.body.name.trim().length < 2) {
      throw new BadRequestError("Product name must be at least 2 characters long");
    }

    // Normalize specifications (support "name" or "key")
    if (req.body.specifications) {
      req.body.specifications = req.body.specifications.map((s: any) => ({
        key: s.key ?? s.name,
        value: s.value,
      }));
    }

    // Upload new image if provided
    if (req.file) {
      const ext = req.file.originalname.match(/\.[0-9a-z]+$/i)?.[0] || ".jpg";
      const imageFileName = `product-${uuidv4()}${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET!)
        .upload(imageFileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });
      if (uploadError) throw new Error(`Failed to upload new product image: ${uploadError.message}`);
      product.image = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${imageFileName}`;
    }

    // Apply updates
    Object.assign(product, sanitizeProductBody(req.body));

    // Re-generate slug if name is updated
    if (req.body.name) {
      product.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    await product.save();

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    next(err);
  }
}


// DELETE PRODUCT (hard delete)
export async function deleteProductController(req: Request, res: Response, next: NextFunction) {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      throw new NotFoundError("Product not found");
    }

    res.json({
      message: "Product deleted successfully"
    });
  } catch (err) {
    next(err);
  }
}

