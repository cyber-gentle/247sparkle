import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

// Interactive transactions get a generous window: on serverless cold starts
// (and dev-mode first hits) the first transaction must also establish a new
// TLS connection to the database pooler, which can exceed Prisma's 5s default
// and fail with P2028 — observed on the payment-confirmation path.
const TRANSACTION_OPTIONS = { maxWait: 15_000, timeout: 30_000 };

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ transactionOptions: TRANSACTION_OPTIONS });
} else {
  // Avoid instantiating too many PrismaClients in development
  const globalWithPrisma = global as typeof global & {
    prisma: PrismaClient;
  };
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient({ transactionOptions: TRANSACTION_OPTIONS });
  }
  prisma = globalWithPrisma.prisma;
}

export default prisma;
