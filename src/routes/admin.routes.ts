// routes/admin.routes.ts
import express from "express";
import { requireRole } from "../middlewares/auth.middleware";
import { jwtMiddleware } from "../middlewares/jwt.middleware"; // your new middleware
import { Admin } from "../models/admin.model";

const router = express.Router();

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
