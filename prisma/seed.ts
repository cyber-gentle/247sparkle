import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create default admin
  const adminPassword = await hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin User',
      email: 'admin@247sparkle.com',
      phone: '09039661885',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✓ Admin user created:', admin.email);

  // Create default pricing for laundry items
  const laundryItems = [
    { itemName: 'Lace', unitPrice: 500 },
    { itemName: 'Jeans', unitPrice: 800 },
    { itemName: 'Agbada', unitPrice: 2000 },
    { itemName: 'T-shirt', unitPrice: 300 },
    { itemName: 'Canvas / Sneaker', unitPrice: 1500 },
    { itemName: 'Sportswear', unitPrice: 600 },
    { itemName: 'Curtains', unitPrice: 3000 },
    { itemName: 'Bedsheets', unitPrice: 1200 },
    { itemName: 'Towels', unitPrice: 400 },
    { itemName: 'White Items (Colour Group)', unitPrice: 400 },
  ];

  for (const item of laundryItems) {
    await prisma.pricing.create({
      data: {
        serviceType: 'LAUNDRY',
        itemName: item.itemName,
        unitPrice: item.unitPrice,
        description: `Laundry service for ${item.itemName}`,
      },
    });
  }

  console.log('✓ Laundry pricing created');

  // Create default pricing for fumigation
  const fumigationItems = [
    { itemName: 'Single Room', unitPrice: 15000 },
    { itemName: 'Self Contain', unitPrice: 20000 },
    { itemName: '1 Room Apartment', unitPrice: 25000 },
    { itemName: '2 Rooms Apartment', unitPrice: 35000 },
    { itemName: '3 Rooms Apartment', unitPrice: 45000 },
    { itemName: '4 Rooms Apartment', unitPrice: 55000 },
  ];

  for (const item of fumigationItems) {
    await prisma.pricing.create({
      data: {
        serviceType: 'FUMIGATION',
        itemName: item.itemName,
        unitPrice: item.unitPrice,
        description: `Fumigation service for ${item.itemName}`,
      },
    });
  }

  console.log('✓ Fumigation pricing created');

  console.log('\n✨ Database seeded successfully!');
  console.log('\nDefault admin credentials:');
  console.log('Email: admin@247sparkle.com');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
