import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

interface RiderJobPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RiderJobPage({ params }: RiderJobPageProps) {
  const { id } = await params;

  return (
    <PortalScaffoldPage
      portalLabel="Rider Portal"
      title={`Active Job: ${id}`}
      description="This screen is prepared for rider action controls and delivery workflow updates."
      highlights={[
        'Job actions: Accept Job, Picked Up, Out for Delivery, Delivered.',
        'Each status action should emit order:status_update via Socket.io.',
        'Map links and route guidance should surface pickup and drop-off destinations.',
      ]}
      primaryCta={{ label: 'Back to Rider Dashboard', href: '/rider/dashboard' }}
      secondaryCta={{ label: 'Earnings', href: '/rider/earnings' }}
    />
  );
}

