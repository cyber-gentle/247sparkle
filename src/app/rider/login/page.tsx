'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Lock, Mail, AlertCircle, Zap, CheckCircle2, TrendingUp, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: TrendingUp, text: 'Earn 20% commission on every delivery' },
  { icon: Clock, text: 'Flexible working hours' },
  { icon: Shield, text: 'Secure and instant payouts' },
];

export default function RiderLoginPage() {
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
      const response = await fetch('/api/auth/rider/login', {
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
      setTimeout(() => {
        router.push('/rider/dashboard');
      }, 1500);
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#1A0A5E]">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <Link href="/rider/signup" className="text-sm font-semibold text-[#1A0A5E] hover:text-[#120843]">
            Don't have an account? Sign up →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                <Zap size={14} />
                Rider Portal
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1A0A5E] mb-4">
                Welcome Back, Rider!
              </h1>
              <p className="text-lg text-gray-600">
                Login to access available jobs, track your earnings, and manage your deliveries.
              </p>
            </div>

            <div className="space-y-3">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                      <Icon size={20} className="text-white" />
                    </div>
                    <p className="text-gray-700 font-medium">{feature.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900 mb-1">Pending Approval?</h3>
                  <p className="text-sm text-amber-800">
                    If you just signed up, please wait for admin approval before logging in. You'll receive an email once approved.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 lg:p-10">
            <div className="text-center mb-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white mx-auto mb-4">
                <Zap size={32} />
              </div>
              <h2 className="text-2xl font-bold text-[#1A0A5E]">Rider Login</h2>
              <p className="text-sm text-gray-600 mt-1">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    placeholder="rider@example.com"
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

              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 flex items-center gap-2">
                  <AlertCircle size={18} />
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">New to 247 Sparkle?</span>
              </div>
            </div>

            <Link
              href="/rider/signup"
              className="block w-full text-center bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold py-3 rounded-lg transition duration-200"
            >
              Create Rider Account
            </Link>

            <p className="text-xs text-center text-gray-500 mt-6">
              By logging in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
