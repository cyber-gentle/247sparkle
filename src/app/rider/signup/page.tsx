import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function RiderSignupPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Rider Portal"
      title="Rider Signup"
      description="Register as a rider with identity photo, contact details, and bank payout information."
      highlights={[
        'Approval flow required: rider stays pending until admin approves.',
        'Bank fields should be integrated with Paystack bank list and account resolve APIs.',
        'Availability status options: working or off-duty.',
      ]}
      primaryCta={{ label: 'Rider Login', href: '/rider/login' }}
      secondaryCta={{ label: 'Become a Partner', href: '/become-a-partner' }}
    />
  );
}

