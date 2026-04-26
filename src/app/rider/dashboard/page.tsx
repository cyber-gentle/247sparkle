import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function RiderDashboardPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Rider Portal"
      title="Rider Dashboard"
      description="Monitor assigned delivery jobs, toggle availability, and track earnings."
      highlights={[
        'Job cards should include customer contact, pickup and delivery location, and service details.',
        'Availability toggle updates real-time dispatch visibility.',
        'Earnings summary targets: today, this week, all time.',
      ]}
      primaryCta={{ label: 'View Earnings', href: '/rider/earnings' }}
      secondaryCta={{ label: 'Open Job View', href: '/rider/job/sample-job-001' }}
    />
  );
}

