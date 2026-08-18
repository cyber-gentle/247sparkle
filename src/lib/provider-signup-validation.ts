import { z } from 'zod';

export const riderSignupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Full name is required')
      .min(2, 'Full name must be at least 2 characters'),
    email: z
      .string()
      .trim()
      .min(1, 'Email address is required')
      .email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone number is required')
      .min(10, 'Phone number must be at least 10 characters'),
    address: z
      .string()
      .trim()
      .min(1, 'Pickup-area address is required')
      .min(5, 'Pickup-area address must be at least 5 characters'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RiderSignupFormData = z.infer<typeof riderSignupSchema>;

export const partnerSignupSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(1, 'Business name is required')
      .min(2, 'Business name must be at least 2 characters'),
    ownerName: z
      .string()
      .trim()
      .min(1, 'Owner name is required')
      .min(2, 'Owner name must be at least 2 characters'),
    email: z
      .string()
      .trim()
      .min(1, 'Email address is required')
      .email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone number is required')
      .min(10, 'Phone number must be at least 10 digits'),
    address: z
      .string()
      .trim()
      .min(1, 'Business address is required')
      .min(5, 'Business address must be at least 5 characters'),
    openingTime: z.string().trim().min(1, 'Opening time is required'),
    closingTime: z.string().trim().min(1, 'Closing time is required'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PartnerSignupFormData = z.infer<typeof partnerSignupSchema>;

export const partnerSignupRequestSchema = partnerSignupSchema.extend({
  daysOfOpening: z
    .array(z.string().trim().min(1, 'Opening day is required'))
    .min(1, 'Select at least one day your business is open.'),
});

export function getOperatingDaysError(selectedDays: string[]) {
  return selectedDays.length === 0 ? 'Select at least one day your business is open.' : null;
}
