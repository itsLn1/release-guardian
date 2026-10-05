export type ReadinessStatus = 'BLOCKED' | 'NEEDS_ATTENTION' | 'READY_FOR_APPROVAL';

export interface ReadinessGate {
  id: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  detail: string;
  evidenceIds: string[];
}

export interface ReadinessReport {
  releaseId: string;
  status: ReadinessStatus;
  gates: ReadinessGate[];
  computedAt: string;
}
