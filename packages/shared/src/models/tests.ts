import type { ComponentKey } from './release.js';

export type TestKind = 'APEX' | 'CRT';
export type TestStatus = 'NOT_RUN' | 'RUNNING' | 'PASSED' | 'FAILED';

/** A test that exists and could be run (catalog entry). */
export interface AvailableTest {
  testId: string;
  name: string;
  kind: TestKind;
  coversComponents: ComponentKey[];
  /** 0..1 */
  historicalFlakiness: number;
}

export interface TestRecommendation {
  testId: string;
  name: string;
  kind: TestKind;
  reason: string;
  priority: 'MUST_RUN' | 'SHOULD_RUN';
  coversComponents: ComponentKey[];
}

export interface TestResult {
  testId: string;
  name: string;
  kind: TestKind;
  status: TestStatus;
  durationMs: number;
  failureMessage?: string;
}

export interface ClassCoverage {
  apiName: string;
  percent: number;
}

export interface CoverageSummary {
  perClass: ClassCoverage[];
  overallPercent: number;
}

export interface TestRun {
  id: string;
  releaseId: string;
  attempt: number;
  results: TestResult[];
  coverage: CoverageSummary;
}
