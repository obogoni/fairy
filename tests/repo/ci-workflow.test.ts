import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parse } from 'yaml';

interface Step {
  name?: string;
  run?: string;
}
interface Job {
  needs?: string | string[];
  steps: Step[];
}
interface Workflow {
  on: Record<string, unknown>;
  jobs: Record<string, Job>;
}

const workflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8')) as Workflow;

function jobRunning(command: string): string {
  for (const [name, job] of Object.entries(workflow.jobs)) {
    if (job.steps.some((step) => step.run?.includes(command))) {
      return name;
    }
  }
  throw new Error(`No job runs: ${command}`);
}

function needs(job: string): string[] {
  const value = workflow.jobs[job]?.needs ?? [];
  return Array.isArray(value) ? value : [value];
}

/** True when `job` runs only after `before`, directly or through other jobs. */
function after(job: string, before: string): boolean {
  return needs(job).some((dep) => dep === before || after(dep, before));
}

it('ci workflow runs the eight gates on pull requests', () => {
  expect(Object.keys(workflow.on)).toContain('pull_request');

  const gates = {
    install: jobRunning('pnpm install --frozen-lockfile'),
    format: jobRunning('pnpm format:check'),
    lint: jobRunning('pnpm lint'),
    typecheck: jobRunning('pnpm typecheck'),
    migrations: jobRunning('scripts/check-migrations-untouched.sh'),
    unit: jobRunning('pnpm test:unit'),
    integration: jobRunning('pnpm test:int'),
    schema: jobRunning('scripts/check-schema-sync.sh'),
    build: jobRunning('pnpm build'),
    e2e: jobRunning('playwright test'),
  };

  // Tests, build and e2e only run once the static checks pass, and e2e runs against the build.
  for (const gate of [gates.unit, gates.integration, gates.schema, gates.build, gates.e2e]) {
    expect(after(gate, gates.typecheck)).toBe(true);
  }
  expect(after(gates.e2e, gates.build)).toBe(true);
  expect(after(gates.e2e, gates.integration)).toBe(true);
});
