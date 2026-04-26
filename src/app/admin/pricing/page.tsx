import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function AdminPricingPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Admin Portal"
      title="Pricing Management"
      description="Configure laundry and fumigation prices with immediate impact on customer booking flow."
      highlights={[
        'Laundry item price controls should support white-item category.',
        'Fumigation pricing should map to residential property type tiers.',
        'Pricing updates should trigger audit logs for accountability.',
      ]}
      primaryCta={{ label: 'Back to Dashboard', href: '/admin/dashboard' }}
      secondaryCta={{ label: 'Orders', href: '/admin/orders' }}
    />
  );
}

