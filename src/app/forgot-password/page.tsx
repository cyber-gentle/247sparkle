'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, AlertCircle, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import PortalAuthShell from '@/components/auth/PortalAuthShell';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const FEATURES = [
  { icon: KeyRound, text: 'Secure single-use reset link, valid for 30 minutes' },
  { icon: ShieldCheck, text: 'Works for customer, rider, partner and admin accounts' },
];

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error || 'Failed to send reset link');
        toast.error(result.error || 'Failed to send reset link');
        return;
      }

      setSubmitted(true);
      toast.success('Reset link sent — check your inbox');
    } catch (error: any) {
      const errorMsg = error.message || 'An error occurred';
      setSubmitError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PortalAuthShell
      portal="Account Recovery"
      icon={KeyRound}
      title="Forgot your password?"
      description="Enter the email address linked to your 247Sparkle account and we'll send you a secure link to choose a new password."
      cardTitle="Reset Your Password"
      cardDescription="We'll email you a reset link"
      features={FEATURES}
      switchHref="/"
      switchLabel="Back to home →"
    >
      {submitted ? (
        <div role="status" className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>
              If an account exists for <strong>{getValues('email')}</strong>, a password reset link
              has been sent. Please check your inbox (and spam folder).
            </p>
          </div>
          <p className="text-sm text-slate-500">
            The link expires in 30 minutes and can only be used once.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="btn-primary w-full justify-center py-3.5"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-slate-700">
              Email Address
            </label>
            <span className="relative block">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                {...register('email')}
                type="email"
                id="email"
                placeholder="you@example.com"
                className={`public-field-with-icon ${errors.email ? 'border-red-500' : ''}`}
              />
            </span>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} /> {errors.email.message}
              </p>
            )}
          </div>

          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 flex items-center gap-2"
            >
              <AlertCircle size={18} />
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full justify-center py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-500">Remembered it?</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/customer/login" className="font-bold text-[#CC0000] hover:underline">
            Customer login
          </Link>
          <Link href="/rider/login" className="font-bold text-[#CC0000] hover:underline">
            Rider login
          </Link>
          <Link href="/partner/login" className="font-bold text-[#CC0000] hover:underline">
            Partner login
          </Link>
          <Link href="/admin/login" className="font-bold text-[#CC0000] hover:underline">
            Admin login
          </Link>
        </div>
      </div>
    </PortalAuthShell>
  );
}
