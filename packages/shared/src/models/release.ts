/** Release, story, metadata and environment models. See MASTER_SPEC.md section 10. */

export type ReleaseStatus = 'DRAFT' | 'IN_PROGRESS' | 'READY' | 'DEPLOYED' | 'FAILED' | 'REJECTED';

export type Criticality = 'LOW' | 'MEDIUM' | 'HIGH';

export type MetadataType =
  | 'ApexClass'
  | 'ApexTrigger'
  | 'Flow'
  | 'CustomField'
  | 'CustomObject'
  | 'PermissionSet'
  | 'LightningComponentBundle'
  | 'ValidationRule';

export type ChangeType = 'ADDED' | 'MODIFIED' | 'DELETED';

/** Stable component identifier, formatted "<MetadataType>:<apiName>", e.g. "ApexClass:DiscountApprovalService". */
export type ComponentKey = string;

export interface MetadataComponent {
  type: MetadataType;
  apiName: string;
  changeType: ChangeType;
  linesChanged?: number;
  criticality: Criticality;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  author: string;
  components: MetadataComponent[];
}

export interface Release {
  id: string;
  name: string;
  targetEnvironmentId: string;
  stories: UserStory[];
  status: ReleaseStatus;
}

export interface ReleaseSummary {
  id: string;
  name: string;
  targetEnvironmentId: string;
  status: ReleaseStatus;
  storyCount: number;
}

export interface Environment {
  id: string;
  name: string;
  kind: 'DEV' | 'QA' | 'UAT' | 'PRODUCTION';
}

export interface PriorFailure {
  releaseId: string;
  componentKeys: ComponentKey[];
  summary: string;
}

/** Historical signals consumed by the risk engine. */
export interface ReleaseHistory {
  releaseId: string;
  priorFailures: PriorFailure[];
  highChurnComponents: ComponentKey[];
}

export interface ChangeAnalysis {
  releaseId: string;
  componentCount: number;
  byType: Record<string, number>;
  highCriticalityCount: number;
  totalLinesChanged: number;
  summary: string;
}
