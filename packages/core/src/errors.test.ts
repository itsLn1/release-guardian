import { describe, expect, it } from 'vitest';
import {
  ApprovalRequiredError,
  ApprovalStaleError,
  InvalidTransitionError,
  NotImplementedError,
  ReleaseGuardianError,
  ReleaseNotFoundError,
  RemediationNotConfirmedError,
  toErrorInfo,
} from './errors.js';

describe('error classes', () => {
  it.each([
    [new ReleaseNotFoundError('R1'), 'RELEASE_NOT_FOUND'],
    [new InvalidTransitionError('IDLE', 'deploy'), 'INVALID_TRANSITION'],
    [new ApprovalRequiredError('R1'), 'APPROVAL_REQUIRED'],
    [new ApprovalStaleError('appr-0001'), 'APPROVAL_STALE'],
    [new RemediationNotConfirmedError('R1'), 'REMEDIATION_NOT_CONFIRMED'],
    [new NotImplementedError('Live Copado'), 'NOT_IMPLEMENTED_IN_MODE'],
  ] as const)('%s carries code %s', (error, code) => {
    expect(error).toBeInstanceOf(ReleaseGuardianError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
    expect(error.name).toBe(error.constructor.name);
  });

  it('ApprovalRequiredError tells the caller a human must approve', () => {
    expect(new ApprovalRequiredError('R1').nextStep).toMatch(/human must approve/i);
  });
});

describe('toErrorInfo', () => {
  it('maps classified errors, including nextStep', () => {
    expect(toErrorInfo(new ApprovalRequiredError('R1'))).toEqual({
      code: 'APPROVAL_REQUIRED',
      message: 'Release R1 has no valid human approval',
      nextStep: 'A human must approve this release in the dashboard.',
    });
  });

  it('omits nextStep when absent', () => {
    expect(toErrorInfo(new ReleaseNotFoundError('R9'))).toEqual({
      code: 'RELEASE_NOT_FOUND',
      message: 'Release not found: R9',
    });
  });

  it('hides details of unknown errors', () => {
    expect(toErrorInfo(new Error('secret db password'))).toEqual({
      code: 'INTERNAL',
      message: 'An unexpected error occurred',
    });
    expect(toErrorInfo('string thrown')).toEqual({
      code: 'INTERNAL',
      message: 'An unexpected error occurred',
    });
  });
});
