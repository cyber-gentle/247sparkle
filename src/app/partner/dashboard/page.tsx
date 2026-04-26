import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function PartnerDashboardPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Partner Portal"
      title="Partner Dashboard"
      description="Manage incoming jobs, workload status, and monthly earnings from partner-assigned orders."
      highlights={[
        'Workload toggle options: available or busy.',
        'Incoming orders table should support mark ready for pickup action.',
        'Revenue cards should show gross amount, commission, and net payout.',
      ]}
      primaryCta={{ label: 'Open Partner Profile', href: '/partner/profile' }}
      secondaryCta={{ label: 'Back to Home', href: '/' }}
    />
  );
}

