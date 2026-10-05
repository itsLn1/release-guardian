import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  AGENT_STATES,
  ERROR_CODES,
  EVIDENCE_TYPES,
  RELEASE_GUARDIAN_MODES,
  RISK_FACTOR_IDS,
  type AgentState,
  type ErrorCode,
  type ReleaseRun,
  type ToolResult,
} from './index.js';

describe('shared constants', () => {
  it.each([
    ['AGENT_STATES', AGENT_STATES, 23],
    ['ERROR_CODES', ERROR_CODES, 8],
    ['EVIDENCE_TYPES', EVIDENCE_TYPES, 14],
    ['RISK_FACTOR_IDS', RISK_FACTOR_IDS, 7],
    ['RELEASE_GUARDIAN_MODES', RELEASE_GUARDIAN_MODES, 2],
  ])('%s has unique entries and the spec count', (_name, list, count) => {
    expect(list).toHaveLength(count);
    expect(new Set(list).size).toBe(count);
  });

  it('contains the human-gate and terminal agent states from the spec', () => {
    for (const state of ['AWAITING_REMEDIATION_CONFIRMATION', 'AWAITING_APPROVAL', 'COMPLETED', 'REJECTED']) {
      expect(AGENT_STATES).toContain(state);
    }
  });

  it('exposes the MCP error codes from the spec', () => {
    expect(ERROR_CODES).toContain('APPROVAL_REQUIRED');
    expect(ERROR_CODES).toContain('APPROVAL_STALE');
  });
});

describe('shared model shapes', () => {
  it('derives unions from the constants', () => {
    expectTypeOf<AgentState>().toEqualTypeOf<(typeof AGENT_STATES)[number]>();
    expectTypeOf<ErrorCode>().toEqualTypeOf<(typeof ERROR_CODES)[number]>();
  });

  it('allows a minimal initial ReleaseRun to be assembled', () => {
    const run = {
      releaseId: 'REL-2026-07',
      state: 'IDLE',
      attempt: 1,
      contentVersion: 1,
      testRuns: [],
      validations: [],
      stepLog: [],
    } satisfies ReleaseRun;
    expect(run.state).toBe('IDLE');
  });

  it('models the MCP result envelope', () => {
    const failure: ToolResult<never> = {
      ok: false,
      summary: 'Deployment refused.',
      error: { code: 'APPROVAL_REQUIRED', message: 'No approval', nextStep: 'Ask a human.' },
    };
    expect(failure.error?.code).toBe('APPROVAL_REQUIRED');
  });
});
