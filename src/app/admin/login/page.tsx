'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import QRCode from 'react-qr-code';
import {
  Mail,
  AlertCircle,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import PortalAuthShell from '@/components/auth/PortalAuthShell';
import PasswordField from '@/components/ui/PasswordField';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/** Stage 2/3 state handed over by the login API between password and session. */
type TwoFactorStage = {
  stage: 'verify' | 'enroll';
  pendingToken: string;
  otpauthUri?: string;
  secret?: string;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [twoFactor, setTwoFactor] = useState<TwoFactorStage | null>(null);
  const [code, setCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);

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

      // Password accepted — but no session yet: hand off to the 2FA stage.
      if (result.requiresEnrollment || result.requiresTwoFactor) {
        setTwoFactor({
          stage: result.requiresEnrollment ? 'enroll' : 'verify',
          pendingToken: result.pendingToken,
          otpauthUri: result.otpauthUri,
          secret: result.secret,
        });
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

  const submitCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!twoFactor || !/^\d{6}$/.test(code)) {
      setSubmitError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setIsLoading(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/auth/admin/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingToken: twoFactor.pendingToken, code }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error || 'Verification failed');
        toast.error(result.error || 'Verification failed');
        return;
      }

      toast.success(
        twoFactor.stage === 'enroll' ? 'Two-factor enabled. Welcome back!' : 'Welcome back, Admin!'
      );
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

  const copySecret = async () => {
    if (!twoFactor?.secret) return;
    try {
      await navigator.clipboard.writeText(twoFactor.secret);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select the key manually instead.');
    }
  };

  const restartLogin = () => {
    setTwoFactor(null);
    setCode('');
    setSubmitError('');
  };

  const codeInput = (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus
      maxLength={6}
      value={code}
      onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
      placeholder="000000"
      aria-label="6-digit authenticator code"
      className="w-full rounded-xl border border-slate-300 bg-white py-3.5 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-[#1A0A5E] focus:ring-2 focus:ring-[#F5C200]/25"
    />
  );

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

      {!twoFactor && (
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
      )}

      {twoFactor?.stage === 'enroll' && (
        <form onSubmit={submitCode} className="space-y-5">
          <div className="rounded-xl bg-[#1A0A5E]/5 border border-[#1A0A5E]/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1A0A5E]">
              <Smartphone size={16} />
              Secure your admin account
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Admin sign-in requires a second factor. Scan this code with Google Authenticator,
              Authy, or any authenticator app — then confirm with your first code below.
            </p>
            <div className="flex justify-center py-2">
              <div className="rounded-xl bg-white p-3 border border-slate-200">
                {twoFactor.otpauthUri && (
                  <QRCode value={twoFactor.otpauthUri} size={168} fgColor="#1A0A5E" />
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">
                Can&rsquo;t scan? Enter this key manually:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-mono text-slate-700 break-all">
                  {twoFactor.secret}
                </code>
                <button
                  type="button"
                  onClick={copySecret}
                  className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-[#1A0A5E] hover:border-[#1A0A5E]/30 transition"
                  aria-label="Copy setup key"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="totp-code" className="mb-1.5 block text-sm font-bold text-slate-700">
              Enter the 6-digit code
            </label>
            {codeInput}
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
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck size={18} className="mr-2 inline align-[-3px]" />
                Enable &amp; Sign In
              </>
            )}
          </button>
        </form>
      )}

      {twoFactor?.stage === 'verify' && (
        <form onSubmit={submitCode} className="space-y-5">
          <div className="rounded-xl bg-[#1A0A5E]/5 border border-[#1A0A5E]/10 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1A0A5E]">
              <Smartphone size={16} />
              Two-factor verification
            </div>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Enter the 6-digit code from your authenticator app to finish signing in.
            </p>
          </div>

          <div>
            <label htmlFor="totp-code" className="mb-1.5 block text-sm font-bold text-slate-700">
              Authenticator code
            </label>
            {codeInput}
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
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck size={18} className="mr-2 inline align-[-3px]" />
                Verify &amp; Sign In
              </>
            )}
          </button>

          <button
            type="button"
            onClick={restartLogin}
            className="w-full text-center text-sm font-semibold text-slate-500 hover:text-[#1A0A5E] hover:underline transition"
          >
            Back to sign in
          </button>
        </form>
      )}
    </PortalAuthShell>
  );
}
