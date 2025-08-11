import { Request, Response } from "express";
import { Admin } from "../models/admin.model";
import { SuperAdmin } from "../models/superadmin.model";

export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { id, role } = req.user;

    let user;

    if (role === "Admin") {
      user = await Admin.findById(id).select("-password");
    } else if (role === "SuperAdmin") {
      user = await SuperAdmin.findById(id).select("-password");
    } else {
      return res.status(403).json({ error: "Unknown role" });
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      // any other user info you want to return
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
