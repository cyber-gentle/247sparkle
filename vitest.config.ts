import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    env: {
      JWT_SECRET: 'phase-3-test-secret-that-is-long-enough-to-sign-tokens',
    },
  },
});
