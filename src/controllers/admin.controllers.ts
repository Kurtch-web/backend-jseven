import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/admin.model';
import { adminLoginSchema, adminRegisterSchema } from '../validators/auth.validator';
import { signJWT } from "../utils/jwt";
import { v4 as uuidv4 } from 'uuid';

import supabase from '../utils/supabase';
import { jwtMiddleware } from '../middlewares/jwt.middleware';
import { requireRole } from '../middlewares/auth.middleware';
import { Store } from '../models/store.model';
import { Notification } from '../models/notification.model';
const getPublicUrl = (fileName: string): string => {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${fileName}`;
};

export const loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const id = admin._id.toString();
    const token = signJWT({ id, role: admin.role });

    // Set token in an httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  // true in prod
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // handle cross-site in prod
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
      path: "/", // cookie available throughout your domain
    });

    // Send success response without token
    res.json({
      message: "Logged in successfully",
      admin: {
        id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const registerAdmin = async (req: Request, res: Response) => {
  try {
    // ✅ Parse and validate body using Zod
    const parsed = adminRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      affiliation,
      governmentIdType,
      governmentIdNumber,
    } = parsed.data;

    // ✅ Check files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const idFile = files?.["idDocument"]?.[0];
    const selfieFile = files?.["selfieWithId"]?.[0];

    if (!idFile) {
      return res
        .status(400)
        .json({ message: "Government ID document is required" });
    }

    // ✅ Upload ID Document
    const idFileName = `id-${uuidv4()}.jpg`;
    const { error: idUploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(idFileName, idFile.buffer, {
        contentType: idFile.mimetype,
      });

    if (idUploadError) {
      return res.status(500).json({
        message: "Failed to upload ID document",
        error: idUploadError.message,
      });
    }
    const idDocumentUrl = getPublicUrl(idFileName);

    // ✅ Optional selfie upload
    let selfieWithIdUrl = "";
    if (selfieFile) {
      const selfieFileName = `selfie-${uuidv4()}.jpg`;
      const { error: selfieUploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET!)
        .upload(selfieFileName, selfieFile.buffer, {
          contentType: selfieFile.mimetype,
        });

      if (selfieUploadError) {
        return res.status(500).json({
          message: "Failed to upload selfie",
          error: selfieUploadError.message,
        });
      }
      selfieWithIdUrl = getPublicUrl(selfieFileName);
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Save admin to DB
    const admin = await Admin.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: "Admin",
      affiliation,
      governmentIdType,
      governmentIdNumber,
      idDocumentUrl,
      selfieWithIdUrl,
      isApproved: false,
      isIdentityVerified: false,
    });

    // ✅ Create notification for SuperAdmin
    await Notification.create({
      title: "New Admin Registration",
      message: `${firstName} ${lastName} has registered as an admin and is awaiting approval.`,
      type: "admin_registration",
      relatedId: admin._id.toString(),
      forRole: "SuperAdmin",
      read: false,
    });

    return res.status(201).json({
      message: "Admin registration successful. Awaiting approval.",
      adminId: admin._id,
    });
  } catch (err: any) {
    console.error("[Admin Registration Error]", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};


export const getAllAdmins = [
  jwtMiddleware,
  requireRole("SuperAdmin"),
  async (_req: Request, res: Response) => {
    try {
      // Fetch all admins without the password field
      const admins = await Admin.find({}, "-password").lean();

      // Map admins to include store info
      const adminsWithStores = await Promise.all(
        admins.map(async (admin) => {
          const store = await Store.findOne({ createdBy: admin._id.toString() }).lean();
          return {
            ...admin,
            hasStore: !!store,
            store: store
              ? {
                  id: store._id,
                  name: store.name,
                  //location: store.location || "No location set",
                }
              : null,
          };
        })
      );

      res.status(200).json({ admins: adminsWithStores });
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  },
];