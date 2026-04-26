import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

interface OrderDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerOrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params;

  return (
    <PortalScaffoldPage
      portalLabel="Customer Portal"
      title={`Order Tracking: ${id}`}
      description="This detail route is ready for timeline statuses, full order breakdown, ETA, and rider map tracking."
      highlights={[
        'Timeline sequence: Order Placed, Rider Assigned, Picked Up, In Cleaning, Out for Delivery, Delivered.',
        'For on-site services, timeline will use Scheduled, In Progress, Completed.',
        'Map panel will consume real-time rider location updates via Socket.io.',
      ]}
      primaryCta={{ label: 'Back to Orders', href: '/customer/orders' }}
      secondaryCta={{ label: 'Dashboard', href: '/customer/dashboard' }}
    />
  );
}

