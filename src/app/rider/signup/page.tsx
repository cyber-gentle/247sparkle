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
  Banknote,
  Building2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Shield,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

const riderSignupSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 characters'),
    address: z.string().min(5, 'Address is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    bankName: z.string().min(1, 'Bank name is required'),
    bankCode: z.string().min(3, 'Bank code is required'),
    accountNumber: z.string().min(10, 'Account number must be 10 digits'),
    accountName: z.string().min(2, 'Account name is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RiderSignupFormData = z.infer<typeof riderSignupSchema>;

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Earn 20% Commission',
    description: 'Get paid for every delivery you complete',
  },
  {
    icon: Zap,
    title: 'Flexible Schedule',
    description: 'Work when you want, set your own hours',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Direct bank transfers to your account',
  },
];

const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

export default function RiderSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RiderSignupFormData>({
    resolver: zodResolver(riderSignupSchema),
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
        setSubmitError(result.error || 'Signup failed');
        toast.error(result.error || 'Signup failed');
        return;
      }

      toast.success('Signup successful! Awaiting admin approval.');
      setTimeout(() => {
        router.push('/rider/login');
      }, 2000);
    } catch (error: any) {
      const errorMsg = error.message || 'An error occurred';
      setSubmitError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
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
            href="/rider/login"
            className="text-sm font-semibold text-[#1A0A5E] hover:text-[#120843]"
          >
            Already have an account? Login →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Benefits */}
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                <Zap size={14} />
                Join Our Rider Network
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1A0A5E] mb-4">
                Start Earning with 247 Sparkle
              </h1>
              <p className="text-lg text-gray-600">
                Join hundreds of riders delivering laundry and cleaning services across Otukpo.
                Flexible hours, competitive commissions, and instant payouts.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              {BENEFITS.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-gray-200"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                      <Icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A0A5E] mb-1">{benefit.title}</h3>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Approval Notice */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900 mb-1">Admin Approval Required</h3>
                  <p className="text-sm text-amber-800">
                    Your account will be reviewed by our team. You'll receive an email once approved and can start accepting jobs immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 lg:p-10">
            <div className="text-center mb-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white mx-auto mb-4">
                <Zap size={32} />
              </div>
              <h2 className="text-2xl font-bold text-[#1A0A5E]">Create Rider Account</h2>
              <p className="text-sm text-gray-600 mt-1">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-sm font-bold text-[#1A0A5E] mb-3 uppercase tracking-wide">
                  Personal Information
                </h3>

                {/* Full Name */}
                <div className="mb-3">
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...register('fullName')}
                      type="text"
                      id="fullName"
                      placeholder="John Doe"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.fullName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('email')}
                        type="email"
                        id="email"
                        placeholder="you@example.com"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('phone')}
                        type="tel"
                        id="phone"
                        placeholder="08012345678"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      {...register('address')}
                      id="address"
                      rows={2}
                      placeholder="Your full address in Otukpo"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
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

              {/* Bank Information Section */}
              <div>
                <h3 className="text-sm font-bold text-[#1A0A5E] mb-3 uppercase tracking-wide">
                  Bank Information
                </h3>

                {/* Bank Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label htmlFor="bankName" className="block text-sm font-semibold text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        {...register('bankName')}
                        id="bankName"
                        onChange={(e) => {
                          const selectedBank = NIGERIAN_BANKS.find(b => b.name === e.target.value);
                          if (selectedBank) {
                            setValue('bankCode', selectedBank.code);
                          }
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.bankName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Bank</option>
                        {NIGERIAN_BANKS.map((bank) => (
                          <option key={bank.code} value={bank.name}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.bankName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.bankName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="bankCode" className="block text-sm font-semibold text-gray-700 mb-1">
                      Bank Code
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('bankCode')}
                        type="text"
                        id="bankCode"
                        placeholder="Auto-filled"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Account Number & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700 mb-1">
                      Account Number
                    </label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('accountNumber')}
                        type="text"
                        id="accountNumber"
                        placeholder="0123456789"
                        maxLength={10}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.accountNumber && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.accountNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="accountName" className="block text-sm font-semibold text-gray-700 mb-1">
                      Account Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('accountName')}
                        type="text"
                        id="accountName"
                        placeholder="John Doe"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.accountName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.accountName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.accountName.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div>
                <h3 className="text-sm font-bold text-[#1A0A5E] mb-3 uppercase tracking-wide">
                  Security
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('password')}
                        type="password"
                        id="password"
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...register('confirmPassword')}
                        type="password"
                        id="confirmPassword"
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 flex items-center gap-2">
                  <AlertCircle size={18} />
                  {submitError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Create Rider Account
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500 mt-4">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
