import type { ApprovalDecision, ApprovalRequest } from './approval.js';
import type { Diagnosis, RemediationPlan } from './diagnosis.js';
import type { DependencyAnalysis } from './dependencies.js';
import type { ReadinessReport } from './readiness.js';
import type { ChangeAnalysis } from './release.js';
import type { RiskAssessment } from './risk.js';
import type { TestRecommendation, TestRun } from './tests.js';
import type { Deployment, DeploymentValidation } from './validation.js';

export const AGENT_STATES = [
  'IDLE',
  'RELEASE_SELECTED',
  'ANALYZING_CHANGES',
  'ANALYZING_DEPENDENCIES',
  'SCORING_RISK',
  'RECOMMENDING_TESTS',
  'RUNNING_TESTS',
  'VALIDATING_DEPLOYMENT',
  'DIAGNOSING_FAILURE',
  'PREPARING_REMEDIATION',
  'AWAITING_REMEDIATION_CONFIRMATION',
  'APPLYING_REMEDIATION',
  'EVALUATING_READINESS',
  'READY_FOR_APPROVAL',
  'AWAITING_APPROVAL',
  'APPROVED',
  'DEPLOYING',
  'DEPLOYED',
  'GENERATING_EVIDENCE',
  'COMPLETED',
  'BLOCKED',
  'REJECTED',
  'FAILED',
] as const;

export type AgentState = (typeof AGENT_STATES)[number];

export interface StepLogEntry {
  at: string;
  fromState: AgentState;
  toState: AgentState;
  message: string;
}

/** Full persisted state of one release workflow. */
export interface ReleaseRun {
  releaseId: string;
  state: AgentState;
  /** Validation/test attempt counter; drives demo determinism. */
  attempt: number;
  /** Incremented when release contents change (remediation). Older evidence becomes stale. */
  contentVersion: number;
  analysis?: ChangeAnalysis;
  dependencies?: DependencyAnalysis;
  risk?: RiskAssessment;
  recommendations?: TestRecommendation[];
  testRuns: TestRun[];
  validations: DeploymentValidation[];
  diagnosis?: Diagnosis;
  remediation?: RemediationPlan;
  readiness?: ReadinessReport;
  approvalRequest?: ApprovalRequest;
  approvalDecision?: ApprovalDecision;
  deployment?: Deployment;
  stepLog: StepLogEntry[];
}
