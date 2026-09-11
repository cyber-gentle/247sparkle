'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, AlertCircle, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import PortalAuthShell from '@/components/auth/PortalAuthShell';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/auth/admin/login', {
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

      toast.success('Welcome back, Admin!');
      router.push('/admin/dashboard');
      router.refresh();
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
      portal="Admin Console"
      icon={LayoutDashboard}
      title="Platform Management"
      description="Sign in to oversee orders, riders, partners, and customers across the 247Sparkle platform."
      cardTitle="Admin Login"
      cardDescription="Restricted access — authorised staff only"
      notice={{
        title: 'Internal accounts only',
        text: 'Admin accounts are managed internally. Contact support if you need access.',
      }}
    >
      <Toaster position="top-center" richColors />
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
              placeholder="admin@247sparkle.com"
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
          className="w-full rounded-xl bg-[#1A0A5E] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#120843] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Signing in...
            </>
          ) : (
            <>
              <ShieldCheck size={18} className="mr-2 inline align-[-3px]" />
              Sign In to Admin Console
            </>
          )}
        </button>
      </form>
    </PortalAuthShell>
  );
}
