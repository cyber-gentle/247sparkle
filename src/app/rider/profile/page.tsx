'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Save, Banknote, Power, Lock, Clock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';

const profileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(5),
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
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

function PendingBanner() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
      <div className="flex-shrink-0 mt-0.5">
        <Clock size={22} className="text-amber-500" />
      </div>
      <div>
        <p className="font-bold text-amber-900">Account Pending Approval</p>
        <p className="text-sm text-amber-800 mt-1">
          Your rider account is under review. Once an admin approves your account, you'll be able
          to update your bank details and start accepting jobs.
        </p>
      </div>
    </div>
  );
}

function SuspendedBanner() {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-4">
      <div className="flex-shrink-0 mt-0.5">
        <ShieldAlert size={22} className="text-red-500" />
      </div>
      <div>
        <p className="font-bold text-red-900">Account Suspended</p>
        <p className="text-sm text-red-800 mt-1">
          Your account has been suspended. Please contact support at{' '}
          <a href="mailto:info.247sparkle@gmail.com" className="underline">
            info.247sparkle@gmail.com
          </a>{' '}
          for assistance.
        </p>
      </div>
    </div>
  );
}

export default function RiderProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState('OFF_DUTY');
  const [approvalStatus, setApprovalStatus] = useState('PENDING');
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

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
      const response = await fetch('/api/rider/profile', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) { router.push('/rider/login'); return; }
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      if (data.rider) {
        setValue('fullName', data.rider.fullName);
        setValue('phone', data.rider.phone);
        setValue('address', data.rider.address || '');
        setValue('bankName', data.rider.bankName || '');
        setValue('bankCode', data.rider.bankCode || '');
        setValue('accountNumber', data.rider.accountNumber || '');
        setValue('accountName', data.rider.accountName || '');
        setAvailabilityStatus(data.rider.availabilityStatus);
        setApprovalStatus(data.rider.approvalStatus);
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
      const response = await fetch('/api/rider/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
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
      const response = await fetch('/api/rider/password', {
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

  const toggleAvailability = async () => {
    if (!isApproved) return;
    setIsTogglingStatus(true);
    try {
      const newStatus = availabilityStatus === 'WORKING' ? 'OFF_DUTY' : 'WORKING';
      const response = await fetch('/api/rider/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ availabilityStatus: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      setAvailabilityStatus(newStatus);
      toast.success(`You are now ${newStatus === 'WORKING' ? 'on duty' : 'off duty'}`);
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setIsTogglingStatus(false);
    }
  };

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

  const fieldClass = (hasError: boolean, disabled = false) =>
    `w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent ${
      hasError ? 'border-red-400' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : ''}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#F5C200]/10">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/rider/dashboard" className="text-gray-600 hover:text-[#1A0A5E]">
            <ArrowLeft size={20} />
          </Link>
          <AppLogo size={32} src="/images/logo.jpeg" />
          <h1 className="text-xl font-bold text-[#1A0A5E]">My Profile</h1>
          <span
            className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${
              approvalStatus === 'APPROVED'
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
        {approvalStatus === 'PENDING' && <PendingBanner />}
        {approvalStatus === 'SUSPENDED' && <SuspendedBanner />}

        {/* Availability Toggle */}
        <div className={`bg-white rounded-2xl border p-6 shadow-sm ${!isApproved ? 'opacity-60' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1A0A5E] flex items-center gap-2">
                <Power size={20} />
                Availability Status
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {!isApproved
                  ? 'Available after account approval'
                  : availabilityStatus === 'WORKING'
                  ? 'You are currently accepting jobs'
                  : 'You are not accepting jobs'}
              </p>
            </div>
            <button
              onClick={toggleAvailability}
              disabled={isTogglingStatus || !isApproved}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                availabilityStatus === 'WORKING' && isApproved ? 'bg-green-500' : 'bg-gray-300'
              } disabled:cursor-not-allowed`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  availabilityStatus === 'WORKING' && isApproved ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#1A0A5E] mb-6 flex items-center gap-2">
            <User size={20} />
            Personal Information
          </h2>
          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input type="text" {...register('fullName')} disabled={!isApproved} className={fieldClass(!!errors.fullName, !isApproved)} />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input type="tel" {...register('phone')} disabled={!isApproved} className={fieldClass(!!errors.phone, !isApproved)} />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
              <textarea {...register('address')} rows={2} disabled={!isApproved} className={fieldClass(!!errors.address, !isApproved)} />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bank Name</label>
                <input type="text" {...register('bankName')} disabled={!isApproved} placeholder="e.g., GTBank" className={fieldClass(false, !isApproved)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bank Code</label>
                <input type="text" {...register('bankCode')} disabled={!isApproved} placeholder="e.g., 058" className={fieldClass(false, !isApproved)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Account Number</label>
              <input type="text" {...register('accountNumber')} disabled={!isApproved} placeholder="10 digits" className={fieldClass(false, !isApproved)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Account Name</label>
              <input type="text" {...register('accountName')} disabled={!isApproved} className={fieldClass(false, !isApproved)} />
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
