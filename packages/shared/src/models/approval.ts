import type { ReadinessReport } from './readiness.js';
import type { RiskAssessment } from './risk.js';

export interface ApprovalRequest {
  id: string;
  releaseId: string;
  readinessSnapshot: ReadinessReport;
  riskSnapshot: RiskAssessment;
  /** Hash of the evidence bundle at request time. */
  evidenceHash: string;
  /** Release content version at request time; approval goes stale if this changes (spec 24.2). */
  contentVersion: number;
  requestedAt: string;
}

export interface ApprovalDecision {
  /** This id is the "approvalId" passed to CopadoService.deploy(). */
  id: string;
  requestId: string;
  decision: 'APPROVED' | 'REJECTED';
  /** Human identity. Never an AI service or automatic transition. */
  decidedBy: string;
  comment: string;
  decidedAt: string;
}
