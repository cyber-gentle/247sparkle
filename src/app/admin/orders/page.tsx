'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader, Search, UserPlus, ArrowRightCircle, Store } from 'lucide-react';
import { toast } from 'sonner';

type Order = {
  id: string;
  serviceType: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  customer: { user: { fullName: string; email: string; phone: string } };
  rider?: { user: { fullName: string } } | null;
  partner?: { businessName: string } | null;
  items: { id: string }[];
};

type RiderOption = {
  id: string;
  approvalStatus: string;
  availabilityStatus: string;
  user: { fullName: string; email: string };
};

type PartnerOption = {
  id: string;
  businessName: string;
  approvalStatus: string;
  workloadStatus: string;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID_UNASSIGNED: 'bg-amber-100 text-amber-700',
  RIDER_ASSIGNED: 'bg-blue-100 text-blue-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  IN_CLEANING: 'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PAYMENT_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  UNPAID: 'bg-rose-100 text-rose-700',
  FAILED: 'bg-red-100 text-red-700',
};

// Valid manual progression targets per current status. Mirrors the order state
// machine in src/lib/order-state.ts (excluding CANCELLED); the laundry track
// needs a rider while the on-site track (fumigation/cleaning) is riderless —
// the API enforces the pairing, this map just drives the dropdown.
const NEXT_STATUSES: Record<string, string[]> = {
  PAID_UNASSIGNED: ['SCHEDULED'],
  RIDER_ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['IN_CLEANING'],
  IN_CLEANING: ['OUT_FOR_DELIVERY'],
  SCHEDULED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  OUT_FOR_DELIVERY: ['COMPLETED'],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<RiderOption[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [busyId, setBusyId] = useState('');
  // Per-order form state, keyed by order id.
  const [riderSelections, setRiderSelections] = useState<Record<string, string>>({});
  const [statusSelections, setStatusSelections] = useState<Record<string, string>>({});
  const [partnerSelections, setPartnerSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
    loadRiders();
    loadPartners();
  }, []);

  async function load() {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  async function loadRiders() {
    try {
      const res = await fetch('/api/admin/riders');
      const data = await res.json();
      setRiders((data.riders ?? []).filter((r: RiderOption) => r.approvalStatus === 'APPROVED'));
    } catch {
      // Non-fatal: assignment UI simply shows no options until retried.
    }
  }

  async function loadPartners() {
    try {
      const res = await fetch('/api/admin/partners');
      const data = await res.json();
      setPartners(
        (data.partners ?? []).filter((p: PartnerOption) => p.approvalStatus === 'APPROVED')
      );
    } catch {
      // Non-fatal: routing UI simply shows no options until retried.
    }
  }

  async function assignPartner(orderId: string) {
    const partnerId = partnerSelections[orderId];
    if (!partnerId) {
      toast.error('Select a partner first');
      return;
    }
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign-partner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Routing failed');
        return;
      }
      toast.success('Order routed to partner');
      load();
    } catch {
      toast.error('Network error');
    } finally {
      setBusyId('');
    }
  }

  async function assignRider(orderId: string) {
    const riderId = riderSelections[orderId];
    if (!riderId) {
      toast.error('Select a rider first');
      return;
    }
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Assignment failed');
        return;
      }
      toast.success('Rider assigned');
      load();
    } catch {
      toast.error('Network error');
    } finally {
      setBusyId('');
    }
  }

  async function updateStatus(orderId: string) {
    const status =
      statusSelections[orderId] ??
      NEXT_STATUSES[orders.find((o) => o.id === orderId)?.status ?? '']?.[0];
    if (!status) {
      toast.error('Select a status first');
      return;
    }
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Status update failed');
        return;
      }
      toast.success(`Order moved to ${status.replace(/_/g, ' ').toLowerCase()}`);
      load();
    } catch {
      toast.error('Network error');
    } finally {
      setBusyId('');
    }
  }

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      o.customer.user.fullName.toLowerCase().includes(q) ||
      o.customer.user.email.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.serviceType.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const statuses = [
    'ALL',
    'PENDING',
    'PAID_UNASSIGNED',
    'RIDER_ASSIGNED',
    'PICKED_UP',
    'IN_CLEANING',
    'OUT_FOR_DELIVERY',
    'COMPLETED',
    'CANCELLED',
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">
            Admin Portal
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1A0A5E]">Orders Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor all platform orders across every service type and status.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/riders"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Riders
            </Link>
            <Link
              href="/admin/pricing"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Pricing
            </Link>
          </div>
        </header>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, email, order ID, or service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A0A5E]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A0A5E]"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="animate-spin text-[#1A0A5E]" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Rider</th>
                    <th className="px-5 py-3">Partner</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">
                        ORD-{order.id.slice(0, 6).toUpperCase()}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {order.customer.user.fullName}
                        </p>
                        <p className="text-xs text-slate-500">{order.customer.user.phone}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {order.serviceType.replace(/_/g, ' ')}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${PAYMENT_COLORS[order.paymentStatus] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#1A0A5E]">
                        ₦{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {order.rider?.user.fullName ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {order.partner?.businessName ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        {busyId === order.id ? (
                          <Loader size={16} className="animate-spin text-slate-400" />
                        ) : order.paymentStatus === 'PAID' &&
                          order.status === 'PAID_UNASSIGNED' &&
                          !order.rider &&
                          order.serviceType === 'LAUNDRY' ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={riderSelections[order.id] ?? ''}
                              onChange={(e) =>
                                setRiderSelections((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A0A5E]"
                            >
                              <option value="">Select rider…</option>
                              {riders.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.user.fullName}
                                  {r.availabilityStatus === 'WORKING' ? ' ●' : ' ○'}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => assignRider(order.id)}
                              title="Assign rider to this order"
                              className="rounded-lg bg-[#1A0A5E] p-1.5 text-white hover:bg-[#2a1a7e]"
                            >
                              <UserPlus size={14} />
                            </button>
                          </div>
                        ) : NEXT_STATUSES[order.status] &&
                          (order.rider || order.serviceType !== 'LAUNDRY') ? (
                          <div className="flex items-center gap-1.5">
                            {!order.partner &&
                              ['PICKED_UP', 'IN_CLEANING'].includes(order.status) && (
                                <select
                                  value={partnerSelections[order.id] ?? ''}
                                  onChange={(e) =>
                                    setPartnerSelections((prev) => ({
                                      ...prev,
                                      [order.id]: e.target.value,
                                    }))
                                  }
                                  title="Route to cleaning partner"
                                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A0A5E]"
                                >
                                  <option value="">Route to partner…</option>
                                  {partners.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.businessName}
                                      {p.workloadStatus === 'AVAILABLE' ? ' ●' : ' ○'}
                                    </option>
                                  ))}
                                </select>
                              )}
                            {!order.partner &&
                              ['PICKED_UP', 'IN_CLEANING'].includes(order.status) && (
                                <button
                                  onClick={() => assignPartner(order.id)}
                                  title="Route order to selected partner"
                                  className="rounded-lg bg-[#1A0A5E] p-1.5 text-white hover:bg-[#2a1a7e]"
                                >
                                  <Store size={14} />
                                </button>
                              )}
                            <select
                              value={statusSelections[order.id] ?? NEXT_STATUSES[order.status][0]}
                              onChange={(e) =>
                                setStatusSelections((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A0A5E]"
                            >
                              {NEXT_STATUSES[order.status].map((s) => (
                                <option key={s} value={s}>
                                  {s.replace(/_/g, ' ')}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => updateStatus(order.id)}
                              title="Advance order status"
                              className="rounded-lg bg-[#F5C200] p-1.5 text-[#1A0A5E] hover:bg-[#E6B000]"
                            >
                              <ArrowRightCircle size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
