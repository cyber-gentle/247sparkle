import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function CustomerNewOrderPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Customer Portal"
      title="Place a New Order"
      description="This route is prepared for the multi-step ordering flow covering laundry, home cleaning, and fumigation."
      highlights={[
        'Step flow to implement: service selection, schedule, address details, summary, and payment.',
        'Laundry-specific rules: dynamic item pricing and white-item segregation.',
        'Service exceptions: no rider dispatch for home cleaning and fumigation.',
      ]}
      primaryCta={{ label: 'View My Orders', href: '/customer/orders' }}
      secondaryCta={{ label: 'Back to Dashboard', href: '/customer/dashboard' }}
    />
  );
}

