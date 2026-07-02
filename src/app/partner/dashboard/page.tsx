'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, ShieldAlert, CheckCircle, User, ArrowRight, Power, Loader } from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';

interface PartnerProfile {
  id: string;
  businessName: string;
  ownerName: string;
  approvalStatus: string;
  workloadStatus: string;
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingWorkload, setIsTogglingWorkload] = useState(false);

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
      setPartner(data.partner);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWorkload = async () => {
    if (!partner || partner.approvalStatus !== 'APPROVED') return;
    setIsTogglingWorkload(true);
    try {
      const newStatus = partner.workloadStatus === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
      const response = await fetch('/api/partner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          businessName: partner.businessName,
          ownerName: partner.ownerName,
          address: '',
          workloadStatus: newStatus,
        }),
      });
      if (!response.ok) throw new Error('Failed to update workload');
      setPartner({ ...partner, workloadStatus: newStatus });
      toast.success(`Status set to ${newStatus === 'AVAILABLE' ? 'Available' : 'Busy'}`);
    } catch {
      toast.error('Failed to update workload status');
    } finally {
      setIsTogglingWorkload(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="inline-block animate-spin text-[#1A0A5E]" size={32} />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  const isApproved = partner?.approvalStatus === 'APPROVED';
  const isSuspended = partner?.approvalStatus === 'SUSPENDED';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <AppLogo size={32} src="/images/logo.jpeg" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1A0A5E]">{partner?.businessName ?? 'Partner Dashboard'}</h1>
            <p className="text-xs text-gray-500">{partner?.ownerName}</p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              isApproved ? 'bg-green-100 text-green-700' : isSuspended ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {partner?.approvalStatus ?? 'PENDING'}
          </span>
          <Link href="/partner/profile" className="text-sm font-semibold text-[#1A0A5E] hover:underline flex items-center gap-1">
            <User size={16} /> Profile
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Approval banners */}
        {!isApproved && !isSuspended && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
            <Clock size={22} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Account Pending Approval</p>
              <p className="text-sm text-amber-800 mt-1">
                Your partner application is under review. Once approved by an admin, you'll be able
                to update your business profile, bank details, and start receiving orders.
              </p>
            </div>
          </div>
        )}

        {isSuspended && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-4">
            <ShieldAlert size={22} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Account Suspended</p>
              <p className="text-sm text-red-800 mt-1">
                Your account has been suspended. Contact{' '}
                <a href="mailto:info.247sparkle@gmail.com" className="underline">
                  info.247sparkle@gmail.com
                </a>{' '}
                for assistance.
              </p>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 flex items-start gap-4">
            <CheckCircle size={22} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-900">Account Approved</p>
              <p className="text-sm text-green-800 mt-1">
                Your account is active. Keep your profile and bank details up to date to receive payouts.
              </p>
            </div>
          </div>
        )}

        {/* Workload toggle */}
        <div className={`bg-white rounded-2xl border p-6 shadow-sm ${!isApproved ? 'opacity-60 border-gray-100' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1A0A5E] flex items-center gap-2">
                <Power size={20} />
                Workload Status
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {!isApproved
                  ? 'Available after account approval'
                  : partner?.workloadStatus === 'AVAILABLE'
                  ? 'You are accepting new orders'
                  : 'You are not accepting new orders'}
              </p>
            </div>
            <button
              onClick={toggleWorkload}
              disabled={isTogglingWorkload || !isApproved}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                partner?.workloadStatus === 'AVAILABLE' && isApproved ? 'bg-green-500' : 'bg-gray-300'
              } disabled:cursor-not-allowed`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  partner?.workloadStatus === 'AVAILABLE' && isApproved ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/partner/profile"
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex items-center justify-between group"
          >
            <div>
              <p className="font-bold text-[#1A0A5E]">Business Profile</p>
              <p className="text-sm text-gray-500 mt-1">
                {isApproved ? 'Update details & bank info' : 'View your submitted details'}
              </p>
            </div>
            <ArrowRight size={20} className="text-gray-400 group-hover:text-[#1A0A5E] transition" />
          </Link>

          <div className={`bg-white rounded-2xl border p-6 shadow-sm ${!isApproved ? 'opacity-50 border-gray-100' : 'border-gray-200'}`}>
            <p className="font-bold text-[#1A0A5E]">Incoming Orders</p>
            <p className="text-sm text-gray-500 mt-1">
              {isApproved ? 'No orders assigned yet' : 'Available after approval'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
