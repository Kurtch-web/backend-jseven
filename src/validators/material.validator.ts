import { z } from 'zod';

export const createMaterialSchema = z.object({
  name: z.string(),
  quantity: z.coerce.number().positive(), // coerce string to number
  unit: z.string(),
  unitCost: z.coerce.number().positive(), // same coercion, ensure > 0
  storeId: z.string(),
});
