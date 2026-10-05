import type { ComponentKey, MetadataComponent } from '@release-guardian/shared';

/** Builds the stable key "<type>:<apiName>", e.g. "ApexClass:DiscountApprovalService". */
export function componentKey(component: Pick<MetadataComponent, 'type' | 'apiName'>): ComponentKey {
  return `${component.type}:${component.apiName}`;
}
