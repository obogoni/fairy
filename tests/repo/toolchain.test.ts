import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('toolchain pins Node 26 and pnpm', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
    engines: { node: string };
    packageManager: string;
  };
  expect(readFileSync('.nvmrc', 'utf8').trim()).toBe('26');
  expect(pkg.engines.node).toBe('>=26 <27');
  expect(pkg.packageManager).toBe('pnpm@12.23.0');
});
