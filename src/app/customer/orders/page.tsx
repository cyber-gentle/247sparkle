import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function CustomerOrdersPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Customer Portal"
      title="Order History"
      description="Review all service orders with filtering by status, service type, and date range."
      highlights={[
        'List layout target: status badge, date, service type, and total amount.',
        'Required filters: status, service type, date range.',
        'Detail route wired at /customer/orders/[id].',
      ]}
      primaryCta={{ label: 'Open Sample Order', href: '/customer/orders/sample-order-001' }}
      secondaryCta={{ label: 'Place New Order', href: '/customer/new-order' }}
    />
  );
}

