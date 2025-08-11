// src/routes/material.routes.ts
import express from 'express';
import multer from 'multer';
import * as materialController from '../controllers/material.controller';
import { validate } from '../middlewares/validation.middleware';
import { createMaterialSchema } from '../validators/material.validator';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();
const upload = multer(); // In-memory storage, perfect for Supabase uploads

// Require authentication for all material routes
router.use(authenticate);

router.patch('/admin/bulk-update', materialController.bulkUpdateMaterialStatus);
// 🆕 SuperAdmin only routes (place these BEFORE the general routes)
router.get('/admin/all', materialController.getAllMaterialsForSuperAdmin);
router.patch('/admin/:id', upload.single('image'), materialController.updateMaterialBySuperAdmin);
router.get('/admin/statistics', materialController.getMaterialStatistics);


// Create material with image upload

router.post(
  "/",
  upload.single("image"),        // multer middleware for 'image' field
  materialController.createMaterialController       // controller uses multer req.file and req.body
);
router.get('/', materialController.getMaterials);
router.patch('/:id', upload.single('image'), materialController.updateMaterial);
router.delete('/:id', materialController.deleteMaterial);

export default router;
