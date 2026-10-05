import type {
  DeploymentValidation,
  Deployment,
  DependencyAnalysis,
  Environment,
  MetadataComponent,
  Release,
  ReleaseHistory,
  ReleaseSummary,
  RemediationPlan,
} from '@release-guardian/shared';

/**
 * What Release Guardian needs from a Copado-like release platform.
 * Deliberately NOT shaped like any real Copado API. Mapping to real
 * capabilities is TBD-LIVE (MASTER_SPEC.md sections 11 and 29).
 */
export interface CopadoService {
  listReleases(): Promise<ReleaseSummary[]>;
  getRelease(releaseId: string): Promise<Release>;
  getEnvironments(releaseId: string): Promise<Environment[]>;

  /** Changed components in the release/story, with classification. */
  getChanges(releaseId: string): Promise<MetadataComponent[]>;

  /** Dependency graph around the changed set. */
  getDependencies(releaseId: string): Promise<DependencyAnalysis>;

  /** Historical signals used by the risk engine. */
  getHistory(releaseId: string): Promise<ReleaseHistory>;

  /** Check-only validation against the target environment. */
  validateDeployment(releaseId: string): Promise<DeploymentValidation>;

  /** Apply a human-confirmed remediation to the story/branch (never touches production). */
  applyRemediation(releaseId: string, plan: RemediationPlan): Promise<void>;

  /**
   * Execute deployment. Every implementation MUST verify, via ApprovalService,
   * that approvalId refers to a valid APPROVED decision, and throw
   * ApprovalRequiredError otherwise (MASTER_SPEC.md 11.4).
   */
  deploy(releaseId: string, approvalId: string): Promise<Deployment>;
  getDeployment(deploymentId: string): Promise<Deployment>;
}
