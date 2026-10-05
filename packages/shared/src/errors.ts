/** Shared error codes (MASTER_SPEC.md section 18.4). Error classes live in @release-guardian/core. */
export const ERROR_CODES = [
  'RELEASE_NOT_FOUND',
  'INVALID_TRANSITION',
  'APPROVAL_REQUIRED',
  'APPROVAL_STALE',
  'REMEDIATION_NOT_CONFIRMED',
  'NOT_IMPLEMENTED_IN_MODE',
  'VALIDATION_ERROR',
  'INTERNAL',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ErrorInfo {
  code: ErrorCode;
  message: string;
  /** Hint such as "A human must approve this release in the dashboard." */
  nextStep?: string;
}
