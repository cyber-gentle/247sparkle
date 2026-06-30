import React from 'react';
import { FileText, Download, ShieldCheck, ExternalLink } from 'lucide-react';

const CERTS = [
  {
    id: 'cert-spk-001',
    certNumber: 'SPKFUM-2026-00012',
    property: '2 Rooms Apartment, Ikeja',
    date: '21 Apr 2026',
    type: 'Fumigation',
    valid: true,
  },
  {
    id: 'cert-spk-002',
    certNumber: 'SPKFUM-2025-00047',
    property: 'Self Contain, Surulere',
    date: '09 Nov 2025',
    type: 'Fumigation',
    valid: true,
  },
];

export default function CertificatesWidget() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-green-600" />
          <h3 className="text-sm font-bold text-[#1A0A5E]">Fumigation Certificates</h3>
        </div>
        <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
          {CERTS?.length} Issued
        </span>
      </div>
      <div className="p-4 space-y-3">
        {CERTS?.map((cert) => (
          <div
            key={cert?.id}
            className="flex items-start justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <FileText size={14} className="text-green-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1A0A5E] font-mono-nums">{cert?.certNumber}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{cert?.property}</div>
                <div className="text-[11px] text-gray-400">{cert?.date}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Valid
              </span>
              <button
                className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors opacity-0 group-hover:opacity-100"
                title="Download fumigation certificate PDF"
                // TODO: Backend — GET /api/certificates/:id/download — stream PDF
              >
                <Download size={13} />
              </button>
            </div>
          </div>
        ))}

        <a
          href="/homepage"
          className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-[#1A0A5E] transition-colors"
        >
          <ExternalLink size={12} />
          Verify a certificate publicly
        </a>
      </div>
    </div>
  );
}