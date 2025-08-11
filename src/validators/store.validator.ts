import { z } from 'zod';

export const createStoreSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  vatNumber: z.string().optional(),
  businessHours: z.string().optional(), // expected to be a JSON string, parse later
  attachments: z.array(z.string()).optional(), // array of URLs (optional)
});
