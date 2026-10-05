import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [full] : [];
  });
}

/** Source text with comments removed, so documentation can mention forbidden APIs. */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function importSpecifiers(file: string): string[] {
  const text = code(file);
  return [...text.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)].map((m) => m[1] ?? '');
}

const isRelative = (s: string): boolean => s.startsWith('./') || s.startsWith('../');
/** Path with separators normalized to '/', so allow-lists behave the same on Windows and POSIX. */
const normalize = (file: string): string => file.replace(/\\/g, '/');
const baseName = (file: string): string => normalize(file).split('/').pop() ?? '';

describe('dependency rules (MASTER_SPEC.md 9.1)', () => {
  it('shared imports nothing but itself', () => {
    for (const file of sourceFiles(join(root, 'packages/shared/src'))) {
      for (const spec of importSpecifiers(file)) {
        expect(isRelative(spec), `${relative(root, file)} imports ${spec}`).toBe(true);
      }
    }
  });

  it('core imports only shared (and itself): no express, react, SDKs or node builtins', () => {
    for (const file of sourceFiles(join(root, 'packages/core/src'))) {
      for (const spec of importSpecifiers(file)) {
        const ok = isRelative(spec) || spec === '@release-guardian/shared';
        expect(ok, `${relative(root, file)} imports ${spec}`).toBe(true);
      }
    }
  });

  it('interprets RELEASE_GUARDIAN_MODE only in config.ts (and the future container.ts)', () => {
    const allowed = new Set(['config.ts', 'container.ts']);
    for (const pkg of ['shared', 'core']) {
      for (const file of sourceFiles(join(root, 'packages', pkg, 'src'))) {
        if (allowed.has(baseName(file))) continue;
        expect(code(file), relative(root, file)).not.toMatch(/\bRELEASE_GUARDIAN_MODE\b/);
      }
    }
  });

  it('keeps non-deterministic APIs out of core business logic', () => {
    for (const file of sourceFiles(join(root, 'packages/core/src'))) {
      expect(code(file), relative(root, file)).not.toMatch(/Math\.random|Date\.now\(|new Date\(\)|process\.env/);
    }
  });
});
