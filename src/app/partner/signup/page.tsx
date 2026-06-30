import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function PartnerSignupPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Partner Portal"
      title="Partner Signup"
      description="Register a laundry business with operating schedule, owner verification, and bank details."
      highlights={[
        'Approval gate required before partner login is enabled.',
        'Fields include business profile, opening/closing time, and days of opening.',
        'Bank account name should auto-resolve from Paystack.',
      ]}
      primaryCta={{ label: 'Partner Login', href: '/partner/login' }}
      secondaryCta={{ label: 'Back to Partner Program', href: '/become-a-partner' }}
    />
  );
}

