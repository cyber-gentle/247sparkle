import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function RiderEarningsPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Rider Portal"
      title="Rider Earnings"
      description="Track commission earnings and request wallet withdrawals for completed jobs."
      highlights={[
        'Commission logic target: 20% of delivery fee per completed laundry order.',
        'Required fields: job id, date, amount, withdrawal status.',
        'Withdrawal requests should create admin-reviewable payout tasks.',
      ]}
      primaryCta={{ label: 'Back to Dashboard', href: '/rider/dashboard' }}
      secondaryCta={{ label: 'Update Profile', href: '/rider/profile' }}
    />
  );
}

