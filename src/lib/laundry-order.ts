import { z } from 'zod';

// White-group garments are washed separately from colours, so they are their
// own pricing row ("White Items (Colour Group)") in the pricing table. Mark
// those lines as white-group so the order detail and partner views can badge
// them. The pricing table is admin-managed; this convention match is the
// bridge until Pricing carries an explicit flag.
export const isWhiteGroupItem = (itemName: string) => itemName.toLowerCase().includes('white');

// Laundry step 3: home pickup needs an address plus a date and time window
// for the rider; partner drop-off schedules nothing at this step.
export const laundryPickupSchema = z
  .object({
    pickupOption: z.enum(['HOME_PICKUP', 'PARTNER_DROPOFF'], {
      message: 'Please select a pickup option',
    }),
    pickupAddress: z.string().optional(),
    pickupDate: z.string().optional(),
    pickupTime: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.pickupOption !== 'HOME_PICKUP') return;
    if (!data.pickupAddress || data.pickupAddress.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pickupAddress'],
        message: 'Pickup address must be at least 5 characters',
      });
    }
    if (!data.pickupDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pickupDate'],
        message: 'Pickup date is required',
      });
    }
    if (!data.pickupTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pickupTime'],
        message: 'Pickup time is required',
      });
    }
  });

export type LaundryPickupSchema = z.infer<typeof laundryPickupSchema>;
