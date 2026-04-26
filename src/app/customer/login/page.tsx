import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function CustomerLoginPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Customer Portal"
      title="Customer Login"
      description="Sign in to access your dashboard, place orders, and track order progress in real time."
      highlights={[
        'Fields to wire: email and password, plus forgot password link.',
        'Next integration: JWT issuance via POST /api/auth/customer/login.',
        'Route guard target after login: /customer/dashboard.',
      ]}
      primaryCta={{ label: 'Go to Dashboard', href: '/customer/dashboard' }}
      secondaryCta={{ label: 'Create Account', href: '/customer/signup' }}
    />
  );
}
