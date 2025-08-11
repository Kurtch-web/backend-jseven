// controllers/superadmin.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { SuperAdmin } from "../models/superadmin.model";
import { signJWT } from "../utils/jwt";

export const loginSuperAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const superadmin = await SuperAdmin.findOne({ email }).select("+password");
    if (!superadmin) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, superadmin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const tokenPayload = {
      id: superadmin._id.toString(),
      email: superadmin.email,
      role: superadmin.role,
    };

    const token = signJWT(tokenPayload);

    // Set token in an httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  // true in prod
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // handle cross-site in prod
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
      path: "/", // cookie available throughout your domain
    });

    res.json({ message: "SuperAdmin logged in successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
