import multer from "multer";
import path from "path";

// Store in memory (don't save to disk)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp", ".pdf"].includes(ext)) {
    return cb(new Error("Only images and PDF files are allowed!"));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
})