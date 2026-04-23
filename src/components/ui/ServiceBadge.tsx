import React from 'react';

export type ServiceType = 'laundry' | 'home_cleaning' | 'office_cleaning' | 'fumigation';

const SERVICE_CONFIG: Record<ServiceType, { label: string; bg: string; text: string }> = {
  laundry: { label: 'Laundry', bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
  home_cleaning: { label: 'Home Cleaning', bg: 'bg-[#EEF0FF]', text: 'text-[#1A0A5E]' },
  office_cleaning: { label: 'Office Cleaning', bg: 'bg-[#F0FDF4]', text: 'text-[#166534]' },
  fumigation: { label: 'Fumigation', bg: 'bg-[#FFF1F2]', text: 'text-[#9F1239]' },
};

interface ServiceBadgeProps {
  service: ServiceType;
}

export default function ServiceBadge({ service }: ServiceBadgeProps) {
  const config = SERVICE_CONFIG[service] ?? SERVICE_CONFIG.laundry;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}