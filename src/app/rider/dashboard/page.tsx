'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  Loader,
  AlertCircle,
  User,
  DollarSign,
  LogOut,
  Power,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';

interface Job {
  id: string;
  orderNumber: string;
  serviceType: string;
  status: string;
  totalAmount: number;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledDate: string;
  customer: {
    phone: string;
  };
  itemCount: number;
  createdAt: string;
}

interface AssignedJob extends Job {
  customer: {
    name: string;
    phone: string;
  };
}

interface RiderSummary {
  fullName: string;
  approvalStatus: string;
  availabilityStatus: string;
  walletBalance: number;
}

interface EarningsSummary {
  today: number;
  thisWeek: number;
  allTime: number;
}

const STATUS_COLORS: Record<string, string> = {
  RIDER_ASSIGNED: 'bg-blue-100 text-blue-800',
  PICKED_UP: 'bg-yellow-100 text-yellow-800',
  IN_CLEANING: 'bg-purple-100 text-purple-800',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

export default function RiderDashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<AssignedJob[]>([]);
  const [rider, setRider] = useState<RiderSummary | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch('/api/riders/jobs');
      if (response.status === 401) {
        router.push('/rider/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
      setAssignedJobs(data.assignedJobs || []);
      setRider(data.rider || null);
      setEarnings(data.earnings || null);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/rider/login');
  }

  const handleAcceptJob = async (jobId: string) => {
    setAcceptingJobId(jobId);
    try {
      const response = await fetch(`/api/riders/jobs/${jobId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: jobId }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to accept job');
        return;
      }

      toast.success('Job accepted! Find it below under Your Jobs.');
      // Refresh: the job moves from "available" to "assigned to me".
      fetchDashboard();
    } catch {
      toast.error('Error accepting job');
    } finally {
      setAcceptingJobId(null);
    }
  };

  const toggleAvailability = async () => {
    if (!rider) return;
    setIsTogglingAvailability(true);
    try {
      const newStatus = rider.availabilityStatus === 'WORKING' ? 'OFF_DUTY' : 'WORKING';
      const response = await fetch('/api/rider/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availabilityStatus: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      setRider({ ...rider, availabilityStatus: newStatus });
      toast.success(`You are now ${newStatus === 'WORKING' ? 'on duty' : 'off duty'}`);
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const isWorking = rider?.availabilityStatus === 'WORKING';
  const isApproved = rider?.approvalStatus === 'APPROVED';

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <AppLogo size={32} src="/images/logo.jpeg" />
          <h1 className="text-xl font-bold text-[#1A0A5E] flex-1">
            {rider ? `Welcome back, ${rider.fullName.split(' ')[0]}` : 'Rider Dashboard'}
          </h1>
          <Link
            href="/rider/earnings"
            className="text-sm font-semibold text-[#1A0A5E] hover:underline flex items-center gap-1"
          >
            <DollarSign size={16} /> Earnings
          </Link>
          <Link
            href="/rider/profile"
            className="text-sm font-semibold text-[#1A0A5E] hover:underline flex items-center gap-1"
          >
            <User size={16} /> Profile
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-red-600 hover:underline flex items-center gap-1"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
        {/* Availability + earnings summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Availability</p>
              {rider ? (
                <p className={`font-bold mt-1 ${isWorking ? 'text-green-600' : 'text-gray-500'}`}>
                  {isWorking ? 'On Duty' : 'Off Duty'}
                </p>
              ) : (
                <p className="text-gray-400 mt-1">—</p>
              )}
              {!isApproved && rider && (
                <p className="text-xs text-amber-600 mt-1">Pending approval</p>
              )}
            </div>
            {rider && (
              <button
                onClick={toggleAvailability}
                disabled={!isApproved || isTogglingAvailability}
                title={
                  isApproved
                    ? 'Toggle on/off duty'
                    : 'Available once an admin approves your account'
                }
                className={`w-12 h-6 rounded-full relative transition-colors disabled:opacity-50 ${
                  isWorking ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                    isWorking ? 'left-6' : 'left-0.5'
                  }`}
                />
              </button>
            )}
          </div>
          {[
            { label: 'Earned Today', value: earnings?.today },
            { label: 'This Week', value: earnings?.thisWeek },
            { label: 'Wallet Balance', value: earnings?.allTime },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-xs font-semibold uppercase text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-[#1A0A5E] mt-1">
                ₦{(card.value ?? 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Your in-flight jobs */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase size={20} className="text-[#1A0A5E]" /> Your Jobs
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {isLoading
                ? 'Loading...'
                : `${assignedJobs.length} job${assignedJobs.length !== 1 ? 's' : ''} in progress`}
            </p>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="animate-spin text-blue-600" size={32} />
            </div>
          ) : assignedJobs.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-600">No active jobs right now</p>
              <p className="text-gray-500 text-sm">Accept a job below to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{job.orderNumber}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{job.customer.name}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-sm space-y-1 text-gray-600 mb-4">
                    <p className="flex items-start gap-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <span className="truncate">{job.pickupAddress}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400 shrink-0" />
                      {job.itemCount} item{job.itemCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link
                    href={`/rider/job/${job.id}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Open Job <ArrowRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Available jobs */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Available Jobs</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {isLoading
                ? 'Loading jobs...'
                : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="animate-spin text-blue-600" size={32} />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <AlertCircle className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-gray-600 text-lg mb-2">No available jobs right now</p>
              <p className="text-gray-500 text-sm">Check back soon or wait for new orders</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-5"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{job.orderNumber}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {job.serviceType.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                      ₦{job.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-gray-400" />
                      <a
                        href={`tel:${job.customer.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {job.customer.phone}
                      </a>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin size={14} className="text-gray-400 mt-0.5" />
                      <div className="text-gray-600">
                        <div className="text-xs text-gray-400 mb-1">Pickup:</div>
                        <p>{job.pickupAddress?.slice(0, 40)}...</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm ml-6">
                      <div className="text-gray-600">
                        <div className="text-xs text-gray-400 mb-1">Delivery:</div>
                        <p>{job.deliveryAddress?.slice(0, 40)}...</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <div>
                      <Clock size={12} className="inline mr-1" />
                      {job.itemCount} item{job.itemCount !== 1 ? 's' : ''}
                    </div>
                    <div>Posted {new Date(job.createdAt).toLocaleDateString()}</div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => handleAcceptJob(job.id)}
                    disabled={acceptingJobId === job.id}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {acceptingJobId === job.id ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        Accept Job
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
