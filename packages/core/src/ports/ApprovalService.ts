import type {
  ApprovalDecision,
  ApprovalRequest,
  ReadinessReport,
  RiskAssessment,
} from '@release-guardian/shared';

/** Context an approval must still match at deploy time. */
export interface DeployContext {
  releaseId: string;
  contentVersion: number;
  evidenceHash: string;
}

/**
 * Records human approval decisions and guards deployment (MASTER_SPEC.md section 24).
 * Implementation arrives in a later phase. It must never be callable by AI services or MCP tools.
 */
export interface ApprovalService {
  createRequest(input: {
    releaseId: string;
    readiness: ReadinessReport;
    risk: RiskAssessment;
    evidenceHash: string;
    contentVersion: number;
  }): Promise<ApprovalRequest>;

  recordDecision(input: {
    requestId: string;
    decision: 'APPROVED' | 'REJECTED';
    decidedBy: string;
    comment: string;
  }): Promise<ApprovalDecision>;

  /**
   * Throws ApprovalRequiredError if approvalId is unknown, not APPROVED, or already consumed.
   * Throws ApprovalStaleError if contentVersion or evidenceHash no longer match.
   */
  assertDeployable(approvalId: string, context: DeployContext): Promise<void>;

  /** Approvals are single-use. */
  markConsumed(approvalId: string): Promise<void>;
}
