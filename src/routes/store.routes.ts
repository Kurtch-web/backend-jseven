import express from 'express';
import * as storeController from '../controllers/store.controllers';
import { validate } from '../middlewares/validation.middleware';
import { createStoreSchema } from '../validators/store.validator';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { jwtMiddleware } from '../middlewares/jwt.middleware';
import { Store } from '../models/store.model';
import { upload } from '../utils/multer';
import multer from 'multer';
const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  upload.any(),
  storeController.createStore
);
router.get('/', storeController.getStores);
router.patch('/:id', storeController.updateStore);
router.delete('/:id', jwtMiddleware, storeController.deleteStore);

router.get(
  "/admin/:adminId",
  jwtMiddleware,
  requireRole("SuperAdmin"),
  async (req, res) => {
    try {
      console.log("📥 Received request for stores of adminId:", req.params.adminId); // ✅ Debug log

      const stores = await Store.find({ createdBy: req.params.adminId });
      if (!stores || stores.length === 0) {
        return res.status(404).json({ message: "No stores found for this admin" });
      }
      res.json(stores);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching stores" });
    }
  }
);



export default router;
