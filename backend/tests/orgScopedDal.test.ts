import { describe, expect, it, vi } from 'vitest';
import { createOrgScopedDal, enforceOrgId } from '../src/lib/orgScopedDal';

function createDelegate() {
  return {
    findFirst: vi.fn(async ({ where }) => ({ where })),
    findMany: vi.fn(async ({ where }) => [{ where }]),
    create: vi.fn(async ({ data }) => ({ data })),
    updateMany: vi.fn(async ({ where, data }) => ({ where, data })),
    deleteMany: vi.fn(async ({ where }) => ({ where }))
  };
}

describe('org scoped dal', () => {
  it('forces orgId into read queries even with valid cross-tenant IDs', async () => {
    const delegate = createDelegate();
    const dal = createOrgScopedDal(delegate, 'org-A');

    await dal.findById('msg-from-org-B');

    expect(delegate.findFirst).toHaveBeenCalledWith({ where: { id: 'msg-from-org-B', orgId: 'org-A' } });
  });

  it('blocks explicit cross-tenant where clauses', () => {
    expect(() => enforceOrgId({ orgId: 'org-A', where: { orgId: 'org-B', id: 'x' } })).toThrow('CROSS_TENANT_WHERE_BLOCKED');
  });

  it('blocks explicit cross-tenant writes', async () => {
    const delegate = createDelegate();
    const dal = createOrgScopedDal(delegate, 'org-A');

    await expect(dal.create({ orgId: 'org-B', body: 'hello' })).rejects.toThrow('CROSS_TENANT_DATA_BLOCKED');
  });

  it('keeps updates scoped to current org', async () => {
    const delegate = createDelegate();
    const dal = createOrgScopedDal(delegate, 'org-A');

    await dal.updateMany({ id: 'session-123' }, { status: 'REVOKED' });

    expect(delegate.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-123', orgId: 'org-A' },
      data: { status: 'REVOKED', orgId: 'org-A' }
    });
  });
});
