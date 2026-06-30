export type CertificateRecord = {
  certificateNumber: string;
  customerName: string;
  propertyAddress: string;
  propertyType: string;
  serviceDate: string;
  serviceType: 'fumigation';
};

const certificates: CertificateRecord[] = [
  {
    certificateNumber: 'SPKFUM-2026-00001',
    customerName: 'Adaeze Okonkwo',
    propertyAddress: '12 Ochacho Avenue, Otukpo, Benue State',
    propertyType: '2 Rooms Apartment',
    serviceDate: '2026-04-24',
    serviceType: 'fumigation',
  },
  {
    certificateNumber: 'SPKFUM-2026-00002',
    customerName: 'Tunde Afolayan',
    propertyAddress: '45 Upu Road, Otukpo, Benue State',
    propertyType: 'Office',
    serviceDate: '2026-05-02',
    serviceType: 'fumigation',
  },
];

export function findCertificateByNumber(inputNumber: string) {
  const normalized = inputNumber.trim().toUpperCase();
  return certificates.find((certificate) => certificate.certificateNumber === normalized) ?? null;
}
