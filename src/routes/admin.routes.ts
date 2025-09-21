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

      const { businessName, quoteNumber, jsonData } = req.body;

      if (!businessName) {
        return res.status(400).json({ message: "Business name is required" });
      }
      if (!quoteNumber) {
        return res.status(400).json({ message: "Quote number is required" });
      }

      const file = req.file;

      // Format date and time (YYYY-MM-DD_HH-MM-SS)
      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace("T", "_")
        .replace(/[:.]/g, "-")
        .split("Z")[0]; // remove trailing Z

      // Construct base filename with business + quote + timestamp
      const fileExt = file.originalname.split(".").pop();
      const baseName = `${businessName}-Quote${quoteNumber}-${timestamp}`;
      const fileName = `${baseName}.${fileExt}`;
      const jsonName = `${baseName}.json`;

      // ✅ Upload PDF to Supabase bucket
      const { error: pdfError } = await supabase.storage
        .from("pdfquotation")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype || "application/pdf",
          upsert: true,
        });

      if (pdfError) {
        console.error(pdfError);
        return res.status(500).json({ message: "Failed to upload PDF to Supabase" });
      }

      // ✅ Upload JSON (merge in businessName + quoteNumber)
      if (jsonData) {
        let parsedJson;
        try {
          parsedJson = JSON.parse(jsonData);
        } catch (e) {
          return res.status(400).json({ message: "Invalid JSON data" });
        }

        // Inject businessName + quoteNumber into JSON
        parsedJson.businessName = businessName;
        parsedJson.quoteNumber = quoteNumber;

        const { error: jsonError } = await supabase.storage
          .from("pdfquotation")
          .upload(jsonName, Buffer.from(JSON.stringify(parsedJson, null, 2)), {
            contentType: "application/json",
            upsert: true,
          });

        if (jsonError) {
          console.error(jsonError);
          return res.status(500).json({ message: "Failed to upload JSON to Supabase" });
        }
      }

      // ✅ Get public URLs
      const { data: pdfUrl } = supabase.storage.from("pdfquotation").getPublicUrl(fileName);
      const { data: jsonUrl } = supabase.storage.from("pdfquotation").getPublicUrl(jsonName);

      // Metadata
      const metadata = {
        businessName,
        quoteNumber,
        uploadedAt: now,
        pdfUrl: pdfUrl.publicUrl,
        jsonUrl: jsonData ? jsonUrl.publicUrl : null,
      };

      res.status(200).json({
        message: "PDF (and JSON if provided) uploaded successfully",
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

// 📌 Delete PDF + JSON
router.delete("/delete-pdf/:fileName", async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({ message: "No file name provided" });
    }

    // Derive the JSON file name (replace extension with .json)
    const jsonFileName = fileName.replace(/\.[^/.]+$/, ".json");

    // Remove both PDF and JSON
    const { error } = await supabase.storage
      .from("pdfquotation")
      .remove([fileName, jsonFileName]);

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to delete files" });
    }

    res.status(200).json({ message: `PDF (${fileName}) and JSON (${jsonFileName}) deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error deleting files" });
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

// Define the shape of your JSON
interface SheetData {
  sheetName: string;
  sheetUrl: string;
  tabs: { name: string; description?: string }[];
  uploadedAt?: string;
}

// 📌 Upload Google Sheet link + custom name + tab names
router.post("/upload-sheet-link", async (req, res) => {
  try {
    const { sheetName, sheetUrl, tabs } = req.body;

    if (!sheetUrl) {
      return res.status(400).json({ message: "Google Sheet URL is required" });
    }

    if (!sheetName) {
      return res.status(400).json({ message: "Sheet name is required" });
    }

    if (!Array.isArray(tabs) || tabs.length === 0) {
      return res.status(400).json({ message: "Tabs must be a non-empty array" });
    }

    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace("T", "_")
      .replace(/[:.]/g, "-")
      .split("Z")[0];

    // Safe filename using sheetName
    const safeName = sheetName.replace(/[^a-z0-9]/gi, "_");
    const fileName = `${safeName}-${timestamp}.json`;

    // Save both sheetName + sheetUrl
    const sheetData = {
      sheetName,
      sheetUrl,
      tabs,
      uploadedAt: now,
    };

    const { error } = await supabase.storage
      .from("sheetlinks")
      .upload(fileName, Buffer.from(JSON.stringify(sheetData, null, 2)), {
        contentType: "application/json",
        upsert: true,
      });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to upload Sheet JSON to Supabase" });
    }

    const { data: jsonUrl } = supabase.storage
      .from("sheetlinks")
      .getPublicUrl(fileName);

    res.status(200).json({
      message: "Google Sheet link uploaded successfully",
      jsonUrl: jsonUrl.publicUrl,
      data: sheetData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error uploading sheet link" });
  }
});


// 📌 List uploaded Google Sheet links with metadata
router.get("/list-sheet-links", async (_req, res) => {
  try {
    const { data, error } = await supabase.storage
      .from("sheetlinks")
      .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to list sheet links" });
    }

    const files = await Promise.all(
      data.map(async (file) => {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("sheetlinks")
          .download(file.name);

        if (downloadError) {
          console.error(downloadError);
          return {
            fileName: file.name,
            createdAt: file.created_at,
            url: supabase.storage.from("sheetlinks").getPublicUrl(file.name).data.publicUrl,
            sheetName: "Unknown",
            sheetUrl: null,
            tabs: [],
          };
        }

        const fileText = await fileData.text();
        let parsed: Partial<SheetData> = {}; // ✅ allow missing fields

        try {
          parsed = JSON.parse(fileText) as SheetData;
        } catch (err) {
          console.error("Invalid JSON in:", file.name);
        }

        return {
          fileName: file.name,
          createdAt: file.created_at,
          url: supabase.storage.from("sheetlinks").getPublicUrl(file.name).data.publicUrl,
          sheetName: parsed.sheetName || "Untitled Sheet",
          sheetUrl: parsed.sheetUrl || null,
          tabs: parsed.tabs || [],
        };
      })
    );

    res.status(200).json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error listing sheet links" });
  }
});



router.get("/view-sheet-link/:fileName", async (req, res) => {
  try {
    const { fileName } = req.params;

    const { data, error } = await supabase.storage
      .from("sheetlinks")
      .download(fileName);

    if (error) {
      console.error(error);
      return res.status(404).json({ message: "Sheet link not found" });
    }

    const jsonString = await data.text();
    const jsonData = JSON.parse(jsonString);

    res.status(200).json(jsonData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error viewing sheet link" });
  }
});

router.delete("/delete-sheet-link-by-name/:sheetName", async (req, res) => {
  try {
    const { sheetName } = req.params;

    const { data, error } = await supabase.storage.from("sheetlinks").list("");
    if (error) throw error;

    // Find match
    const match = data.find((f) => f.name.startsWith(sheetName.replace(/[^a-z0-9]/gi, "_")));
    if (!match) {
      return res.status(404).json({ message: "No file found for sheetName" });
    }

    const { error: delError } = await supabase.storage.from("sheetlinks").remove([match.name]);
    if (delError) throw delError;

    res.status(200).json({ message: "Deleted successfully", deletedFile: match.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error deleting sheet link" });
  }
});


export default router;
