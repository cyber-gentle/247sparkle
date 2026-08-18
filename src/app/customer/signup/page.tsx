'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Sparkles,
  UserRound,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  customerSignupSchema,
  type CustomerSignupFormData,
} from '@/lib/customer-signup-validation';

const CUSTOMER_JOURNEY = [
  {
    title: 'Choose a service',
    description: 'Start with laundry, cleaning, or fumigation when you are ready.',
  },
  {
    title: 'Confirm the next step',
    description: 'Keep your contact details in one place for every booking.',
  },
  {
    title: 'Follow your service',
    description: 'Return to your account for order updates and service history.',
  },
];

export default function CustomerSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<CustomerSignupFormData>({
    resolver: zodResolver(customerSignupSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const onSubmit = async (data: CustomerSignupFormData) => {
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
  };

  const onInvalid = (invalidFields: FieldErrors<CustomerSignupFormData>) => {
    const firstInvalidField = Object.keys(invalidFields)[0] as
      keyof CustomerSignupFormData | undefined;
    if (firstInvalidField) setFocus(firstInvalidField);

    const message = 'Please complete the highlighted fields before creating your account.';
    setSubmitError(message);
    toast.error(message);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-10">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="public-card public-card-accent isolate !border-[#1A0A5E] !bg-[#1A0A5E] text-white shadow-[0_30px_80px_rgba(26,10,94,0.28)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -right-8 top-16 h-40 w-40 rounded-full border border-[#F5C200]/25" />
            <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#CC0000]/15 blur-3xl" />
            <div className="absolute right-12 top-8 h-2 w-2 rounded-full bg-[#F5C200] shadow-[0_0_0_7px_rgba(245,194,0,0.08)]" />
          </div>
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
              Create your 247Sparkle account
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/75">
              Save your details once, book faster next time, and keep every order, delivery update,
              and certificate neatly in one place.
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] p-4">
              <div className="relative h-28" aria-hidden="true">
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 360 112"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M34 82C84 82 83 33 139 33C193 33 193 75 252 75C288 75 307 55 330 29"
                    stroke="rgba(245,194,0,0.78)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="5 7"
                  />
                  <circle cx="34" cy="82" r="6" fill="#F5C200" />
                  <circle cx="139" cy="33" r="6" fill="#F5C200" />
                  <circle cx="252" cy="75" r="6" fill="#F5C200" />
                  <circle cx="330" cy="29" r="6" fill="#F5C200" />
                </svg>
                <div className="absolute left-3 top-[52px] flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C200] text-[#1A0A5E] shadow-[0_14px_30px_rgba(245,194,0,0.2)]">
                  <Sparkles size={22} />
                </div>
                <div className="absolute right-3 top-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-[#F5C200]">
                  <CheckCircle2 size={22} />
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                <span>Request</span>
                <span>Service</span>
                <span>Update</span>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F5C200]">
                Your service journey
              </p>
              {CUSTOMER_JOURNEY.map((step, index) => (
                <div key={step.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#F5C200]/70 bg-[#F5C200]/10 text-[11px] font-extrabold text-[#F5C200]">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{step.title}</p>
                    <p className="mt-0.5 text-sm leading-5 text-white/70">{step.description}</p>
                  </div>
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

            <form
              method="post"
              noValidate
              className="space-y-4"
              onSubmit={handleSubmit(onSubmit, onInvalid)}
            >
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
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    placeholder="Adaeze Okonkwo"
                    className={`public-field-with-icon ${errors.fullName ? 'border-red-500' : ''}`}
                  />
                </span>
                {errors.fullName && (
                  <p
                    id="fullName-error"
                    className="mt-1 text-sm text-red-600 flex items-center gap-1"
                  >
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
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      placeholder="you@email.com"
                      className={`public-field-with-icon ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </span>
                  {errors.email && (
                    <p id="email-error" className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
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
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? 'phone-error' : undefined}
                      placeholder="080XXXXXXXX"
                      className={`public-field-with-icon ${errors.phone ? 'border-red-500' : ''}`}
                    />
                  </span>
                  {errors.phone && (
                    <p id="phone-error" className="mt-1 text-sm text-red-600">
                      {errors.phone.message}
                    </p>
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
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      minLength={6}
                      placeholder="At least 6 characters"
                      className={`public-field-with-icon ${errors.password ? 'border-red-500' : ''}`}
                    />
                  </span>
                  {errors.password && (
                    <p id="password-error" className="mt-1 text-sm text-red-600">
                      {errors.password.message}
                    </p>
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
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={
                        errors.confirmPassword ? 'confirmPassword-error' : undefined
                      }
                      minLength={6}
                      placeholder="Repeat password"
                      className={`public-field-with-icon ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    />
                  </span>
                  {errors.confirmPassword && (
                    <p id="confirmPassword-error" className="mt-1 text-sm text-red-600">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </label>
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
