import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = (p: string): string => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@release-guardian/shared': src('./packages/shared/src/index.ts'),
      '@release-guardian/core': src('./packages/core/src/index.ts'),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
  },
});
