import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function AdminQuotationsPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Admin Portal"
      title="Quotation Requests"
      description="Manage quotation requests for office cleaning and commercial fumigation services."
      highlights={[
        'Statuses required: new, responded, converted.',
        'Admin should respond with pricing and timeline.',
        'Conversion flow can promote quotation into a standard order.',
      ]}
      primaryCta={{ label: 'Back to Dashboard', href: '/admin/dashboard' }}
      secondaryCta={{ label: 'Finance', href: '/admin/finance' }}
    />
  );
}

