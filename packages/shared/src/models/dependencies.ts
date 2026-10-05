import type { ComponentKey, Criticality, MetadataType } from './release.js';

export interface DependencyEdge {
  from: ComponentKey;
  to: ComponentKey;
  kind: 'REFERENCES' | 'CALLS' | 'TRIGGERS' | 'READS_FIELD';
}

/** Downstream component that is NOT in the release but could be affected by it. */
export interface ImpactedComponent {
  key: ComponentKey;
  type: MetadataType;
  apiName: string;
  criticality: Criticality;
  reason: string;
}

/** Upstream component required by the release but absent from it. */
export interface MissingDependency {
  key: ComponentKey;
  requiredBy: ComponentKey[];
  presentInTarget: boolean;
  severity: 'WARNING' | 'BLOCKER';
}

export interface DependencyAnalysis {
  releaseId: string;
  changed: ComponentKey[];
  impacted: ImpactedComponent[];
  missing: MissingDependency[];
  edges: DependencyEdge[];
}
