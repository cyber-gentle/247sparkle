'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Lock,
  Mail,
  AlertCircle,
  Store,
  CheckCircle2,
  TrendingUp,
  Shield,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import PortalAuthShell from '@/components/auth/PortalAuthShell';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: TrendingUp, text: 'Receive overflow orders and grow your revenue' },
  { icon: Clock, text: 'Manage your shop hours and workload status' },
  { icon: Shield, text: 'Secure earnings with direct bank payouts' },
];

export default function PartnerLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/auth/partner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error || 'Login failed');
        toast.error(result.error || 'Login failed');
        return;
      }

      toast.success('Logged in successfully!');
      setTimeout(() => router.push('/partner/dashboard'), 1500);
    } catch (error: any) {
      const msg = error.message || 'An error occurred';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PortalAuthShell
      portal="Partner Portal"
      icon={Store}
      title="Welcome Back, Partner!"
      description="Login to manage incoming orders, update your workload status, and track your earnings."
      cardTitle="Partner Login"
      cardDescription="Enter your credentials to continue"
      features={FEATURES}
      notice={{
        title: 'Pending Approval?',
        text: "If you just applied, please wait for admin approval before logging in. You'll be notified once your account is activated.",
      }}
      switchHref="/partner/signup"
      switchLabel="New to 247Sparkle? Sign up →"
    >
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
              placeholder="business@example.com"
              className={`public-field-with-icon ${errors.email ? 'border-red-500' : ''}`}
            />
          </span>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-slate-700">
            Password
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
              placeholder="••••••••"
              className={`public-field-with-icon ${errors.password ? 'border-red-500' : ''}`}
            />
          </span>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.password.message}
            </p>
          )}
          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-slate-500 hover:text-[#CC0000] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
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
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#1A0A5E]" />
              Logging in...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Login to Dashboard
            </>
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-slate-500">New to 247Sparkle?</span>
        </div>
      </div>

      <Link
        href="/partner/signup"
        className="block w-full rounded-xl border-2 border-[#1A0A5E] py-3 text-center text-sm font-bold text-[#1A0A5E] transition hover:bg-[#1A0A5E] hover:text-white active:scale-[0.98]"
      >
        Register Your Business
      </Link>
    </PortalAuthShell>
  );
}
