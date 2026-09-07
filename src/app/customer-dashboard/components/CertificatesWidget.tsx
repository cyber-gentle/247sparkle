'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, ShieldCheck, ExternalLink, Loader } from 'lucide-react';

interface Certificate {
  id: string;
  certificateNumber: string;
  propertyAddress: string;
  propertyType: string;
  serviceDate: string;
  issuedAt: string;
}

export default function CertificatesWidget() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const res = await fetch('/api/certificates/customer/me');
        if (res.ok) {
          const data = await res.json();
          setCertificates(data.certificates ?? []);
        }
      } catch (err) {
        console.error('Failed to load certificates widget data', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCertificates();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600" />
          <h3 className="text-sm font-bold text-[#1A0A5E]">Fumigation Certificates</h3>
        </div>
        <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
          {isLoading ? '...' : `${certificates.length} Issued`}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="py-8 text-center">
            <Loader className="animate-spin text-[#1A0A5E] mx-auto mb-2" size={20} />
            <p className="text-xs text-gray-400">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="py-6 px-2 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck size={20} />
            </div>
            <p className="text-xs font-semibold text-slate-700">No certificates yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Complete a fumigation service to receive your verified digital certificate.
            </p>
            <Link
              href="/customer/new-order"
              className="mt-3 inline-block text-xs font-bold text-[#1A0A5E] hover:underline"
            >
              Book Fumigation →
            </Link>
          </div>
        ) : (
          certificates.slice(0, 3).map((cert) => (
            <div
              key={cert.id || cert.certificateNumber}
              className="flex items-start justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText size={14} className="text-emerald-700" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1A0A5E] font-mono">
                    {cert.certificateNumber}
                  </div>
                  <div className="text-[11px] text-gray-600 font-medium mt-0.5">
                    {cert.propertyType}
                  </div>
                  <div className="text-[10px] text-gray-400 max-w-[180px] truncate">
                    {cert.propertyAddress}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/verify?number=${encodeURIComponent(cert.certificateNumber)}`}
                  className="text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Verify
                </Link>
              </div>
            </div>
          ))
        )}

        {certificates.length > 3 && (
          <div className="pt-1 text-center">
            <Link
              href="/customer/certificates"
              className="text-xs font-semibold text-[#1A0A5E] hover:underline"
            >
              View all {certificates.length} certificates →
            </Link>
          </div>
        )}

        <Link
          href="/verify"
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-gray-500 hover:text-[#1A0A5E] transition-colors border-t border-gray-100 mt-2 pt-3"
        >
          <ExternalLink size={12} />
          Public certificate lookup tool
        </Link>
      </div>
    </div>
  );
}
