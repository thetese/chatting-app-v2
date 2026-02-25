import { describe, it, expect } from 'vitest';
import { hasPermission } from '../src/services/rbac';

describe('RBAC matrix', () => {
  it('allows compliance export for compliance admins', () => {
    expect(hasPermission(['COMPLIANCE_ADMIN'], 'compliance.export')).toBe(true);
  });

  it('denies org management to guests', () => {
    expect(hasPermission(['GUEST'], 'org.manage')).toBe(false);
  });
});
