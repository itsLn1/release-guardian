import type { ApprovalDecision } from './approval.js';
import type { ReadinessReport } from './readiness.js';
import type { RiskAssessment } from './risk.js';
import type { Deployment } from './validation.js';

export const EVIDENCE_TYPES = [
  'RELEASE_SELECTED',
  'CHANGE_ANALYSIS',
  'DEPENDENCY_ANALYSIS',
  'RISK_ASSESSMENT',
  'TEST_RECOMMENDATION',
  'TEST_RUN',
  'DEPLOYMENT_VALIDATION',
  'FAILURE_DIAGNOSIS',
  'REMEDIATION_PLAN',
  'REMEDIATION_APPLIED',
  'READINESS_REPORT',
  'APPROVAL_REQUEST',
  'APPROVAL_DECISION',
  'DEPLOYMENT_RESULT',
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export type EvidenceSource = 'DEMO' | 'COPADO' | 'CRT' | 'RULES_ENGINE' | 'AI' | 'HUMAN';

/** Append-only. Corrections use `supersedes`; items are never mutated or deleted. */
export interface EvidenceItem {
  id: string;
  releaseId: string;
  type: EvidenceType;
  title: string;
  summary: string;
  source: EvidenceSource;
  createdAt: string;
  contentVersion: number;
  payload: unknown;
  supersedes?: string;
}

export interface EvidenceBundle {
  releaseId: string;
  generatedAt: string;
  items: EvidenceItem[];
  finalReadiness: ReadinessReport;
  finalRisk: RiskAssessment;
  approval?: ApprovalDecision;
  deployment?: Deployment;
  /** SHA-256 over canonical JSON. An integrity indicator, not a digital signature. */
  bundleHash: string;
  hashAlgorithm: 'SHA-256';
}
