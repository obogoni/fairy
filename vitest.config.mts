import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// esbuild drops the decorator metadata Nest's dependency injection reads, so tests compile with
// SWC, following Nest's SWC recipe (tests-and-ci.md).
const nestSwc = () => swc.vite({ tsconfigFile: 'tsconfig.server.json', module: { type: 'es6' } });

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [nestSwc()],
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'tests/repo/**/*.test.ts'],
          exclude: ['src/**/*.int.test.ts'],
          environment: 'node',
        },
      },
      {
        plugins: [nestSwc()],
        test: {
          name: 'integration',
          include: ['src/**/*.int.test.ts'],
          environment: 'node',
          globalSetup: ['src/server/test-support/global-setup.ts'],
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
