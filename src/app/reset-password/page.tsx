'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, AlertCircle, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import PortalAuthShell from '@/components/auth/PortalAuthShell';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
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
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

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
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-slate-700">
          New Password
        </label>
        <span className="relative block">
          <Lock
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            {...register('password')}
            type="password"
            id="password"
            placeholder="At least 6 characters"
            className={`public-field-with-icon ${errors.password ? 'border-red-500' : ''}`}
          />
        </span>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} /> {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-bold text-slate-700">
          Confirm New Password
        </label>
        <span className="relative block">
          <Lock
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            {...register('confirmPassword')}
            type="password"
            id="confirmPassword"
            placeholder="Re-enter your new password"
            className={`public-field-with-icon ${errors.confirmPassword ? 'border-red-500' : ''}`}
          />
        </span>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} /> {errors.confirmPassword.message}
          </p>
        )}
      </div>

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
