'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle2, Lock, Mail, Phone, Sparkles, UserRound, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BENEFITS = [
  'Book laundry, home cleaning, and fumigation from one account.',
  'Track pickup, service progress, and delivery updates in real time.',
  'Access fumigation certificates and service history anytime.',
];

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function CustomerSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/auth/customer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error || 'Signup failed');
        toast.error(result.error || 'Signup failed');
        return;
      }

      toast.success('Account created successfully!');
      setTimeout(() => {
        router.push('/customer/login');
      }, 1500);
    } catch (error: any) {
      const errorMsg = error.message || 'An error occurred';
      setSubmitError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-10">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="public-card public-card-accent bg-[#1A0A5E] text-white">
          <div className="public-card-body p-8 sm:p-10">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>

            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5C200] text-[#1A0A5E] shadow-gold">
              <Sparkles size={26} />
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F5C200]">
              Customer Portal
            </p>
            <h1 className="max-w-xl text-3xl font-extrabold leading-tight md:text-4xl">
              Create your 247 Sparkle account
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/75">
              Save your details once, book faster next time, and keep every order, delivery update,
              and certificate neatly in one place.
            </p>

            <div className="mt-8 space-y-3">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="flex gap-3 rounded-xl bg-white/10 p-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[#F5C200]" size={18} />
                  <p className="text-sm leading-6 text-white/85">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="public-card public-card-accent">
          <div className="public-card-body p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">
                  Signup
                </p>
                <h2 className="text-2xl font-extrabold text-[#1A0A5E]">Customer details</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter your contact information exactly as you want it attached to future orders.
                </p>
              </div>
              <span className="public-pill w-fit">Secure access</span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Full Name</span>
                <span className="relative block">
                  <UserRound
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    {...register('fullName')}
                    type="text"
                    placeholder="Adaeze Okonkwo"
                    className={`public-field-with-icon ${errors.fullName ? 'border-red-500' : ''}`}
                  />
                </span>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.fullName.message}
                  </p>
                )}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Email</span>
                  <span className="relative block">
                    <Mail
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="you@email.com"
                      className={`public-field-with-icon ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </span>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">
                    Phone Number
                  </span>
                  <span className="relative block">
                    <Phone
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="080XXXXXXXX"
                      className={`public-field-with-icon ${errors.phone ? 'border-red-500' : ''}`}
                    />
                  </span>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Password</span>
                  <span className="relative block">
                    <Lock
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      {...register('password')}
                      type="password"
                      minLength={6}
                      placeholder="At least 6 characters"
                      className={`public-field-with-icon ${errors.password ? 'border-red-500' : ''}`}
                    />
                  </span>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">
                    Confirm Password
                  </span>
                  <span className="relative block">
                    <Lock
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      {...register('confirmPassword')}
                      type="password"
                      minLength={6}
                      placeholder="Repeat password"
                      className={`public-field-with-icon ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    />
                  </span>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </label>
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 flex items-center gap-2">
                  <AlertCircle size={18} />
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full rounded-xl bg-[#1A0A5E] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#120843] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Customer Account'}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-500">Already have an account?</p>
              <Link href="/customer/login" className="font-bold text-[#CC0000] hover:underline">
                Login to customer portal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
