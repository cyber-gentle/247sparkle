'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock, ArrowRight, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
    id: string;
    phone: string;
    email: string;
  };
  itemCount: number;
  createdAt: string;
}

export default function RiderDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/riders/jobs');
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const data = await response.json();
        setJobs(data.jobs || []);
      } catch (error: any) {
        toast.error('Failed to load jobs');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

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

      toast.success('Job accepted! Navigate to it for details.');
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (error: any) {
      toast.error('Error accepting job');
      console.error(error);
    } finally {
      setAcceptingJobId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Jobs</h1>
          <p className="text-gray-600">
            {isLoading ? 'Loading jobs...' : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Jobs Grid */}
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
                    <a href={`tel:${job.customer.phone}`} className="text-blue-600 hover:underline">
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
                  <div>
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
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
      </div>
    </main>
  );
}

