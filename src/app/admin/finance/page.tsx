import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function AdminFinancePage() {
  return (
    <PortalScaffoldPage
      portalLabel="Admin Portal"
      title="Finance"
      description="Track revenue, commissions, and transaction outcomes across all services."
      highlights={[
        'Finance view should include total revenue and commission balances.',
        'Paystack transaction logs should be queryable by reference and status.',
        'Export support needed for accounting reconciliation.',
      ]}
      primaryCta={{ label: 'Back to Dashboard', href: '/admin/dashboard' }}
      secondaryCta={{ label: 'Certificates', href: '/admin/certificates' }}
    />
  );
}

