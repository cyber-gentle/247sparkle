import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function CustomerCertificatesPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Customer Portal"
      title="Fumigation Certificates"
      description="Download and verify your fumigation certificates directly from your account."
      highlights={[
        'Certificate row fields: certificate number, property address, service date, download action.',
        'PDF format should follow business specification from project brief.',
        'Verification URL must point to /verify with searchable certificate number.',
      ]}
      primaryCta={{ label: 'Verify a Certificate', href: '/verify' }}
      secondaryCta={{ label: 'Back to Dashboard', href: '/customer/dashboard' }}
    />
  );
}

