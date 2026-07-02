'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader, Shield, ExternalLink, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

type Certificate = {
  certificateNumber: string;
  customerName: string;
  propertyAddress: string;
  propertyType: string;
  serviceDate: string;
  issuedAt: string;
};

type FumigationOrder = {
  id: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  customer: { user: { fullName: string; phone: string } };
  deliveryAddress?: string;
  certificate?: { certificateNumber: string } | null;
};

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [orders, setOrders] = useState<FumigationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      const fumigationOrders: FumigationOrder[] = (data.orders ?? []).filter(
        (o: any) => o.serviceType === 'FUMIGATION'
      );
      setOrders(fumigationOrders);

      // Collect issued certificates from orders
      const issued: Certificate[] = fumigationOrders
        .filter(o => o.certificate)
        .map(o => ({
          certificateNumber: o.certificate!.certificateNumber,
          customerName: o.customer.user.fullName,
          propertyAddress: o.deliveryAddress ?? '—',
          propertyType: '—',
          serviceDate: o.createdAt,
          issuedAt: o.createdAt,
        }));
      setCertificates(issued);
    } catch {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }

  const eligibleOrders = orders.filter(
    o => o.status === 'COMPLETED' && o.paymentStatus === 'PAID' && !o.certificate
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#CC0000]">Admin Portal</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1A0A5E]">Fumigation Certificates</h1>
          <p className="mt-1 text-sm text-slate-600">
            Issue certificates for completed fumigation orders. Certificate format: SPKFUM-YYYY-XXXXX.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/admin/dashboard" className="rounded-xl bg-[#1A0A5E] px-4 py-2 text-sm font-semibold text-white">Dashboard</Link>
            <Link href="/verify" target="_blank" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 flex items-center gap-1">
              Public Verify <ExternalLink size={14} />
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="animate-spin text-[#1A0A5E]" size={28} />
          </div>
        ) : (
          <>
            {/* Eligible orders awaiting certificate */}
            {eligibleOrders.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <h2 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <PlusCircle size={18} /> {eligibleOrders.length} Completed Order{eligibleOrders.length > 1 ? 's' : ''} Awaiting Certificate
                </h2>
                <div className="space-y-2">
                  {eligibleOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between bg-white rounded-xl border border-amber-200 px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-800">{order.customer.user.fullName}</p>
                        <p className="text-xs text-slate-500">{order.deliveryAddress ?? '—'} · {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Link
                        href={`/admin/orders`}
                        className="rounded-lg bg-[#1A0A5E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#120843]"
                      >
                        View Order
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issued certificates */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Shield size={18} className="text-[#1A0A5E]" />
                <h2 className="font-bold text-[#1A0A5E]">Issued Certificates ({certificates.length})</h2>
              </div>
              {certificates.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">No certificates issued yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Certificate #</th>
                        <th className="px-5 py-3">Customer</th>
                        <th className="px-5 py-3">Property</th>
                        <th className="px-5 py-3">Issued</th>
                        <th className="px-5 py-3">Verify</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map(cert => (
                        <tr key={cert.certificateNumber} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-5 py-3 font-mono font-semibold text-[#1A0A5E]">{cert.certificateNumber}</td>
                          <td className="px-5 py-3 text-slate-700">{cert.customerName}</td>
                          <td className="px-5 py-3 text-slate-600 max-w-xs truncate">{cert.propertyAddress}</td>
                          <td className="px-5 py-3 text-slate-500">{new Date(cert.issuedAt).toLocaleDateString()}</td>
                          <td className="px-5 py-3">
                            <Link
                              href={`/verify?number=${cert.certificateNumber}`}
                              target="_blank"
                              className="text-[#1A0A5E] hover:underline text-xs font-semibold flex items-center gap-1"
                            >
                              Verify <ExternalLink size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
