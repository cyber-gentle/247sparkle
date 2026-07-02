'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Lock,
  Mail,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Store,
  Shield,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

import { NIGERIAN_BANKS } from '@/lib/banks';

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Grow Your Revenue',
    description: 'Receive overflow orders from 247 Sparkle and expand your customer base',
  },
  {
    icon: Store,
    title: 'Manage Your Shop',
    description: 'Control your workload status and incoming orders from one dashboard',
  },
  {
    icon: Shield,
    title: 'Secure Payouts',
    description: 'Earnings tracked automatically with direct bank transfers',
  },
];

const partnerSignupSchema = z
  .object({
    businessName: z.string().min(2, 'Business name must be at least 2 characters'),
    ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
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

export default function PartnerSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerSignupFormData>({
    resolver: zodResolver(partnerSignupSchema),
  });

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
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
        setSubmitError(result.error || 'Signup failed');
        toast.error(result.error || 'Signup failed');
        return;
      }

      toast.success('Application submitted! Awaiting admin approval.');
      setTimeout(() => router.push('/partner/login'), 2000);
    } catch (error: any) {
      const msg = error.message || 'An error occurred';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#1A0A5E]"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <Link
            href="/partner/login"
            className="text-sm font-semibold text-[#1A0A5E] hover:text-[#120843]"
          >
            Already have an account? Login →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left — Benefits */}
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                <Store size={14} />
                Partner Programme
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1A0A5E] mb-4">
                Grow Your Laundry Business with 247 Sparkle
              </h1>
              <p className="text-lg text-gray-600">
                Join our network of trusted laundry partners in Otukpo. Receive overflow orders,
                manage your shop, and earn more — all from one dashboard.
              </p>
            </div>

            <div className="space-y-4">
              {BENEFITS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-gray-200"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <Icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A0A5E] mb-1">{b.title}</h3>
                      <p className="text-sm text-gray-600">{b.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900 mb-1">Admin Approval Required</h3>
                  <p className="text-sm text-amber-800">
                    Your application will be reviewed by our team. You'll be notified once approved
                    and can start receiving orders immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 lg:p-10">
            <div className="text-center mb-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white mx-auto mb-4">
                <Store size={32} />
              </div>
              <h2 className="text-2xl font-bold text-[#1A0A5E]">Register Your Business</h2>
              <p className="text-sm text-gray-600 mt-1">Fill in your business details to apply</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Business Information */}
              <section>
                <h3 className="text-xs font-bold text-[#1A0A5E] mb-3 uppercase tracking-wide">
                  Business Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Business Name
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('businessName')}
                        type="text"
                        placeholder="Sparkle Laundry Hub"
                        className={inputClass(!!errors.businessName)}
                      />
                    </div>
                    {errors.businessName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.businessName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Shop Owner Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('ownerName')}
                        type="text"
                        placeholder="John Doe"
                        className={inputClass(!!errors.ownerName)}
                      />
                    </div>
                    {errors.ownerName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.ownerName.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          {...register('email')}
                          type="email"
                          placeholder="business@example.com"
                          className={inputClass(!!errors.email)}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.email.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          {...register('phone')}
                          type="tel"
                          placeholder="08012345678"
                          className={inputClass(!!errors.phone)}
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Business Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                      <textarea
                        {...register('address')}
                        rows={2}
                        placeholder="Full shop address in Otukpo"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.address.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Operating Hours */}
              <section>
                <h3 className="text-xs font-bold text-[#1A0A5E] mb-3 uppercase tracking-wide">
                  Operating Hours
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Opening Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('openingTime')}
                        type="time"
                        className={inputClass(!!errors.openingTime)}
                      />
                    </div>
                    {errors.openingTime && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.openingTime.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Closing Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('closingTime')}
                        type="time"
                        className={inputClass(!!errors.closingTime)}
                      />
                    </div>
                    {errors.closingTime && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.closingTime.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Days of Opening
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                          selectedDays.includes(day)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Security */}
              <section>
                <h3 className="text-xs font-bold text-[#1A0A5E] mb-3 uppercase tracking-wide">
                  Security
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('password')}
                        type="password"
                        placeholder="••••••••"
                        className={inputClass(!!errors.password)}
                      />
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.password.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('confirmPassword')}
                        type="password"
                        placeholder="••••••••"
                        className={inputClass(!!errors.confirmPassword)}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 flex items-center gap-2">
                  <AlertCircle size={18} />
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Submit Partner Application
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
