import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function CustomerProfilePage() {
  return (
    <PortalScaffoldPage
      portalLabel="Customer Portal"
      title="Customer Profile"
      description="Manage account details, saved addresses, and password updates."
      highlights={[
        'Editable fields: full name, email, phone number.',
        'Saved addresses should support default pickup and delivery location.',
        'Password change flow should require current password verification.',
      ]}
      primaryCta={{ label: 'Back to Dashboard', href: '/customer/dashboard' }}
      secondaryCta={{ label: 'My Orders', href: '/customer/orders' }}
    />
  );
}

