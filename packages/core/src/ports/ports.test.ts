import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ReleaseRun } from '@release-guardian/shared';
import type {
  AiService,
  ApprovalService,
  Clock,
  CopadoService,
  CrtService,
  IdGenerator,
  ReleaseRunStore,
} from '../index.js';
import { FixedStepClock, SequentialIdGenerator } from '../index.js';

describe('ports', () => {
  it('are implementable by the deterministic runtime classes', () => {
    const clock: Clock = new FixedStepClock();
    const ids: IdGenerator = new SequentialIdGenerator();
    expect(typeof clock.now()).toBe('string');
    expect(ids.next('x')).toBe('x-0001');
  });

  it('require an approvalId to deploy', () => {
    expectTypeOf<CopadoService['deploy']>().parameters.toEqualTypeOf<[string, string]>();
  });

  it('expose no approval capability on AI or Copado services', () => {
    type CanApprove<T> = 'recordDecision' extends keyof T ? true : false;
    expectTypeOf<CanApprove<AiService>>().toEqualTypeOf<false>();
    expectTypeOf<CanApprove<CopadoService>>().toEqualTypeOf<false>();
    expectTypeOf<CanApprove<ApprovalService>>().toEqualTypeOf<true>();
  });

  it('are asynchronous contracts', () => {
    expectTypeOf<CrtService['runTests']>().returns.resolves.toHaveProperty('results');
    expectTypeOf<ReleaseRunStore['get']>().returns.resolves.toEqualTypeOf<ReleaseRun | undefined>();
    expectTypeOf<ApprovalService['assertDeployable']>().returns.resolves.toBeVoid();
  });
});
