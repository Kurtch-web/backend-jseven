import { Request, Response, NextFunction } from "express";
import * as materialService from '../services/material.services';
import { assertUser } from '../utils/assertUser';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { createMaterialSchema } from '../validators/material.validator';
import { updateMaterialSchema } from '../validators/updatematerial.validator';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../utils/supabase';
import { Material } from '../models/material.model';
import { Notification } from "../models/notification.model"; // 🆕 for notifications
import mongoose, { Types } from "mongoose";


export async function createMaterialController(req: Request, res: Response, next: NextFunction) {
  try {
    // 1️⃣ Ensure an image file is uploaded
    if (!req.file) {
      throw new BadRequestError("Material image file is required");
    }

    // 2️⃣ Validate form data
    const parsed = createMaterialSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError("Invalid input data");
    }
    const { name, quantity, unit, unitCost, storeId } = parsed.data; // 🆕 added unitCost

    // 3️⃣ Create unique filename for Supabase
    const ext = req.file.originalname.match(/\.[0-9a-z]+$/i)?.[0] || ".jpg";
    const imageFileName = `material-${uuidv4()}${ext}`;

    // 4️⃣ Upload image to Supabase
    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(imageFileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload material image: ${uploadError.message}`);
    }

    // 5️⃣ Generate public URL
    const imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${imageFileName}`;

    // 6️⃣ Save material with PENDING status
    const material = await Material.create({
      name,
      quantity,
      unit,
      unitCost, // 🆕 save unitCost
      storeId,
      createdBy: req.user?.id,
      imageUrl,
      status: "pending" // 🆕 waiting for SuperAdmin approval
    });

    // 7️⃣ Create notification for SuperAdmin
    await Notification.create({
      title: "New Material Awaiting Approval",
      message: `${req.user?.name || "A user"} created a new material: ${name}`,
      type: "material",
      relatedId: material._id.toString(),
      forRole: "SuperAdmin",
      read: false
    });

    // 8️⃣ Response
    res.status(201).json({
      message: "Material submitted for approval. Waiting for SuperAdmin review.",
      material
    });
  } catch (err) {
    next(err);
  }
}


// Example: controllers/materialController.ts
export const getMaterials = async (req: Request, res: Response) => {
  try {
    const storeIdString = req.query.storeId?.toString();
    if (!storeIdString) throw new BadRequestError('Missing storeId in query');

    const storeId = new mongoose.Types.ObjectId(storeIdString);

    const materials = await Material.find({ storeId });
    return res.status(200).json({ message: 'Materials retrieved successfully', count: materials.length, materials });
  } catch (err) {
    // error handling
  }
};


export async function updateMaterial(req: Request, res: Response, next: NextFunction) {
  try {
    const materialId = req.params.id;
    if (!materialId) throw new BadRequestError("Material ID is required");

    // 1️⃣ Validate form data (same schema as create or a separate update schema)
    const parsed = createMaterialSchema.safeParse(req.body); 
    if (!parsed.success) {
      throw new BadRequestError("Invalid input data");
    }
    const { name, quantity, unit, unitCost, storeId } = parsed.data;

    // 2️⃣ Find existing material
    const material = await Material.findById(materialId);
    if (!material) throw new NotFoundError("Material not found");

    let imageUrl = material.imageUrl;

    // 3️⃣ If new image file uploaded, upload to Supabase and update imageUrl
    if (req.file) {
      const ext = req.file.originalname.match(/\.[0-9a-z]+$/i)?.[0] || ".jpg";
      const imageFileName = `material-${uuidv4()}${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET!)
        .upload(imageFileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true, // Allow overwrite on update
        });

      if (uploadError) {
        throw new Error(`Failed to upload material image: ${uploadError.message}`);
      }

      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${imageFileName}`;
    }

    // 4️⃣ Update material fields and reset status to pending for re-approval
    material.name = name;
    material.quantity = quantity;
    material.unit = unit;
    material.unitCost = unitCost;
    material.storeId = new Types.ObjectId(storeId);
    material.imageUrl = imageUrl;
    material.status = "pending";
    material.updatedBy = req.user?.id ? new Types.ObjectId(req.user.id) : undefined;
    material.updatedAt = new Date();

    await material.save();

    // 5️⃣ Create notification for SuperAdmin about update
    await Notification.create({
      title: "Material Updated - Awaiting Approval",
      message: `${req.user?.name || "A user"} updated material: ${name}`,
      type: "material",
      relatedId: material._id.toString(),
      forRole: "SuperAdmin",
      read: false,
    });

    // 6️⃣ Response
    res.status(200).json({
      message: "Material updated and submitted for approval.",
      material,
    });
  } catch (err) {
    next(err);
  }
}


export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    await materialService.deleteMaterial(req.params.id);
    res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    res.status(500).json({ message: 'Failed to delete material', error: message });
  }
};

