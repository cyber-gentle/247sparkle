import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === '') {
    console.error('\n❌ DATABASE_URL is not set in .env.');
    console.error('Please configure your PostgreSQL connection string in .env before seeding:');
    console.error('  DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require');
    console.error('  DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE');
    console.error('\nIf using Supabase:');
    console.error('  DATABASE_URL=postgresql://prisma.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true');
    console.error('  DIRECT_URL=postgresql://prisma:[pwd]@db.[ref].supabase.co:5432/postgres\n');
    process.exit(1);
  }

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@247sparkle.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'SparkleAdmin2026!';

  console.log(`\n========================================`);
  console.log(`  247Sparkle - Admin Account Seed`);
  console.log(`========================================`);
  console.log(`Target Email: ${email}`);

  const passwordHash = await hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      fullName: 'Admin User',
      passwordHash,
      role: 'ADMIN',
    },
    create: {
      fullName: 'Admin User',
      email,
      phone: '09039661885',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('\n✅ Admin user successfully seeded/updated!');
  console.log('========================================');
  console.log(`  Role:     ${admin.role}`);
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Login UI: http://localhost:4028/admin/login`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during admin seed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
