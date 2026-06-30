import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function AdminCustomersPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Admin Portal"
      title="Customers Management"
      description="Inspect customer records, contact details, and lifetime order activity."
      highlights={[
        'Core columns: name, email, phone, total orders.',
        'Customer detail page should include full order history.',
        'Support actions: suspend abusive users and resolve disputes.',
      ]}
      primaryCta={{ label: 'Back to Dashboard', href: '/admin/dashboard' }}
      secondaryCta={{ label: 'Orders', href: '/admin/orders' }}
    />
  );
}

