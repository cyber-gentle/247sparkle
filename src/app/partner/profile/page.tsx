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
} from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';

const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

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
    newPassword: z.string().min(6),
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

  const isApproved = approvalStatus === 'APPROVED';

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
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/partner/profile', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) { router.push('/partner/login'); return; }
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
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
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
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
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
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Business Name</label>
                <input type="text" {...register('businessName')} disabled={!isApproved} className={fieldClass(!!errors.businessName, !isApproved)} />
                {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Owner Name</label>
                <input type="text" {...register('ownerName')} disabled={!isApproved} className={fieldClass(!!errors.ownerName, !isApproved)} />
                {errors.ownerName && <p className="text-red-500 text-sm mt-1">{errors.ownerName.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input type="tel" {...register('phone')} disabled={!isApproved} className={fieldClass(!!errors.phone, !isApproved)} />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <MapPin size={14} /> Business Address
              </label>
              <textarea {...register('address')} rows={2} disabled={!isApproved} className={fieldClass(!!errors.address, !isApproved)} />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>

            {/* Operating Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Opening Time</label>
                <input type="time" {...register('openingTime')} disabled={!isApproved} className={fieldClass(false, !isApproved)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Closing Time</label>
                <input type="time" {...register('closingTime')} disabled={!isApproved} className={fieldClass(false, !isApproved)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Days of Opening</label>
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
        <div className={`bg-white rounded-2xl border p-8 shadow-sm ${!isApproved ? 'border-gray-100' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-bold mb-2 flex items-center gap-2 ${isApproved ? 'text-[#1A0A5E]' : 'text-gray-400'}`}>
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
                <select
                  {...register('bankName')}
                  disabled={!isApproved}
                  onChange={(e) => {
                    const bank = NIGERIAN_BANKS.find((b) => b.name === e.target.value);
                    if (bank) setValue('bankCode', bank.code);
                  }}
                  className={fieldClass(false, !isApproved)}
                >
                  <option value="">Select Bank</option>
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b.code} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <CreditCard size={14} /> Bank Code
                </label>
                <input type="text" {...register('bankCode')} readOnly className={fieldClass(false, true)} placeholder="Auto-filled" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Account Number</label>
                <input type="text" {...register('accountNumber')} disabled={!isApproved} maxLength={10} placeholder="10 digits" className={fieldClass(false, !isApproved)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <User size={14} /> Account Name
                </label>
                <input type="text" {...register('accountName')} disabled={!isApproved} className={fieldClass(false, !isApproved)} />
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
              <input type="password" {...registerPassword('currentPassword')} className={fieldClass(!!passwordErrors.currentPassword)} />
              {passwordErrors.currentPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
              <input type="password" {...registerPassword('newPassword')} className={fieldClass(!!passwordErrors.newPassword)} />
              {passwordErrors.newPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" {...registerPassword('confirmPassword')} className={fieldClass(!!passwordErrors.confirmPassword)} />
              {passwordErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="rounded-xl bg-[#1A0A5E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#120843] disabled:opacity-50"
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
