import { Request, Response, NextFunction } from "express";
import {Category} from "../models/category.model";
import { v4 as uuidv4 } from 'uuid';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import slugify from "slugify";
import supabase from '../utils/supabase';
import { Notification } from "../models/notification.model"; // 🆕 for notifications

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    // 1️⃣ Validate name
    if (!req.body.name?.trim()) {
      throw new BadRequestError("Category name is required");
    }

    // 2️⃣ Handle optional image upload
    let imageUrl: string | undefined;
    if (req.file) {
      const ext = req.file.originalname.match(/\.[0-9a-z]+$/i)?.[0] || ".jpg";
      const imageFileName = `category-${uuidv4()}${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET!)
        .upload(imageFileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload category image: ${uploadError.message}`);
      }

      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${imageFileName}`;
    }

    // 3️⃣ Generate slug
    const slug = slugify(req.body.name, { lower: true, strict: true });

    // 4️⃣ Create category (createdBy is always the logged-in user)
    const category = await Category.create({
      name: req.body.name.trim(),
      slug,
      description: req.body.description?.trim() || "",
      image: imageUrl || "",
      isActive: true,
      sortOrder: req.body.sortOrder || 0,
      parentCategory: req.body.parentCategory || null,
      createdBy: req.user!.id, // ✅ taken from session
    });

    // 5️⃣ Notify SuperAdmin
    await Notification.create({
      title: "New Category Created",
      message: `${req.user?.name || req.user?.email || "An admin"} created a new category: ${category.name}`,
      type: "category",
      relatedId: category._id.toString(),
      forRole: "SuperAdmin",
      read: false,
    });

    // 6️⃣ Send response
    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (err) {
    next(err);
  }
}



// READ ALL
export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await Category.find()
      .populate("createdBy", "name email") // fetch name & email of creator
      .lean();

    res.json(categories);
  } catch (err) {
    next(err);
  }
}


// READ SINGLE
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Error fetching category", error });
  }
};

// PUT /categories/:id
export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body; // <-- use isActive

    if (!name && isActive === undefined) {
      throw new BadRequestError("At least one of 'name' or 'isActive' must be provided");
    }

    const updateData: Partial<{ name: string; isActive: boolean }> = {};
    if (name) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive; // <-- update correct field

    const category = await Category.findByIdAndUpdate(id, updateData, { new: true });

    if (!category) throw new NotFoundError("Category not found");

    res.json(category);
  } catch (err) {
    next(err);
  }
}

// DELETE /categories/:id
export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) throw new NotFoundError("Category not found");
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    next(err);
  }
}
