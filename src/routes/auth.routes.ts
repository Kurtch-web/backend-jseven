//routes/auth.routes.ts
import { Router, Request, Response  } from "express";
import { adminLoginSchema} from "../validators/auth.validator";
import { validate } from "../middlewares/validation.middleware";
import {loginAdmin, registerAdmin} from "../controllers/admin.controllers"
import { upload } from "../utils/multer";
// Import your custom rate limiter middleware
import { apiLimiter } from "../middlewares/rateLimit.middleware";
import { requireAuth, authenticate } from "../middlewares/auth.middleware";
import { createStore } from "../controllers/store.controllers";
import { loginSuperAdmin } from "../controllers/superadmin.controller";
import { Admin } from "../models/admin.model";

import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env';  // adjust relative path as needed
import { SuperAdmin } from "../models/superadmin.model"; // Adjust path
const router = Router();

router.post('/login-admin',  validate(adminLoginSchema), loginAdmin);
router.post('/login-superadmin', loginSuperAdmin);
router.post("/", requireAuth(["admin", "superadmin"]), createStore);

router.post(
  '/register-admin',
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'selfieWithId', maxCount: 1 },
  ]),
  registerAdmin
);

router.get('/check-token', (req: Request, res: Response) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'No token cookie' });

  try {
    const decoded = jwt.verify(token, getEnv.JWT_SECRET);
    res.json({ message: 'Token valid', decoded });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token', error: err });
  }
});


router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    let user;
    if (req.user?.role === "Admin") {
      user = await Admin.findById(userId).select("-password");
    } else if (req.user?.role === "SuperAdmin") {
      user = await SuperAdmin.findById(userId).select("-password");
    } else {
      return res.status(403).json({ message: "Invalid role" });
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user }); // send user info in a consistent structure
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


export default router;