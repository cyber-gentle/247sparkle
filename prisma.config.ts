export const config = {
  datasources: {
    db: {
      // Migrations need Supabase's direct/session connection; application
      // traffic continues to use the pooled DATABASE_URL from the schema.
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
};
