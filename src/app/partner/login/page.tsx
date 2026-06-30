import PortalScaffoldPage from '@/components/portal/PortalScaffoldPage';

export default function PartnerLoginPage() {
  return (
    <PortalScaffoldPage
      portalLabel="Partner Portal"
      title="Partner Login"
      description="Approved partners can access incoming orders, workload controls, and revenue summaries."
      highlights={[
        'Login should block pending or suspended partner accounts.',
        'Route guard target after login: /partner/dashboard.',
        'Role-based JWT required for partner endpoints.',
      ]}
      primaryCta={{ label: 'Open Partner Dashboard', href: '/partner/dashboard' }}
      secondaryCta={{ label: 'Create Partner Account', href: '/partner/signup' }}
    />
  );
}

