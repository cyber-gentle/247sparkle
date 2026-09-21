'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  User,
  Save,
  Banknote,
  Lock,
  Clock,
  ShieldAlert,
  Store,
  MapPin,
  Building2,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import PasswordField, { PASSWORD_MIN_LENGTH } from '@/components/ui/PasswordField';

import { NIGERIAN_BANKS } from '@/lib/banks';

// Mirrors `fieldClass` below, minus the border colour and horizontal padding,
// which PasswordField owns (lock icon + eye toggle).
const PROFILE_PASSWORD_INPUT_CLASS =
  'w-full py-2.5 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-[#1A0A5E]';
const PROFILE_PASSWORD_LABEL_CLASS = 'block text-sm font-semibold text-gray-700 mb-1';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const profileSchema = z.object({
  businessName: z.string().min(2),
  ownerName: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(5),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function PartnerProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('PENDING');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [useCustomBank, setUseCustomBank] = useState(false);

  const isApproved = approvalStatus === 'APPROVED';

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isEnrolling2FA, setIsEnrolling2FA] = useState(false);
  const [setupTwoFactor, setSetupTwoFactor] = useState<{
    secret: string;
    otpauthUri: string;
  } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showDisablePrompt, setShowDisablePrompt] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const newPasswordValue = watchPassword('newPassword') || '';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/partner/profile', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/partner/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      const p = data.partner;
      if (p) {
        setValue('businessName', p.businessName);
        setValue('ownerName', p.ownerName);
        setValue('phone', p.phone || '');
        setValue('address', p.address || '');
        setValue('openingTime', p.openingTime || '');
        setValue('closingTime', p.closingTime || '');
        setValue('bankName', p.bankName || '');
        setValue('bankCode', p.bankCode || '');
        setValue('accountNumber', p.accountNumber || '');
        setValue('accountName', p.accountName || '');
        setApprovalStatus(p.approvalStatus);
        setSelectedDays(Array.isArray(p.daysOfOpening) ? p.daysOfOpening : []);
        setTwoFactorEnabled(Boolean(p.twoFactorEnabled));
        if (p.bankName && !NIGERIAN_BANKS.find((b) => b.name === p.bankName)) {
          setUseCustomBank(true);
        }
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const startTwoFactorSetup = async () => {
    setIsEnrolling2FA(true);
    try {
      const response = await fetch('/api/partner/2fa', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start two-factor setup');
      }
      setSetupTwoFactor({ secret: data.secret, otpauthUri: data.otpauthUri });
      setTwoFactorCode('');
      setCopiedSecret(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start 2FA setup');
    } finally {
      setIsEnrolling2FA(false);
    }
  };

  const copySecretKey = async () => {
    if (!setupTwoFactor?.secret) return;
    try {
      await navigator.clipboard.writeText(setupTwoFactor.secret);
      setCopiedSecret(true);
      toast.success('Secret key copied to clipboard');
      setTimeout(() => setCopiedSecret(false), 2500);
    } catch {
      toast.error('Failed to copy key');
    }
  };

  const verifyAndActivate2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = twoFactorCode.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanCode)) {
      toast.error('Please enter the 6-digit code from your authenticator app');
      return;
    }

    setIsVerifying2FA(true);
    try {
      const response = await fetch('/api/partner/2fa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: cleanCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      toast.success('Two-factor authentication enabled successfully!');
      setTwoFactorEnabled(true);
      setSetupTwoFactor(null);
      setTwoFactorCode('');
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const confirmDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      toast.error('Enter your current password to disable two-factor authentication');
      return;
    }

    setIsDisabling2FA(true);
    try {
      const response = await fetch('/api/partner/2fa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      toast.success('Two-factor authentication disabled');
      setTwoFactorEnabled(false);
      setShowDisablePrompt(false);
      setDisablePassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disable 2FA');
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    if (!isApproved) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/partner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, daysOfOpening: selectedDays }),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/partner/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to change password');
      }
      toast.success('Password changed successfully');
      resetPasswordForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const toggleDay = (day: string) =>
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A0A5E]" />
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </main>
    );
  }

  const fieldClass = (hasError = false, disabled = false) =>
    `w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent ${
      hasError ? 'border-red-400' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : ''}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/partner/dashboard" className="text-gray-600 hover:text-[#1A0A5E]">
            <ArrowLeft size={20} />
          </Link>
          <AppLogo size={32} src="/images/logo.jpeg" />
          <h1 className="text-xl font-bold text-[#1A0A5E]">Business Profile</h1>
          <span
            className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${
              isApproved
                ? 'bg-green-100 text-green-700'
                : approvalStatus === 'SUSPENDED'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
            }`}
          >
            {approvalStatus}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Status banners */}
        {approvalStatus === 'PENDING' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
            <Clock size={22} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Account Pending Approval</p>
              <p className="text-sm text-amber-800 mt-1">
                Your application is under review. Bank details and profile edits will be unlocked
                once an admin approves your account.
              </p>
            </div>
          </div>
        )}
        {approvalStatus === 'SUSPENDED' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-4">
            <ShieldAlert size={22} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Account Suspended</p>
              <p className="text-sm text-red-800 mt-1">
                Contact{' '}
                <a href="mailto:info.247sparkle@gmail.com" className="underline">
                  info.247sparkle@gmail.com
                </a>{' '}
                for assistance.
              </p>
            </div>
          </div>
        )}

        {/* Business Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#1A0A5E] mb-6 flex items-center gap-2">
            <Store size={20} />
            Business Information
          </h2>
          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  {...register('businessName')}
                  disabled={!isApproved}
                  className={fieldClass(!!errors.businessName, !isApproved)}
                />
                {errors.businessName && (
                  <p className="text-red-500 text-sm mt-1">{errors.businessName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  {...register('ownerName')}
                  disabled={!isApproved}
                  className={fieldClass(!!errors.ownerName, !isApproved)}
                />
                {errors.ownerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.ownerName.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                {...register('phone')}
                disabled={!isApproved}
                className={fieldClass(!!errors.phone, !isApproved)}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <MapPin size={14} /> Business Address
              </label>
              <textarea
                {...register('address')}
                rows={2}
                disabled={!isApproved}
                className={fieldClass(!!errors.address, !isApproved)}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>

            {/* Operating Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Opening Time
                </label>
                <input
                  type="time"
                  {...register('openingTime')}
                  disabled={!isApproved}
                  className={fieldClass(false, !isApproved)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Closing Time
                </label>
                <input
                  type="time"
                  {...register('closingTime')}
                  disabled={!isApproved}
                  className={fieldClass(false, !isApproved)}
                />
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
                    disabled={!isApproved}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                      selectedDays.includes(day)
                        ? 'bg-[#1A0A5E] text-white border-[#1A0A5E]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#1A0A5E]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving || !isApproved}
              className="rounded-xl bg-[#1A0A5E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#120843] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Bank Information */}
        <div
          className={`bg-white rounded-2xl border p-8 shadow-sm ${!isApproved ? 'border-gray-100' : 'border-gray-200'}`}
        >
          <h2
            className={`text-lg font-bold mb-2 flex items-center gap-2 ${isApproved ? 'text-[#1A0A5E]' : 'text-gray-400'}`}
          >
            <Banknote size={20} />
            Bank Information
          </h2>
          {!isApproved && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4">
              Bank details can only be submitted after your account is approved.
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Building2 size={14} /> Bank Name
                </label>
                {!useCustomBank ? (
                  <select
                    {...register('bankName')}
                    disabled={!isApproved}
                    onChange={(e) => {
                      if (e.target.value === '__other__') {
                        setUseCustomBank(true);
                        setValue('bankName', '');
                        setValue('bankCode', '');
                      } else {
                        const bank = NIGERIAN_BANKS.find((b) => b.name === e.target.value);
                        setValue('bankCode', bank?.code ?? '');
                      }
                    }}
                    className={fieldClass(false, !isApproved)}
                  >
                    <option value="">Select Bank</option>
                    {NIGERIAN_BANKS.map((b) => (
                      <option key={b.code} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                    <option value="__other__">Other (type manually)</option>
                  </select>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      {...register('bankName')}
                      disabled={!isApproved}
                      placeholder="Enter full bank name"
                      className={fieldClass(false, !isApproved)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomBank(false);
                        setValue('bankName', '');
                        setValue('bankCode', '');
                      }}
                      className="shrink-0 text-xs text-[#CC0000] hover:underline whitespace-nowrap"
                    >
                      Use list
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <CreditCard size={14} /> Bank Code
                </label>
                <input
                  type="text"
                  {...register('bankCode')}
                  disabled={!isApproved || !useCustomBank}
                  placeholder={useCustomBank ? 'Enter bank code (optional)' : 'Auto-filled'}
                  className={fieldClass(false, !isApproved || !useCustomBank)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  {...register('accountNumber')}
                  disabled={!isApproved}
                  maxLength={10}
                  placeholder="10 digits"
                  className={fieldClass(false, !isApproved)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <User size={14} /> Account Name
                </label>
                <input
                  type="text"
                  {...register('accountName')}
                  disabled={!isApproved}
                  className={fieldClass(false, !isApproved)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSaving || !isApproved}
              className="rounded-xl bg-[#1A0A5E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#120843] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Update Bank Info'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#1A0A5E] mb-6 flex items-center gap-2">
            <Lock size={20} />
            Change Password
          </h2>
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <PasswordField
              {...registerPassword('currentPassword')}
              id="currentPassword"
              label="Current Password"
              autoComplete="current-password"
              error={passwordErrors.currentPassword?.message}
              inputClassName={PROFILE_PASSWORD_INPUT_CLASS}
              labelClassName={PROFILE_PASSWORD_LABEL_CLASS}
            />
            <PasswordField
              {...registerPassword('newPassword')}
              id="newPassword"
              label="New Password"
              minLength={PASSWORD_MIN_LENGTH}
              autoComplete="new-password"
              showRequirement
              error={passwordErrors.newPassword?.message}
              inputClassName={PROFILE_PASSWORD_INPUT_CLASS}
              labelClassName={PROFILE_PASSWORD_LABEL_CLASS}
            />
            <PasswordField
              {...registerPassword('confirmPassword')}
              id="confirmPassword"
              label="Confirm New Password"
              minLength={PASSWORD_MIN_LENGTH}
              autoComplete="new-password"
              matchValue={newPasswordValue}
              error={passwordErrors.confirmPassword?.message}
              inputClassName={PROFILE_PASSWORD_INPUT_CLASS}
              labelClassName={PROFILE_PASSWORD_LABEL_CLASS}
            />
            <button
              type="submit"
              disabled={isChangingPassword}
              className="rounded-xl bg-[#1A0A5E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#120843] disabled:opacity-50"
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication (2FA) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1A0A5E]/10 flex items-center justify-center text-[#1A0A5E]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1A0A5E]">
                  Two-Factor Authentication (2FA)
                </h2>
                <p className="text-xs text-gray-500">
                  Add an extra layer of security to protect your account and payouts
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold w-fit ${
                twoFactorEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              {twoFactorEnabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          {twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3">
                <ShieldCheck size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-900">Your account is secured with 2FA</p>
                  <p className="text-emerald-700 mt-0.5 leading-relaxed">
                    Whenever you sign in, you will be prompted for a 6-digit code from your
                    authenticator app (such as Google Authenticator or Authy).
                  </p>
                </div>
              </div>

              {!showDisablePrompt ? (
                <button
                  type="button"
                  onClick={() => setShowDisablePrompt(true)}
                  className="rounded-xl border border-red-200 text-red-600 hover:bg-red-50 px-5 py-2.5 text-sm font-semibold transition"
                >
                  Disable Two-Factor Authentication
                </button>
              ) : (
                <form
                  onSubmit={confirmDisable2FA}
                  className="rounded-xl border border-red-200 bg-red-50/50 p-5 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 text-sm">
                        Confirm Password to Disable 2FA
                      </h4>
                      <p className="text-xs text-red-700 mt-0.5">
                        Disabling two-factor authentication reduces your account security. Please
                        enter your account password to confirm.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="disable2fa-password"
                      className="block text-xs font-bold text-gray-700 mb-1"
                    >
                      Account Password
                    </label>
                    <input
                      id="disable2fa-password"
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full max-w-md px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent bg-white"
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isDisabling2FA || !disablePassword}
                      className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-sm font-semibold transition disabled:opacity-50"
                    >
                      {isDisabling2FA ? 'Disabling...' : 'Confirm Disable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDisablePrompt(false);
                        setDisablePassword('');
                      }}
                      className="rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm font-medium transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : !setupTwoFactor ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                Protect your orders, payout credentials, and customer communications from
                unauthorized access. Once enabled, signing into your partner portal will require
                entering a one-time code generated on your phone.
              </p>
              <button
                type="button"
                onClick={startTwoFactorSetup}
                disabled={isEnrolling2FA}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1A0A5E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#120843] transition disabled:opacity-50"
              >
                {isEnrolling2FA ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Smartphone size={16} />
                    Set Up Two-Factor Authentication
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-6 space-y-6">
              <div className="border-b border-purple-100 pb-4">
                <h3 className="text-base font-bold text-[#1A0A5E]">Configure Authenticator App</h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Use Google Authenticator, Microsoft Authenticator, Authy, or 1Password.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1A0A5E]">
                    <span className="w-5 h-5 rounded-full bg-[#1A0A5E] text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    Scan QR Code
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-200 inline-block shadow-sm">
                    {setupTwoFactor.otpauthUri && (
                      <QRCode value={setupTwoFactor.otpauthUri} size={150} fgColor="#1A0A5E" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">
                      Can&apos;t scan? Enter key manually:
                    </span>
                    <div className="flex items-center gap-2 max-w-sm">
                      <code className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-800 break-all select-all flex-1">
                        {setupTwoFactor.secret}
                      </code>
                      <button
                        type="button"
                        onClick={copySecretKey}
                        className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 hover:text-[#1A0A5E] transition"
                        title="Copy key"
                      >
                        {copiedSecret ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1A0A5E]">
                    <span className="w-5 h-5 rounded-full bg-[#1A0A5E] text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    Verify 6-Digit Code
                  </div>
                  <p className="text-xs text-gray-600">
                    Enter the code generated by your authenticator app to confirm setup:
                  </p>
                  <form onSubmit={verifyAndActivate2FA} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={twoFactorCode}
                        onChange={(e) =>
                          setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        placeholder="123456"
                        className="w-full max-w-xs px-4 py-2.5 text-center text-lg font-mono tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent bg-white"
                        autoComplete="one-time-code"
                        autoFocus
                        required
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isVerifying2FA || twoFactorCode.length !== 6}
                        className="rounded-xl bg-[#1A0A5E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#120843] transition disabled:opacity-50"
                      >
                        {isVerifying2FA ? 'Verifying...' : 'Verify & Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSetupTwoFactor(null);
                          setTwoFactorCode('');
                        }}
                        className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
