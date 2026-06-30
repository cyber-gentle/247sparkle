'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Mail, Phone, MapPin, Save, Lock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface Address {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address: '' });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/customer/profile', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/customer/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (data.customer) {
        setValue('fullName', data.customer.fullName);
        setValue('email', data.customer.email);
        setValue('phone', data.customer.phone || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/customer/addresses', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/customer/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      resetPasswordForm();
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.label || !newAddress.address) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newAddress),
      });

      if (!response.ok) throw new Error('Failed to add address');

      toast.success('Address added');
      setNewAddress({ label: '', address: '' });
      setShowAddressForm(false);
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to add address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;

    try {
      const response = await fetch(`/api/customer/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete address');

      toast.success('Address deleted');
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A0A5E]"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#F5C200]/10">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/customer-dashboard" className="text-gray-600 hover:text-[#1A0A5E]">
            <ArrowLeft size={20} />
          </Link>
          <AppLogo size={32} src="/images/logo.jpeg" />
          <h1 className="text-xl font-bold text-[#1A0A5E]">My Profile</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#1A0A5E] mb-6 flex items-center gap-2">
            <User size={20} />
            Personal Information
          </h2>
          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                {...register('fullName')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent"
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#1A0A5E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#120843] disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Saved Addresses */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#1A0A5E] flex items-center gap-2">
              <MapPin size={20} />
              Saved Addresses
            </h2>
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#120843] flex items-center gap-2"
            >
              <Plus size={16} />
              Add Address
            </button>
          </div>

          {showAddressForm && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <input
                type="text"
                placeholder="Label (e.g., Home, Office)"
                value={newAddress.label}
                onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="Full address"
                value={newAddress.address}
                onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddAddress}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowAddressForm(false)}
                  className="rounded-lg bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {addresses.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No saved addresses yet</p>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <div key={addr.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-[#1A0A5E]">{addr.label}</p>
                    <p className="text-sm text-gray-600">{addr.address}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
              <input
                type="password"
                {...registerPassword('currentPassword')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent"
              />
              {passwordErrors.currentPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                {...registerPassword('newPassword')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent"
              />
              {passwordErrors.newPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                {...registerPassword('confirmPassword')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:border-transparent"
              />
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
