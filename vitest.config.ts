import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'packages/**/*.test.ts', 'apps/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@deputy/config': path.resolve(__dirname, './packages/config/src/index.ts'),
      '@deputy/domain': path.resolve(__dirname, './packages/domain/src/index.ts'),
      '@deputy/schemas': path.resolve(__dirname, './packages/schemas/src/index.ts'),
      '@deputy/security': path.resolve(__dirname, './packages/security/src/index.ts'),
      '@deputy/webmcp': path.resolve(__dirname, './packages/webmcp/src/index.ts'),
      '@deputy/database': path.resolve(__dirname, './packages/database/src/index.ts'),
      '@deputy/synthesis': path.resolve(__dirname, './packages/synthesis/src/index.ts'),
    },
  },
});
