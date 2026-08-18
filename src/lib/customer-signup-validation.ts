import { z } from 'zod';

export const customerSignupSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    email: z.string().trim().email('Enter a valid email address'),
    phone: z.string().trim().min(10, 'Phone number must be at least 10 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type CustomerSignupFormData = z.infer<typeof customerSignupSchema>;
