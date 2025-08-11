// utils/handleZodError.ts
import { ZodError } from "zod";

export const handleZodError = (err: ZodError<any>) => {
  return err.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
};
