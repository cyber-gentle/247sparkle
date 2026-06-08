export type PricingItem = {
  serviceType: 'laundry' | 'fumigation';
  itemName: string;
  unitPrice: number;
};

const pricing: PricingItem[] = [
  { serviceType: 'laundry', itemName: 'T-shirt', unitPrice: 1500 },
  { serviceType: 'laundry', itemName: 'Jeans', unitPrice: 2500 },
  { serviceType: 'laundry', itemName: 'Agbada', unitPrice: 6500 },
  { serviceType: 'laundry', itemName: 'Bedsheet', unitPrice: 3000 },
  { serviceType: 'laundry', itemName: 'Curtains', unitPrice: 4000 },
  { serviceType: 'fumigation', itemName: 'Single Room', unitPrice: 18000 },
  { serviceType: 'fumigation', itemName: 'Self Contain', unitPrice: 25000 },
  { serviceType: 'fumigation', itemName: '1 Room Apartment', unitPrice: 35000 },
  { serviceType: 'fumigation', itemName: '2 Rooms Apartment', unitPrice: 45000 },
  { serviceType: 'fumigation', itemName: '3 Rooms Apartment', unitPrice: 55000 },
];

export function getPricing(serviceType?: 'laundry' | 'fumigation') {
  if (!serviceType) return pricing;
  return pricing.filter((item) => item.serviceType === serviceType);
}
