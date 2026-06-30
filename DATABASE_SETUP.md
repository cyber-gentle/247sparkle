# Database Setup Guide - SQLite (Local Development)

This project has been configured to use **SQLite** for local development to avoid the need for PostgreSQL setup. The database file is located at `prisma/dev.db`.

## ✅ Current Configuration

- **Database**: SQLite (file-based)
- **Location**: `prisma/dev.db`
- **Connection**: `DATABASE_URL="file:./prisma/dev.db"` in `.env`

## 🚀 Quick Start

The database is already set up and seeded. To start the application:

```bash
npm run dev
```

Visit: **http://localhost:4028**

## 🔑 Default Admin Credentials

- **Email**: `admin@247sparkle.com`
- **Password**: `admin123`

## 📊 Seeded Data

The database includes:
- 1 admin user
- 10 laundry items with pricing (₦300 - ₦3,000)
- 6 fumigation property types (₦15,000 - ₦55,000)

## 🛠️ Database Commands

```bash
# Generate Prisma client (after schema changes)
npm run prisma:generate

# Push schema changes to database
npm run db:push

# Reset and reseed database
npx prisma db push --force-reset --accept-data-loss
npm run db:seed
```

## 🔄 Migrating to PostgreSQL (Production)

For production, you can switch to PostgreSQL by:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Convert enums back to Prisma enums (revert enums to native Prisma enums)

3. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/sparkle247"
   ```

4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

## 📝 Notes

- **Enums**: SQLite doesn't support enums, so all enum fields are stored as `String` with default values. Use the constants in `src/lib/enums.ts` for type safety in TypeScript code.
- **Arrays**: SQLite doesn't support arrays, so `daysOfOpening` is stored as a JSON string.
- **Data Persistence**: The SQLite database file persists between server restarts. Delete `prisma/dev.db` to start fresh.

## 🔍 Viewing Database

To inspect the database, you can use:
- **Prisma Studio**: `npx prisma studio` (opens web UI)
- **DB Browser for SQLite**: Download from https://sqlitebrowser.org/
- **VS Code Extension**: SQLite Viewer

## 🐛 Troubleshooting

### Database locked error
- Close any other connections to the database
- Restart the dev server

### Schema out of sync
```bash
npx prisma db push --force-reset --accept-data-loss
npm run db:seed
```

### Prisma client not found
```bash
npm run prisma:generate
```

## 📚 Additional Resources

- [Prisma SQLite Documentation](https://www.prisma.io/docs/orm/overview/databases/sqlite)
- [Prisma Schema Reference](https://www.prisma.io/docs/orm/prisma-schema)
