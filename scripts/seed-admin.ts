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
    console.error(
      '  DATABASE_URL=postgresql://prisma.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true'
    );
    console.error('  DIRECT_URL=postgresql://prisma:[pwd]@db.[ref].supabase.co:5432/postgres\n');
    process.exit(1);
  }

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@247sparkle.com';
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.trim() === '') {
    console.error('\n❌ SEED_ADMIN_PASSWORD is not set in .env.');
    console.error(
      'This script must never fall back to a default password: anyone who reads the\n' +
        'repository could use it to take over the admin account.'
    );
    console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env and re-run:');
    console.error('  SEED_ADMIN_EMAIL=admin@example.com');
    console.error('  SEED_ADMIN_PASSWORD=<strong unique password>\n');
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`  247Sparkle - Admin Account Seed`);
  console.log(`========================================`);
  console.log(`Target Email: ${email}`);

  const existingAdmin = await prisma.user.findUnique({ where: { email } });

  if (existingAdmin) {
    // Never overwrite an existing admin's credentials: re-running this script
    // must not silently reset a rotated password.
    console.log('\n✓ Existing administrator retained; the password was NOT reset.');
    console.log('========================================');
    console.log(`  Role:     ${existingAdmin.role}`);
    console.log(`  Email:    ${existingAdmin.email}`);
    console.log(`  Login UI: http://localhost:4028/admin/login`);
    console.log('========================================\n');
    return;
  }

  const passwordHash = await hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin User',
      email,
      phone: '09039661885',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('\n✅ Admin user created!');
  console.log('========================================');
  console.log(`  Role:     ${admin.role}`);
  console.log(`  Email:    ${admin.email}`);
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
