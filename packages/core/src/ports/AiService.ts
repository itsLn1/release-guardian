import type {
  ApproverSummary,
  DeploymentValidation,
  DependencyAnalysis,
  Diagnosis,
  EvidenceItem,
  ReadinessReport,
  Release,
  RemediationPlan,
  RiskAssessment,
  RiskNarrative,
  TestResult,
} from '@release-guardian/shared';

/**
 * AI explains, diagnoses and proposes. It never sets risk scores, readiness,
 * approvals or deployments (MASTER_SPEC.md 13.1). All outputs are structured.
 */
export interface AiService {
  explainRisk(input: {
    assessment: RiskAssessment;
    dependencies: DependencyAnalysis;
  }): Promise<RiskNarrative>;

  diagnoseFailure(input: {
    release: Release;
    validation: DeploymentValidation;
    failedTests: TestResult[];
    dependencies: DependencyAnalysis;
    evidence: EvidenceItem[];
  }): Promise<Diagnosis>;

  proposeRemediation(input: { diagnosis: Diagnosis; release: Release }): Promise<RemediationPlan>;

  summarizeForApprover(input: {
    readiness: ReadinessReport;
    risk: RiskAssessment;
    evidence: EvidenceItem[];
  }): Promise<ApproverSummary>;
}
