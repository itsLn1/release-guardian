export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const RISK_FACTOR_IDS = [
  'CHANGE_SCOPE',
  'METADATA_CRITICALITY',
  'DEPENDENCY_BLAST_RADIUS',
  'TEST_COVERAGE_GAP',
  'TEST_RESULTS',
  'DEPLOYMENT_VALIDATION',
  'HISTORICAL_HOTSPOT',
] as const;

export type RiskFactorId = (typeof RISK_FACTOR_IDS)[number];

export interface RiskFactor {
  id: RiskFactorId;
  label: string;
  /** Integer weight; all weights in a policy sum to 100. */
  weight: number;
  /** 0-100, higher means riskier. */
  score: number;
  /** weight * score / 100, rounded to 2 decimals. */
  contribution: number;
  /** Deterministic, human-readable explanation (ADR-004). */
  explanation: string;
  evidenceIds: string[];
}

export interface RiskAssessment {
  releaseId: string;
  /** Integer 0-100. */
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  policyVersion: string;
  computedAt: string;
  /** What caused this assessment, e.g. "after-validation-failure". */
  trigger: string;
}

export interface RiskPolicy {
  version: string;
  weights: Record<RiskFactorId, number>;
  levelThresholds: { medium: number; high: number; critical: number };
  coverageThresholdPercent: number;
}
