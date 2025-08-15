import { Router } from "express";
import { upload } from "../utils/multer";
import {
  createProductController,
  getAllProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController
} from "../controllers/product.controller";
import { requireAuth} from "../middlewares/auth.middleware"; // ✅ import auth middleware

const router = Router();

// Public routes — anyone can access
router.get("/", getAllProductsController);
router.get("/:id", getProductByIdController);

// Protected routes — only Admins or SuperAdmins
router.post(
  "/",
  requireAuth(["Admin", "SuperAdmin"]),
  upload.fields([
    { name: "image", maxCount: 1 },    // main image
    { name: "images", maxCount: 10 },  // gallery images
  ]),
  createProductController
);

router.patch(
  "/:id",
  requireAuth(["Admin", "SuperAdmin"]),
  upload.single("image"),
  updateProductController
);

router.delete(
  "/:id",
  requireAuth(["Admin", "SuperAdmin"]),
  deleteProductController
);

export default router;
