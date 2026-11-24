import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = resolve('scripts/check-migrations-untouched.sh');
let repo: string;

function git(...args: string[]): void {
  execFileSync('git', args, { cwd: repo, stdio: 'ignore' });
}

function gate(): number | null {
  return spawnSync(script, ['main'], { cwd: repo, encoding: 'utf8' }).status;
}

describe('migrations-untouched gate', () => {
  beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), 'fairy-gate-'));
    git('init', '-q', '-b', 'main');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'test');
    mkdirSync(join(repo, 'db/migrations'), { recursive: true });
    writeFileSync(join(repo, 'db/migrations/0001_first.sql'), '-- migrate:up\nselect 1;\n');
    git('add', '.');
    git('commit', '-q', '-m', 'first');
    git('checkout', '-q', '-b', 'feature');
  });

  afterEach(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it('migrations gate fails when an existing migration is edited', () => {
    writeFileSync(join(repo, 'db/migrations/0001_first.sql'), '-- migrate:up\nselect 2;\n');
    git('commit', '-q', '-am', 'edit');
    expect(gate()).toBe(1);
  });

  it('migrations gate fails when an existing migration is deleted', () => {
    git('rm', '-q', 'db/migrations/0001_first.sql');
    git('commit', '-q', '-m', 'delete');
    expect(gate()).toBe(1);
  });

  it('migrations gate fails when an existing migration becomes a symlink', () => {
    writeFileSync(join(repo, 'elsewhere.sql'), '-- migrate:up\nselect 4;\n');
    unlinkSync(join(repo, 'db/migrations/0001_first.sql'));
    symlinkSync('../../elsewhere.sql', join(repo, 'db/migrations/0001_first.sql'));
    git('add', '-A');
    git('commit', '-q', '-m', 'symlink');
    expect(gate()).toBe(1);
  });

  it('migrations gate passes when a migration is added', () => {
    writeFileSync(join(repo, 'db/migrations/0002_second.sql'), '-- migrate:up\nselect 3;\n');
    git('add', '.');
    git('commit', '-q', '-m', 'add');
    expect(gate()).toBe(0);
  });
});
