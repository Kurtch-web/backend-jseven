import { IAdmin } from "../interfaces/admin.interface";

export const sanitizeAdmin = (admin: IAdmin) => ({
  id: admin._id,
  fullName: admin.fullName,
  email: admin.email,
  phoneNumber: admin.phoneNumber,
  role: admin.role,
  affiliation: admin.affiliation,
  isApproved: admin.isApproved,
  isIdentityVerified: admin.isIdentityVerified,
  createdAt: admin.createdAt,
});
