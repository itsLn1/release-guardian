import { describe, expect, it } from 'vitest';
import { componentKey } from './componentKey.js';

describe('componentKey', () => {
  it('formats <type>:<apiName>', () => {
    expect(componentKey({ type: 'ApexClass', apiName: 'DiscountApprovalService' })).toBe(
      'ApexClass:DiscountApprovalService',
    );
    expect(componentKey({ type: 'CustomField', apiName: 'Opportunity.Discount_Tier__c' })).toBe(
      'CustomField:Opportunity.Discount_Tier__c',
    );
  });
});
