import type { ReleaseRun } from '@release-guardian/shared';

/** Persistence for release runs. Hackathon scope: in-memory implementation only. */
export interface ReleaseRunStore {
  get(releaseId: string): Promise<ReleaseRun | undefined>;
  save(run: ReleaseRun): Promise<void>;
  /** Removes all runs. Used by demo reset. */
  clear(): Promise<void>;
}
