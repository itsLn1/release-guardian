/** Source of time. Core code must never read the system clock directly (MASTER_SPEC.md 26.1). */
export interface Clock {
  /** Current time as an ISO-8601 string. */
  now(): string;
}
