'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import ProviderApplicationShell from '@/components/ProviderApplicationShell';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const partnerSignupSchema = z
  .object({
    businessName: z.string().min(2, 'Business name must be at least 2 characters'),
    ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    address: z.string().min(5, 'Business address is required'),
    openingTime: z.string().min(1, 'Opening time is required'),
    closingTime: z.string().min(1, 'Closing time is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PartnerSignupFormData = z.infer<typeof partnerSignupSchema>;

const fieldClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1A0A5E] focus:ring-4 focus:ring-[#1A0A5E]/10 ${
    hasError ? 'border-red-500' : 'border-slate-300'
  }`;

const partnerSteps = [
  {
    title: 'Add your business profile',
    description: 'Tell us who operates the shop and where customers can find you.',
  },
  {
    title: 'Share your operating schedule',
    description: 'Your opening days and hours help us understand available capacity.',
  },
  {
    title: 'Wait for activation',
    description: 'We review partner details before enabling access to partner tools.',
  },
];

export default function PartnerSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerSignupFormData>({ resolver: zodResolver(partnerSignupSchema) });

  const toggleDay = (day: string) => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((selectedDay) => selectedDay !== day)
        : [...current, day]
    );
  };

  const onSubmit = async (data: PartnerSignupFormData) => {
    setIsLoading(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/auth/partner/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, daysOfOpening: selectedDays }),
      });
      const result = await response.json();

      if (!response.ok) {
        const message = result.error || 'Application could not be submitted';
        setSubmitError(message);
        toast.error(message);
        return;
      }

      toast.success('Application submitted for review.');
      setTimeout(() => router.push('/partner/login'), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProviderApplicationShell
      eyebrow="Laundry partner applications"
      title="Apply to join our laundry network"
      description="Share your business details and operating schedule. We review every application before enabling partner access and order availability."
      applicationTitle="Business application"
      applicationDescription="Use the shop contact details you want 247Sparkle to use for application follow-up."
      loginHref="/partner/login"
      loginLabel="Already registered? Sign in"
      steps={partnerSteps}
    >
      <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        <fieldset>
          <legend className="text-sm font-bold text-slate-900">Business profile</legend>
          <p className="mt-1 text-sm text-slate-500">
            This information is used to review your application.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="businessName"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Business name
              </label>
              <input
                {...register('businessName')}
                id="businessName"
                placeholder="Your laundry business"
                className={fieldClass(!!errors.businessName)}
              />
              {errors.businessName && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.businessName.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="ownerName"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Owner&apos;s full name
              </label>
              <input
                {...register('ownerName')}
                id="ownerName"
                placeholder="Your full name"
                className={fieldClass(!!errors.ownerName)}
              />
              {errors.ownerName && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.ownerName.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Business email
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                placeholder="you@example.com"
                className={fieldClass(!!errors.email)}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Business phone
              </label>
              <input
                {...register('phone')}
                id="phone"
                type="tel"
                placeholder="08012345678"
                className={fieldClass(!!errors.phone)}
              />
              {errors.phone && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.phone.message}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Shop address
              </label>
              <textarea
                {...register('address')}
                id="address"
                rows={3}
                placeholder="Full shop address in Otukpo"
                className={fieldClass(!!errors.address)}
              />
              {errors.address && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.address.message}</p>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset className="border-t border-slate-200 pt-6">
          <legend className="text-sm font-bold text-slate-900">Operating schedule</legend>
          <p className="mt-1 text-sm text-slate-500">
            Select your typical opening hours and available days.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="openingTime"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Opening time
              </label>
              <input
                {...register('openingTime')}
                id="openingTime"
                type="time"
                className={fieldClass(!!errors.openingTime)}
              />
              {errors.openingTime && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.openingTime.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="closingTime"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Closing time
              </label>
              <input
                {...register('closingTime')}
                id="closingTime"
                type="time"
                className={fieldClass(!!errors.closingTime)}
              />
              {errors.closingTime && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.closingTime.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Open days</span>
              <div className="flex flex-wrap gap-2" aria-label="Days your business is open">
                {DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleDay(day)}
                      className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-semibold transition ${isSelected ? 'border-[#1A0A5E] bg-[#1A0A5E] text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-[#1A0A5E]/50'}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="border-t border-slate-200 pt-6">
          <legend className="text-sm font-bold text-slate-900">Create sign-in details</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                placeholder="At least 6 characters"
                className={fieldClass(!!errors.password)}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Confirm password
              </label>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                className={fieldClass(!!errors.confirmPassword)}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {submitError && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1A0A5E] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#120843] disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <CheckCircle2 size={18} />
          {isLoading ? 'Submitting application…' : 'Submit business application'}
        </button>
        <p className="text-center text-xs leading-5 text-slate-500">
          By submitting, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </ProviderApplicationShell>
  );
}
