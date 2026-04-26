import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function PartnerProfilePage() {
  return (
    <PortalScaffoldPage
      portalLabel="Partner Portal"
      title="Partner Profile"
      description="Update business details, operating schedule, and settlement bank information."
      highlights={[
        'Editable profile: business name, address, phone, and owner details.',
        'Operating schedule should support multi-day selection.',
        'Bank updates should verify account ownership before save.',
      ]}
      primaryCta={{ label: 'Back to Dashboard', href: '/partner/dashboard' }}
      secondaryCta={{ label: 'Partner Login', href: '/partner/login' }}
    />
  );
}

