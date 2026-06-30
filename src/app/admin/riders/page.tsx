import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function AdminRidersPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Admin Portal"
      title="Riders Management"
      description="Approve rider applications, monitor availability, and process withdrawals."
      highlights={[
        'Statuses: pending approval, active, suspended.',
        'Required actions: approve, reject, suspend, reactivate.',
        'Withdrawal requests should be tracked with paid status updates.',
      ]}
      primaryCta={{ label: 'Back to Dashboard', href: '/admin/dashboard' }}
      secondaryCta={{ label: 'Orders', href: '/admin/orders' }}
    />
  );
}

