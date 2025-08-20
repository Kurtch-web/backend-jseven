import { Schema } from "mongoose";

export interface Specification {
  key: string;
  value: string;
}

export const SpecificationSchema = new Schema<Specification>(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false } // subdocument
);
