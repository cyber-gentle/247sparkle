'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Download, Wallet, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';

interface Commission {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
  order?: {
    serviceType: string;
    totalAmount: number;
  };
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
  processedAt?: string;
}

export default function RiderEarningsPage() {
  const router = useRouter();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await fetch('/api/rider/earnings', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/rider/login');
          return;
        }
        throw new Error('Failed to fetch earnings');
      }

      const data = await response.json();
      setCommissions(data.commissions || []);
      setWithdrawals(data.withdrawals || []);
      setWalletBalance(data.walletBalance || 0);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > walletBalance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      const response = await fetch('/api/rider/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request withdrawal');
      }

      toast.success('Withdrawal request submitted');
      setShowWithdrawForm(false);
      setWithdrawAmount('');
      fetchEarnings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to request withdrawal');
    }
  };

  const totalEarnings = commissions
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingEarnings = commissions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + c.amount, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle2 size={16} className="text-green-600" />;
      case 'PENDING': return <Clock size={16} className="text-yellow-600" />;
      case 'REJECTED': return <XCircle size={16} className="text-red-600" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A0A5E]"></div>
          <p className="mt-4 text-gray-600">Loading earnings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#F5C200]/10">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/rider/dashboard" className="text-gray-600 hover:text-[#1A0A5E]">
            <ArrowLeft size={20} />
          </Link>
          <AppLogo size={32} src="/images/logo.jpeg" />
          <h1 className="text-xl font-bold text-[#1A0A5E]">My Earnings</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#1A0A5E] to-[#2D3FE6] rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Wallet size={24} />
              <span className="text-xs bg-white/20 px-2 py-1 rounded">Available</span>
            </div>
            <p className="text-3xl font-bold">₦{walletBalance.toLocaleString()}</p>
            <p className="text-sm text-white/80 mt-1">Wallet Balance</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <p className="text-3xl font-bold text-[#1A0A5E]">₦{totalEarnings.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Total Earned</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-[#1A0A5E]">₦{pendingEarnings.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Pending</p>
          </div>
        </div>

        {/* Withdraw Button */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1A0A5E]">Withdraw Funds</h2>
              <p className="text-sm text-gray-600">Transfer earnings to your bank account</p>
            </div>
            <button
              onClick={() => setShowWithdrawForm(!showWithdrawForm)}
              disabled={walletBalance <= 0}
              className="rounded-xl bg-[#1A0A5E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#120843] disabled:opacity-50"
            >
              Request Withdrawal
            </button>
          </div>

          {showWithdrawForm && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₦)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Max: ₦${walletBalance.toLocaleString()}`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleWithdraw}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => setShowWithdrawForm(false)}
                  className="rounded-lg bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Commissions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-[#1A0A5E] mb-4">Commission History</h2>
          {commissions.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No commissions yet</p>
          ) : (
            <div className="space-y-2">
              {commissions.map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(commission.status)}
                    <div>
                      <p className="font-semibold text-[#1A0A5E]">
                        {commission.order?.serviceType?.replace(/_/g, ' ') || 'Service'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(commission.createdAt)} • Order #{commission.orderId.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1A0A5E]">₦{commission.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{commission.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawal History */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-[#1A0A5E] mb-4">Withdrawal History</h2>
          {withdrawals.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No withdrawal requests</p>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(withdrawal.status)}
                    <div>
                      <p className="font-semibold text-[#1A0A5E]">₦{withdrawal.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        Requested: {formatDate(withdrawal.requestedAt)}
                        {withdrawal.processedAt && ` • Processed: ${formatDate(withdrawal.processedAt)}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{withdrawal.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