// ✅ Get all materials (SuperAdmin only)
export const getAllMaterialsForSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== "SuperAdmin") {
      return res.status(403).json({
        message: "Access denied. SuperAdmin role required",
      });
    }

    const materials = await Material.find({})
      .populate("storeId", "name location")    // Get store name & location
      .populate("createdBy", "fullName email") // Get creator name & email
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      message: "Materials retrieved successfully",
      count: materials.length,
      materials,
    });
  } catch (err) {
    next(err);
  }
};



// 2️⃣ Update material status/details (SuperAdmin only)
export const updateMaterialBySuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is SuperAdmin
    if (req.user?.role !== 'SuperAdmin') {
      throw new BadRequestError("Access denied. SuperAdmin role required");
    }

    const { id } = req.params;
    const updates = req.body;

    // Find the material
    const material = await Material.findById(id);
    if (!material) {
      throw new BadRequestError("Material not found");
    }

    // Handle image upload if provided
    let imageUrl = material.imageUrl;
    if (req.file) {
      // Create unique filename for Supabase
      const ext = req.file.originalname.match(/\.[0-9a-z]+$/i)?.[0] || ".jpg";
      const imageFileName = `material-${uuidv4()}${ext}`;

      // Upload new image to Supabase
      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET!)
        .upload(imageFileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload material image: ${uploadError.message}`);
      }

      // Generate new public URL
      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${imageFileName}`;

      // Optional: Delete old image from Supabase
      if (material.imageUrl) {
        const oldFileName = material.imageUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from(process.env.SUPABASE_BUCKET!)
            .remove([oldFileName]);
        }
      }
    }

    // Update the material
    const updatedMaterial = await Material.findByIdAndUpdate(
      id,
      {
        ...updates,
        imageUrl,
        updatedAt: new Date(),
        lastModifiedBy: req.user?.id
      },
      { new: true, runValidators: true }
    ).populate('storeId', 'name location')
     .populate('createdBy', 'name email');

    // If status changed from pending to approved/rejected, create notification
    if (updates.status && material.status !== updates.status) {
      let notificationMessage = '';
      if (updates.status === 'approved') {
        notificationMessage = `Your material "${material.name}" has been approved by SuperAdmin`;
      } else if (updates.status === 'rejected') {
        notificationMessage = `Your material "${material.name}" has been rejected by SuperAdmin`;
      }

      if (notificationMessage) {
        await Notification.create({
          title: `Material ${updates.status.charAt(0).toUpperCase() + updates.status.slice(1)}`,
          message: notificationMessage,
          type: "material",
          relatedId: material._id.toString(),
          userId: material.createdBy,
          read: false
        });
      }
    }

    res.status(200).json({
      message: "Material updated successfully",
      material: updatedMaterial
    });
  } catch (err) {
    next(err);
  }
};

// 3️⃣ Get material statistics (SuperAdmin only)
export const getMaterialStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is SuperAdmin
    if (req.user?.role !== 'SuperAdmin') {
      throw new BadRequestError("Access denied. SuperAdmin role required");
    }

    const stats = await Material.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$quantity", "$unitCost"] } }
        }
      }
    ]);

    const totalMaterials = await Material.countDocuments();
    const storeCount = await Material.distinct('storeId').then(stores => stores.length);

    res.status(200).json({
      message: "Material statistics retrieved successfully",
      totalMaterials,
      storesWithMaterials: storeCount,
      statusBreakdown: stats
    });
  } catch (err) {
    next(err);
  }
};

// 4️⃣ Bulk approve/reject materials (SuperAdmin only)
export const bulkUpdateMaterialStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is SuperAdmin
    if (req.user?.role !== 'SuperAdmin') {
      throw new BadRequestError("Access denied. SuperAdmin role required");
    }

    const { materialIds, status } = req.body;

    if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
      throw new BadRequestError("Material IDs array is required");
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      throw new BadRequestError("Invalid status. Must be 'approved', 'rejected', or 'pending'");
    }

    // Update materials
    const result = await Material.updateMany(
      { _id: { $in: materialIds } },
      { 
        status,
        updatedAt: new Date(),
        lastModifiedBy: req.user?.id
      }
    );

    // Create notifications for affected users
    const materials = await Material.find({ _id: { $in: materialIds } });
    
    for (const material of materials) {
      let notificationMessage = '';
      if (status === 'approved') {
        notificationMessage = `Your material "${material.name}" has been approved by SuperAdmin`;
      } else if (status === 'rejected') {
        notificationMessage = `Your material "${material.name}" has been rejected by SuperAdmin`;
      }

      if (notificationMessage) {
        await Notification.create({
          title: `Material ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: notificationMessage,
          type: "material",
          relatedId: material._id.toString(),
          userId: material.createdBy,
          read: false
        });
      }
    }

    res.status(200).json({
      message: `Successfully updated ${result.modifiedCount} materials to ${status}`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
};