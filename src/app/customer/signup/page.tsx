import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function CustomerSignupPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Customer Portal"
      title="Customer Signup"
      description="Create a customer account with full name, email, phone, and password to begin placing service orders."
      highlights={[
        'Fields to wire: full name, email, phone number, password, confirm password.',
        'Next integration: POST /api/auth/customer/signup with validation and duplicate-email handling.',
        'Planned add-on: email verification and forgot-password flow.',
      ]}
      primaryCta={{ label: 'Already have an account? Login', href: '/customer/login' }}
      secondaryCta={{ label: 'Back to Home', href: '/' }}
    />
  );
}
