import type { CoverageSummary } from './tests.js';

export type ValidationStatus = 'PASSED' | 'FAILED';

export interface ValidationError {
  /** Release Guardian demo codes, e.g. "MISSING_REFERENCE". Not real Copado/Salesforce error codes. */
  code: string;
  component?: string;
  message: string;
}

export interface DeploymentValidation {
  id: string;
  releaseId: string;
  attempt: number;
  status: ValidationStatus;
  errors: ValidationError[];
  coverage: CoverageSummary;
}

export interface Deployment {
  id: string;
  releaseId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  /** Id of the APPROVED ApprovalDecision that authorised this deployment. Required. */
  approvalId: string;
  startedAt: string;
  finishedAt?: string;
}
