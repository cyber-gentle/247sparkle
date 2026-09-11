'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import PortalAuthShell from '@/components/auth/PortalAuthShell';
import PasswordField from '@/components/ui/PasswordField';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: CheckCircle2, text: 'One tap repeat for your usual services' },
  { icon: Sparkles, text: 'Live order and delivery tracking' },
];

export default function CustomerLoginPage() {
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
      const response = await fetch('/api/auth/customer/login', {
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

      toast.success('Login successful! Redirecting...');

      // Cookie is already set by the API, just redirect
      setTimeout(() => {
        router.push('/customer/dashboard');
      }, 1000);
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
      portal="Customer Portal"
      icon={Sparkles}
      title="Welcome Back!"
      description="Login to book services, follow live updates on your orders, and keep your service history in one place."
      cardTitle="Customer Login"
      cardDescription="Enter your credentials to continue"
      features={FEATURES}
      switchHref="/customer/signup"
      switchLabel="New here? Create an account →"
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

        <div>
          <PasswordField
            {...register('password')}
            id="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
          />
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
          {isLoading ? 'Logging in...' : 'Login to Dashboard'}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-500">Don&apos;t have an account?</p>
        <Link href="/customer/signup" className="font-bold text-[#CC0000] hover:underline">
          Create a customer account
        </Link>
      </div>
    </PortalAuthShell>
  );
}
