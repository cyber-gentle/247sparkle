'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import ProviderApplicationShell from '@/components/ProviderApplicationShell';
import { riderSignupSchema, type RiderSignupFormData } from '@/lib/provider-signup-validation';

const fieldClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1A0A5E] focus:ring-4 focus:ring-[#1A0A5E]/10 ${
    hasError ? 'border-red-500' : 'border-slate-300'
  }`;

const riderSteps = [
  {
    title: 'Tell us who you are',
    description: 'Share your contact details and pickup-area address.',
  },
  {
    title: 'We review your application',
    description: 'Our operations team checks each rider application before activation.',
  },
  {
    title: 'Start accepting jobs',
    description: 'Once approved, sign in to see and accept available delivery jobs.',
  },
];

export default function RiderSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RiderSignupFormData>({
    resolver: zodResolver(riderSignupSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = async (data: RiderSignupFormData) => {
    setIsLoading(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/auth/rider/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        const message = result.error || 'Application could not be submitted';
        setSubmitError(message);
        toast.error(message);
        return;
      }

      toast.success('Application submitted for review.');
      setTimeout(() => router.push('/rider/login'), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = () => {
    const message = 'Please complete the highlighted fields before submitting your application.';
    setSubmitError(message);
    toast.error(message);
  };

  return (
    <ProviderApplicationShell
      eyebrow="Rider applications"
      title="Join the delivery network"
      description="Apply to deliver laundry and cleaning orders across Otukpo. The form takes a few minutes, and every application is reviewed before access is activated."
      applicationTitle="Rider application"
      applicationDescription="Use the same phone number and email you plan to use when signing in."
      loginHref="/rider/login"
      loginLabel="Already registered? Sign in"
      steps={riderSteps}
    >
      <form
        method="post"
        noValidate
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="space-y-7"
      >
        <fieldset>
          <legend className="text-sm font-bold text-slate-900">Your details</legend>
          <p className="mt-1 text-sm text-slate-500">
            We use these details to review and contact you.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Full name
              </label>
              <input
                {...register('fullName')}
                id="fullName"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                placeholder="Your full name"
                className={fieldClass(!!errors.fullName)}
              />
              {errors.fullName && (
                <p id="fullName-error" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                placeholder="you@example.com"
                className={fieldClass(!!errors.email)}
              />
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Phone number
              </label>
              <input
                {...register('phone')}
                id="phone"
                type="tel"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                placeholder="08012345678"
                className={fieldClass(!!errors.phone)}
              />
              {errors.phone && (
                <p id="phone-error" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Pickup-area address
              </label>
              <textarea
                {...register('address')}
                id="address"
                rows={3}
                aria-invalid={!!errors.address}
                aria-describedby={errors.address ? 'address-error' : undefined}
                placeholder="Your address in Otukpo"
                className={fieldClass(!!errors.address)}
              />
              {errors.address && (
                <p id="address-error" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.address.message}
                </p>
              )}
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
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                placeholder="At least 6 characters"
                className={fieldClass(!!errors.password)}
              />
              {errors.password && (
                <p id="password-error" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.password.message}
                </p>
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
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                placeholder="Repeat your password"
                className={fieldClass(!!errors.confirmPassword)}
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {submitError && (
          <div
            role="alert"
            className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
          >
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
          {isLoading ? 'Submitting application…' : 'Submit rider application'}
        </button>
        <p className="text-center text-xs leading-5 text-slate-500">
          By submitting, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </ProviderApplicationShell>
  );
}
