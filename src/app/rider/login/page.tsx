import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function RiderLoginPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Rider Portal"
      title="Rider Login"
      description="Approved riders can sign in to manage jobs, status updates, and earnings."
      highlights={[
        'Block login when approval_status is pending or suspended.',
        'Route guard target after login: /rider/dashboard.',
        'Session token should include rider role for protected routes.',
      ]}
      primaryCta={{ label: 'Open Rider Dashboard', href: '/rider/dashboard' }}
      secondaryCta={{ label: 'Create Rider Account', href: '/rider/signup' }}
    />
  );
}

