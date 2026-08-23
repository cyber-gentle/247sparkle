import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { nairaToKobo } from '../src/lib/money';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD)) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required when creating a production administrator.'
    );
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@247sparkle.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const generatedPassword = randomBytes(12).toString('base64url');
    const adminPasswordPlain = process.env.SEED_ADMIN_PASSWORD || generatedPassword;
    const adminPassword = await hash(adminPasswordPlain, 12);
    const admin = await prisma.user.create({
      data: {
        fullName: 'Admin User',
        email: adminEmail,
        phone: '09039661885',
        passwordHash: adminPassword,
        role: 'ADMIN',
      },
    });

    console.log('✓ Admin user created:', admin.email);
    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.log(
        `✓ Generated non-production admin password (store it now, it will not be shown again): ${adminPasswordPlain}`
      );
    }
  } else {
    console.log('✓ Existing administrator retained; seed will not reset its password.');
  }

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
    const existingPricing = await prisma.pricing.findUnique({
      where: { serviceType_itemName: { serviceType: 'LAUNDRY', itemName: item.itemName } },
    });
    if (!existingPricing) {
      await prisma.pricing.create({
        data: {
          serviceType: 'LAUNDRY',
          itemName: item.itemName,
          unitPrice: item.unitPrice,
          unitPriceKobo: nairaToKobo(item.unitPrice),
          description: `Laundry service for ${item.itemName}`,
        },
      });
    }
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
    const existingPricing = await prisma.pricing.findUnique({
      where: { serviceType_itemName: { serviceType: 'FUMIGATION', itemName: item.itemName } },
    });
    if (!existingPricing) {
      await prisma.pricing.create({
        data: {
          serviceType: 'FUMIGATION',
          itemName: item.itemName,
          unitPrice: item.unitPrice,
          unitPriceKobo: nairaToKobo(item.unitPrice),
          description: `Fumigation service for ${item.itemName}`,
        },
      });
    }
  }

  console.log('✓ Fumigation pricing created');

  // Demo customer + completed fumigation order + certificate.
  // Provides an end-to-end demonstrable record for the public certificate
  // verification page (/verify) and the customer certificates page.
  // NEVER seeded in production — these accounts have a well-known password.
  if (isProduction) {
    console.log('✓ Skipping demo accounts (production seed)');
    console.log('\n✨ Database seeded successfully!');
    return;
  }

  const existingDemoUser = await prisma.user.findUnique({ where: { email: 'customer@test.com' } });
  if (existingDemoUser) {
    console.log('✓ Existing demo records retained; seed will not duplicate them.');
    console.log('\n✨ Database seeded successfully!');
    return;
  }

  const demoPassword = await hash('password123', 10);
  const demoUser = await prisma.user.create({
    data: {
      fullName: 'Adaeze Okonkwo',
      email: 'customer@test.com',
      phone: '09012345678',
      passwordHash: demoPassword,
      role: 'CUSTOMER',
    },
  });

  const demoCustomer = await prisma.customer.create({
    data: { userId: demoUser.id },
  });

  const demoOrder = await prisma.order.create({
    data: {
      customerId: demoCustomer.id,
      serviceType: 'FUMIGATION',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      pickupOption: 'ON_SITE',
      deliveryAddress: '12 Ochacho Avenue, Otukpo, Benue State',
      totalAmount: 35000,
      totalKobo: nairaToKobo(35000),
      paymentConfirmedAt: new Date('2026-04-24'),
      scheduledDate: new Date('2026-04-24'),
    },
  });

  await prisma.certificate.create({
    data: {
      orderId: demoOrder.id,
      customerId: demoCustomer.id,
      certificateNumber: 'SPKFUM-2026-00001',
      customerName: demoUser.fullName,
      propertyAddress: '12 Ochacho Avenue, Otukpo, Benue State',
      propertyType: '2 Rooms Apartment',
      serviceDate: new Date('2026-04-24'),
    },
  });

  // Second demo certificate (SPKFUM-2026-00002)
  const demoUser2 = await prisma.user.create({
    data: {
      fullName: 'Tunde Afolayan',
      email: 'customer2@test.com',
      phone: '08034567890',
      passwordHash: demoPassword,
      role: 'CUSTOMER',
    },
  });
  const demoCustomer2 = await prisma.customer.create({ data: { userId: demoUser2.id } });
  const demoOrder2 = await prisma.order.create({
    data: {
      customerId: demoCustomer2.id,
      serviceType: 'FUMIGATION',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      pickupOption: 'ON_SITE',
      deliveryAddress: '45 Upu Road, Otukpo, Benue State',
      totalAmount: 20000,
      totalKobo: nairaToKobo(20000),
      paymentConfirmedAt: new Date('2026-05-02'),
      scheduledDate: new Date('2026-05-02'),
    },
  });
  await prisma.certificate.create({
    data: {
      orderId: demoOrder2.id,
      customerId: demoCustomer2.id,
      certificateNumber: 'SPKFUM-2026-00002',
      customerName: demoUser2.fullName,
      propertyAddress: '45 Upu Road, Otukpo, Benue State',
      propertyType: 'Office',
      serviceDate: new Date('2026-05-02'),
    },
  });

  // Demo rider (pre-approved for testing)
  const riderPassword = await hash('password123', 10);
  const riderUser = await prisma.user.create({
    data: {
      fullName: 'Test Rider',
      email: 'rider@test.com',
      phone: '08087654321',
      passwordHash: riderPassword,
      role: 'RIDER',
      rider: {
        create: {
          approvalStatus: 'APPROVED',
          availabilityStatus: 'OFF_DUTY',
        },
      },
    },
  });

  console.log('✓ Demo customer + fumigation certificate created');
  console.log('✓ Second demo certificate (SPKFUM-2026-00002) created');
  console.log('✓ Demo rider created (rider@test.com / password123)');

  console.log('\n✨ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
