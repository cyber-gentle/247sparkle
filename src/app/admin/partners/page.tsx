import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function AdminPartnersPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Admin Portal"
      title="Partners Management"
      description="Review partner onboarding, workload visibility, and partner-level earnings."
      highlights={[
        'Statuses: pending approval, active, suspended.',
        'Workload status should influence overflow routing decisions.',
        'Partner history should include order volume and commission records.',
      ]}
      primaryCta={{ label: 'Back to Dashboard', href: '/admin/dashboard' }}
      secondaryCta={{ label: 'Pricing', href: '/admin/pricing' }}
    />
  );
}

