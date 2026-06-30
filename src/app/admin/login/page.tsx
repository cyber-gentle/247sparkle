import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function AdminLoginPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Admin Portal"
      title="Admin Login"
      description="Secure admin authentication entry point for platform operations and control panels."
      highlights={[
        'Admin accounts are seeded and managed internally.',
        'Access should require strong password policy and rate limiting.',
        'Route guard target after login: /admin/dashboard.',
      ]}
      primaryCta={{ label: 'Open Admin Dashboard', href: '/admin/dashboard' }}
      secondaryCta={{ label: 'Back to Home', href: '/' }}
    />
  );
}

