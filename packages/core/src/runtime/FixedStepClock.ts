import type { Clock } from '../ports/Clock.js';

/** Default start of the demo timeline (MASTER_SPEC.md 26.1). */
export const DEMO_CLOCK_START = '2026-09-14T09:00:00.000Z';

/** Default demo step: +15 seconds per call. */
export const DEMO_CLOCK_STEP_MS = 15_000;

/**
 * Deterministic clock: the nth call to now() returns start + n * stepMs.
 * Never reads the system clock, so identical runs produce identical timestamps.
 */
export class FixedStepClock implements Clock {
  private readonly startMs: number;
  private calls = 0;

  constructor(
    start: string = DEMO_CLOCK_START,
    private readonly stepMs: number = DEMO_CLOCK_STEP_MS,
  ) {
    this.startMs = Date.parse(start);
    if (Number.isNaN(this.startMs)) {
      throw new RangeError(`Invalid clock start: ${start}`);
    }
  }

  now(): string {
    const value = new Date(this.startMs + this.calls * this.stepMs).toISOString();
    this.calls += 1;
    return value;
  }
}
