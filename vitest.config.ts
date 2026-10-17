import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: projectRoot,
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    testTimeout: 10000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
});
