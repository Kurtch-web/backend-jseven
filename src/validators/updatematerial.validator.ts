import { z } from 'zod';

export const updateMaterialSchema = z.object({
  name: z.string().optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  unitCost: z.coerce.number().positive().optional(), // <-- this one is required (not optional)
  storeId: z.string().optional(),
});

