import { describe, expect, it } from 'vitest';
import { resolveMode } from './config.js';
import { ReleaseGuardianError } from './errors.js';

describe('resolveMode', () => {
  it('defaults to demo when unset or empty', () => {
    expect(resolveMode({})).toBe('demo');
    expect(resolveMode({ RELEASE_GUARDIAN_MODE: '' })).toBe('demo');
    expect(resolveMode({ RELEASE_GUARDIAN_MODE: '   ' })).toBe('demo');
  });

  it('accepts demo and live, case-insensitively', () => {
    expect(resolveMode({ RELEASE_GUARDIAN_MODE: 'demo' })).toBe('demo');
    expect(resolveMode({ RELEASE_GUARDIAN_MODE: ' LIVE ' })).toBe('live');
  });

  it('fails fast on an invalid value', () => {
    expect(() => resolveMode({ RELEASE_GUARDIAN_MODE: 'prod' })).toThrow(ReleaseGuardianError);
    expect(() => resolveMode({ RELEASE_GUARDIAN_MODE: 'prod' })).toThrow(/demo, live/);
  });
});
