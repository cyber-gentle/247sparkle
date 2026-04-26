import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function RiderProfilePage() {
  return (
    <PortalScaffoldPage
      portalLabel="Rider Portal"
      title="Rider Profile"
      description="Manage rider profile details, address, and bank information for payouts."
      highlights={[
        'Editable: name, address, phone, and bank details.',
        'Bank updates should re-validate account name via Paystack resolve endpoint.',
        'Availability updates should sync with dispatch engine.',
      ]}
      primaryCta={{ label: 'Back to Dashboard', href: '/rider/dashboard' }}
      secondaryCta={{ label: 'View Earnings', href: '/rider/earnings' }}
    />
  );
}

