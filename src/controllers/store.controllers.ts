import { Request, Response } from 'express';
import * as storeService from '../services/store.services';
import { assertUser } from '../utils/assertUser';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError
} from '../utils/errors';
import { Notification } from "../models/notification.model"; // 🆕 for notifications
import  supabase  from "../utils/supabase"; // your initialized Supabase client
import { v4 as uuidv4 } from "uuid"; // for unique file names
const getPublicUrl = (fileName: string): string => {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET2}/${fileName}`;
};

export const createStore = async (req: Request, res: Response) => {
  try {
    assertUser(req);

    const {
      name,
      displayName,
      email,
      phone,
      streetAddress,
      city,
      state,
      postalCode,
      vatNumber,
      businessHours,
      attachments,
    } = req.body;

    if (!name?.trim()) {
      throw new BadRequestError("Store name is required");
    }

    let logoUrl: string | undefined = undefined;

    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `logo_${uuidv4()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET2!)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new Error("Failed to upload logo to storage: " + uploadError.message);
      }

      logoUrl = getPublicUrl(fileName);
    }

    const hasAddress =
      (streetAddress && streetAddress.trim()) ||
      (city && city.trim()) ||
      (state && state.trim()) ||
      (postalCode && postalCode.trim());

    const address = hasAddress
      ? {
          streetAddress: streetAddress?.trim(),
          city: city?.trim(),
          state: state?.trim(),
          postalCode: postalCode?.trim(),
        }
      : undefined;

    const existingStore = await storeService.findStoreByUserId(req.user.id);

    let store;

    if (existingStore) {
      // Update existing store
      store = await storeService.updateStore(existingStore.id, {
        name: name.trim(),
        displayName: displayName?.trim(),
        email: email?.trim(),
        phone: phone?.trim(),
        address,
        vatNumber: vatNumber?.trim(),
        businessHours: businessHours  ? (typeof businessHours === "string" ? JSON.parse(businessHours) : businessHours): undefined,
        logoUrl,
        attachments: Array.isArray(attachments) ? attachments : undefined,
      });

      if (!store) {
        throw new Error("Failed to update the store");
      }

      await Notification.create({
        userId: req.user.id,
        title: existingStore ? "Store Updated" : "Store Created",  // Add title here dynamically
        type: existingStore ? "STORE_UPDATED" : "STORE_CREATED",
        message: existingStore
          ? `Store "${store.name}" has been updated.`
          : `Store "${store.name}" has been created.`,
        meta: { storeId: store.id },
      });


      return res.status(200).json(store);
    }

    // Create new store
    store = await storeService.createStore({
      name: name.trim(),
      displayName: displayName?.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      address,
      vatNumber: vatNumber?.trim(),
      businessHours: businessHours ? JSON.parse(businessHours) : undefined,
      logoUrl,
      attachments: Array.isArray(attachments) ? attachments : undefined,
      createdBy: req.user.id,
    });

    if (!store) {
      throw new Error("Failed to create the store");
    }

    await Notification.create({
      userId: req.user.id,
      type: "STORE_CREATED",
      title: `Store Created: ${store.name}`,  // <-- add this line
      message: `Store "${store.name}" has been created.`,
      meta: { storeId: store.id },
    });

    res.status(201).json(store);
  } catch (err) {
    console.error("Error creating/updating store:", err);

    const message = err instanceof Error ? err.message : "Unexpected error";
    const statusCode =
      err instanceof BadRequestError ||
      err instanceof UnauthorizedError ||
      err instanceof ForbiddenError
        ? err.statusCode
        : 500;

    res.status(statusCode).json({ message: "Failed to create or update store", error: message });
  }
};




export const getStores = async (req: Request, res: Response) => {
  try {
    assertUser(req);

    const stores = await storeService.getStores(req.user.id);
    res.status(200).json(stores);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    const statusCode =
      err instanceof UnauthorizedError ||
      err instanceof ForbiddenError
        ? err.statusCode
        : 500;

    res.status(statusCode).json({ message: 'Failed to retrieve stores', error: message });
  }
};

export const updateStore = async (req: Request, res: Response) => {
  try {
    assertUser(req);

    const {
      name,
      displayName,
      email,
      phone,
      streetAddress,
      city,
      state,
      postalCode,
      vatNumber,
      businessHours,
      attachments,
    } = req.body;

    // Compose address if any field provided
    const hasAddress =
      (streetAddress && streetAddress.trim()) ||
      (city && city.trim()) ||
      (state && state.trim()) ||
      (postalCode && postalCode.trim());

    const address = hasAddress
      ? {
          streetAddress: streetAddress?.trim(),
          city: city?.trim(),
          state: state?.trim(),
          postalCode: postalCode?.trim(),
        }
      : undefined;

    // Prepare update object
    const updateData: any = {
      ...(name && { name: name.trim() }),
      ...(displayName && { displayName: displayName.trim() }),
      ...(email && { email: email.trim() }),
      ...(phone && { phone: phone.trim() }),
      ...(address && { address }),
      ...(vatNumber && { vatNumber: vatNumber.trim() }),
      ...(businessHours && { businessHours: JSON.parse(businessHours) }),
      ...(attachments && Array.isArray(attachments) ? { attachments } : {}),
    };

    // If you support logo upload, handle req.file here (like in createStore)
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `logo_${uuidv4()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET2!)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new Error("Failed to upload logo to storage: " + uploadError.message);
      }

      updateData.logoUrl = getPublicUrl(fileName);
    }

    const store = await storeService.updateStore(req.params.id, updateData);

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    await Notification.create({
      userId: req.user.id,
      type: "STORE_UPDATED",
      title: `Store Updated: ${store.name}`,  // <-- add this line
      message: `Store "${store.name}" was updated.`,
      forRole: "SuperAdmin",
      meta: { storeId: store.id },
    });

    res.status(200).json(store);
  } catch (err) {
    console.error("Error updating store:", err);

    const message = err instanceof Error ? err.message : "Unexpected error";
    res.status(500).json({ message: "Failed to update store", error: message });
  }
};


export const deleteStore = async (req: Request, res: Response) => {
  try {
    // Make sure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Only allow Admin or SuperAdmin
    if (!["superadmin", "admin"].includes(req.user.role.toLowerCase())) {
    return res.status(403).json({ message: "Not authorized to delete stores" });
}

    // Delete store
    await storeService.deleteStore(req.params.id);
    return res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return res
      .status(500)
      .json({ message: "Failed to delete store", error: message });
  }
};
