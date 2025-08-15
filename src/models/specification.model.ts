import { Schema } from "mongoose";

export interface Specification {
  name: string;
  value: string;
}

export const SpecificationSchema = new Schema<Specification>(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false } // subdocument
);
