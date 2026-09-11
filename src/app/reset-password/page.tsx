'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import PortalAuthShell from '@/components/auth/PortalAuthShell';
import PasswordField, { PASSWORD_MIN_LENGTH } from '@/components/ui/PasswordField';

const resetPasswordSchema = z
  .object({
    password: z.string().min(PASSWORD_MIN_LENGTH, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const FEATURES = [
  { icon: KeyRound, text: 'Choose a new password for your 247Sparkle account' },
  { icon: ShieldCheck, text: 'Works for customer, rider, partner and admin accounts' },
];

const LOGIN_LINKS = [
  { href: '/customer/login', label: 'Customer login' },
  { href: '/rider/login', label: 'Rider login' },
  { href: '/partner/login', label: 'Partner login' },
  { href: '/admin/login', label: 'Admin login' },
];

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isLoading, setIsLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = watch('password') || '';

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error || 'Failed to reset password');
        toast.error(result.error || 'Failed to reset password');
        return;
      }

      setSucceeded(true);
      toast.success('Password updated!');
    } catch (error: any) {
      const errorMsg = error.message || 'An error occurred';
      setSubmitError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-5">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 flex items-start gap-2"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          This reset link is missing its token. Please request a fresh reset link.
        </div>
        <Link href="/forgot-password" className="btn-primary w-full justify-center py-3.5">
          Request a new link
        </Link>
      </div>
    );
  }

  if (succeeded) {
    return (
      <div role="status" className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>Your password has been updated. Log in with your new password to continue.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {LOGIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="btn-primary justify-center py-3 text-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <PasswordField
        {...register('password')}
        id="password"
        label="New Password"
        minLength={PASSWORD_MIN_LENGTH}
        placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
        autoComplete="new-password"
        showRequirement
        error={errors.password?.message}
      />

      <PasswordField
        {...register('confirmPassword')}
        id="confirmPassword"
        label="Confirm New Password"
        minLength={PASSWORD_MIN_LENGTH}
        placeholder="Re-enter your new password"
        autoComplete="new-password"
        matchValue={passwordValue}
        error={errors.confirmPassword?.message}
      />

      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 flex items-start gap-2"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>
            {submitError}{' '}
            <Link href="/forgot-password" className="font-bold underline">
              Request a new link
            </Link>
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full justify-center py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Updating...' : 'Set New Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <PortalAuthShell
      portal="Account Recovery"
      icon={KeyRound}
      title="Choose a new password"
      description="Pick a strong password you don't use anywhere else. Your reset link is single-use, so you're the only one who can finish this step."
      cardTitle="Set a New Password"
      cardDescription="Enter and confirm your new password"
      features={FEATURES}
      switchHref="/"
      switchLabel="Back to home →"
    >
      <Suspense fallback={<p className="py-8 text-center text-sm text-slate-500">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </PortalAuthShell>
  );
}
