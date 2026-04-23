import React from 'react';

export type OrderStatus =
  | 'pending' |'rider_assigned' |'picked_up' |'in_cleaning' |'out_for_delivery' |'delivered' |'scheduled' |'in_progress' |'completed' |'cancelled' |'paid' |'unpaid' |'failed';

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  rider_assigned: { label: 'Rider Assigned', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  picked_up: { label: 'Picked Up', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' },
  in_cleaning: { label: 'In Cleaning', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
  out_for_delivery: { label: 'Out for Delivery', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  delivered: { label: 'Delivered', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' },
  scheduled: { label: 'Scheduled', bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-400' },
  in_progress: { label: 'In Progress', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
  completed: { label: 'Completed', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  paid: { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  unpaid: { label: 'Unpaid', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  failed: { label: 'Failed', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
};

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClasses} ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}