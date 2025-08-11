// src/config/database.ts
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { getEnv } from "./env";
import { SuperAdmin } from "../models/superadmin.model"; // Adjust path as needed

const createSuperAdminIfNotExists = async () => {
  try {
    const email = "superjsvenadmin@gmail.com";
    const plainPassword = "supersuperpasskey@3112magiccodemagi";

    const existingAdmin = await SuperAdmin.findOne({ email, role: "SuperAdmin" });
    if (existingAdmin) {
      console.log("👑 SuperAdmin already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const superAdmin = new SuperAdmin({
      email,
      password: hashedPassword,
      role: "SuperAdmin",
      // add any other required fields here if needed
    });

    await superAdmin.save();
    console.log("🎉 SuperAdmin created successfully.");
  } catch (error) {
    console.error("❌ Error creating SuperAdmin:", error);
  }
};

const connectToMongo = async () => {
  try {
    const conn = await mongoose.connect(getEnv.MONGO_URI);
    console.log("✅ MongoDB connected");
    console.log("🔎 DB Name:", conn.connection.name);
    console.log("🌐 Host:", conn.connection.host);

    await createSuperAdminIfNotExists();

    // Optionally, log all superadmins
    const superadmins = await SuperAdmin.find({});
    console.dir(superadmins, { depth: null, colors: true });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};

export default connectToMongo;
export { createSuperAdminIfNotExists };

