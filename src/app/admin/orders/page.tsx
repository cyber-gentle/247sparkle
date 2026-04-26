import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function AdminOrdersPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Admin Portal"
      title="Orders Management"
      description="Monitor all platform orders, assign riders, and update service lifecycle states."
      highlights={[
        'Table should support search by customer, status, service type, and date.',
        'Admin can assign riders manually for laundry orders.',
        'Payment status visibility required: paid, pending, failed.',
      ]}
      primaryCta={{ label: 'Back to Dashboard', href: '/admin/dashboard' }}
      secondaryCta={{ label: 'Manage Riders', href: '/admin/riders' }}
    />
  );
}

