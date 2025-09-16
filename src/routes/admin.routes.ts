// routes/admin.routes.ts
import express from 'express';
import multer from 'multer';
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "../middlewares/auth.middleware";
import { jwtMiddleware } from "../middlewares/jwt.middleware"; // your new middleware
import { Admin } from "../models/admin.model";

const router = express.Router();

// Multer setup (store file in memory buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use service role for upload
);

// 📌 Public upload route (no token required)
router.post(
  "/upload-pdf",
  upload.single("file"), // multer handles `file`
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { businessName } = req.body;
      if (!businessName) {
        return res.status(400).json({ message: "Business name is required" });
      }

      const file = req.file;

      // Format date and time (YYYY-MM-DD_HH-MM-SS)
      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace("T", "_")
        .replace(/[:.]/g, "-")
        .split("Z")[0]; // remove trailing Z

      // Construct filename
      const fileExt = file.originalname.split(".").pop();
      const fileName = `${businessName}-${timestamp}.${fileExt}`;

      // Upload to Supabase bucket
      const { error } = await supabase.storage
        .from("pdfquotation")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype || "application/pdf",
          upsert: true,
        });

      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to upload to Supabase" });
      }

      // Get public URL
      const { data } = supabase.storage.from("pdfquotation").getPublicUrl(fileName);

      // Metadata
      const metadata = {
        businessName,
        uploadedAt: now,
        url: data.publicUrl,
      };

      res.status(200).json({
        message: "PDF uploaded successfully",
        metadata,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error uploading file" });
    }
  }
);



// 📌 List PDFs
router.get("/list-pdfs", async (_req, res) => {
  try {
    const { data, error } = await supabase.storage
      .from("pdfquotation") // ✅ use pdf bucket
      .list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to list files" });
    }

    // Attach public URLs
    const files = data.map((file) => ({
      name: file.name,
      createdAt: file.created_at,
      url: supabase.storage.from("pdfquotation").getPublicUrl(file.name).data.publicUrl,
    }));

    res.status(200).json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error listing files" });
  }
});

// 📌 Delete PDF
router.delete("/delete-pdf/:fileName", async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({ message: "No file name provided" });
    }

    const { error } = await supabase.storage
      .from("pdfquotation") // ✅ use pdf bucket
      .remove([fileName]);

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to delete file" });
    }

    res.status(200).json({ message: `File ${fileName} deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error deleting file" });
  }
});


router.get(
  "/all",
  jwtMiddleware,          // <-- Protect this route with JWT middleware
  requireRole("SuperAdmin"), // only SuperAdmin can access this
  async (_req, res) => {
    try {
      const admins = await Admin.find({}, "-password");
      res.status(200).json({ admins });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  }
);

// Update admin flags (verify or approve)
router.patch(
  '/:id',
  jwtMiddleware,
  requireRole('SuperAdmin'),
  async (req, res) => {
    const { id } = req.params;
    const { isIdentityVerified, isApproved } = req.body;

    try {
      const admin = await Admin.findById(id);
      if (!admin) return res.status(404).json({ message: 'Admin not found' });

      // Cast role to union so TS knows it can be 'Admin' or 'SuperAdmin'
      const role = admin.role as 'Admin' | 'SuperAdmin';

      if (role === 'SuperAdmin') {
        return res.status(403).json({ message: 'Cannot modify SuperAdmin' });
      }

      if (typeof isIdentityVerified === 'boolean') admin.isIdentityVerified = isIdentityVerified;
      if (typeof isApproved === 'boolean') admin.isApproved = isApproved;

      await admin.save();
      res.json({ message: 'Admin updated successfully', admin });
    } catch (err) {
      res.status(500).json({ message: 'Failed to update admin' });
    }
  }
);


// Delete admin (except SuperAdmin)
router.delete(
  '/:id',
  jwtMiddleware,
  requireRole('SuperAdmin'),
  async (req, res) => {
    const { id } = req.params;

    try {
      const admin = await Admin.findById(id);
      if (!admin) return res.status(404).json({ message: 'Admin not found' });

      // Cast role so TS knows the possible values
      const role = admin.role as 'Admin' | 'SuperAdmin';

      if (role === 'SuperAdmin') {
        return res.status(403).json({ message: 'Cannot delete SuperAdmin' });
      }

      await admin.deleteOne();
      res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete admin' });
    }
  }
);



export default router;
