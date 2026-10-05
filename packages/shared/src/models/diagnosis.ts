import type { ComponentKey } from './release.js';

export interface RootCause {
  id: string;
  summary: string;
  category: 'MISSING_DEPENDENCY' | 'COVERAGE_GAP' | 'TEST_FAILURE' | 'OTHER';
  /** 0..1 */
  confidence: number;
  supportingEvidenceIds: string[];
  affectedComponents: ComponentKey[];
}

export interface Diagnosis {
  releaseId: string;
  rootCauses: RootCause[];
  generatedBy: 'AI' | 'RULES';
}

export interface RemediationAction {
  id: string;
  rootCauseId: string;
  kind: 'ADD_COMPONENT_TO_STORY' | 'ADD_TEST_METHOD' | 'OTHER';
  description: string;
  target: string;
  /** Text or diff shown to the user before they confirm. */
  patchPreview?: string;
}

export interface RemediationPlan {
  id: string;
  releaseId: string;
  actions: RemediationAction[];
  /** Risk of applying the fix itself. */
  risk: 'LOW' | 'MEDIUM';
  status: 'PROPOSED' | 'APPLIED' | 'REJECTED';
}
