import type { AvailableTest, ComponentKey, TestRun } from '@release-guardian/shared';

/**
 * What Release Guardian needs from Copado Robotic Testing and Apex test execution.
 * Real API mapping is TBD-LIVE (MASTER_SPEC.md section 12).
 */
export interface CrtService {
  /** Catalog of available tests (Apex + CRT) relevant to a set of components. */
  listAvailableTests(components: ComponentKey[]): Promise<AvailableTest[]>;

  /** Run the given tests. `attempt` is supplied by the orchestrator so demo behaviour stays deterministic. */
  runTests(releaseId: string, testIds: string[], attempt: number): Promise<TestRun>;

  getTestRun(runId: string): Promise<TestRun>;
}
