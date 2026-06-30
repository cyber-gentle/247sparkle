import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function AdminCertificatesPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Admin Portal"
      title="Fumigation Certificates"
      description="Issue, download, and validate fumigation certificates linked to completed orders."
      highlights={[
        'Certificate number format: SPKFUM-YYYY-XXXXX.',
        'Admin should issue certificate only after qualifying service is completed.',
        'Public verification page must resolve certificate by number.',
      ]}
      primaryCta={{ label: 'Verify Public Certificate', href: '/verify' }}
      secondaryCta={{ label: 'Back to Dashboard', href: '/admin/dashboard' }}
    />
  );
}

