import type { AgentState, ErrorCode, ErrorInfo } from '@release-guardian/shared';

export interface ReleaseGuardianErrorOptions {
  nextStep?: string;
  cause?: unknown;
}

/** Base class for all expected, classified errors. */
export class ReleaseGuardianError extends Error {
  readonly code: ErrorCode;
  readonly nextStep: string | undefined;

  constructor(code: ErrorCode, message: string, options: ReleaseGuardianErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = new.target.name;
    this.code = code;
    this.nextStep = options.nextStep;
  }
}

export class ReleaseNotFoundError extends ReleaseGuardianError {
  constructor(releaseId: string) {
    super('RELEASE_NOT_FOUND', `Release not found: ${releaseId}`);
  }
}

export class InvalidTransitionError extends ReleaseGuardianError {
  constructor(from: AgentState, event: string) {
    super('INVALID_TRANSITION', `Event "${event}" is not valid in state ${from}`);
  }
}

export class ApprovalRequiredError extends ReleaseGuardianError {
  constructor(releaseId: string) {
    super('APPROVAL_REQUIRED', `Release ${releaseId} has no valid human approval`, {
      nextStep: 'A human must approve this release in the dashboard.',
    });
  }
}

export class ApprovalStaleError extends ReleaseGuardianError {
  constructor(approvalId: string) {
    super(
      'APPROVAL_STALE',
      `Approval ${approvalId} no longer matches the release contents or evidence`,
      { nextStep: 'Request a new approval for the current release contents.' },
    );
  }
}

export class RemediationNotConfirmedError extends ReleaseGuardianError {
  constructor(releaseId: string) {
    super('REMEDIATION_NOT_CONFIRMED', `Remediation for ${releaseId} has not been confirmed by a human`, {
      nextStep: 'A human must confirm the proposed fix before it is applied.',
    });
  }
}

export class NotImplementedError extends ReleaseGuardianError {
  constructor(feature: string) {
    super('NOT_IMPLEMENTED_IN_MODE', `${feature} is not implemented in this mode`);
  }
}

export class InputValidationError extends ReleaseGuardianError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message);
  }
}

/** Converts any thrown value into a safe, serialisable ErrorInfo. Unknown errors never leak details. */
export function toErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof ReleaseGuardianError) {
    const info: ErrorInfo = { code: error.code, message: error.message };
    if (error.nextStep !== undefined) {
      info.nextStep = error.nextStep;
    }
    return info;
  }
  return { code: 'INTERNAL', message: 'An unexpected error occurred' };
}
