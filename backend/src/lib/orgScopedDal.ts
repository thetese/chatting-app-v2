import { prisma } from './prisma';

type OrgScopedWhere = { id?: string; orgId?: string; [key: string]: unknown };
type OrgScopedData = { orgId?: string; [key: string]: unknown };

type Delegate = {
  findFirst: (args: { where: OrgScopedWhere }) => Promise<unknown>;
  findMany: (args: { where: OrgScopedWhere }) => Promise<unknown>;
  create: (args: { data: OrgScopedData }) => Promise<unknown>;
  updateMany: (args: { where: OrgScopedWhere; data: OrgScopedData }) => Promise<unknown>;
  deleteMany: (args: { where: OrgScopedWhere }) => Promise<unknown>;
};

function enforceOrgId(args: { orgId: string; where?: OrgScopedWhere; data?: OrgScopedData }) {
  const { orgId, where, data } = args;

  if (where?.orgId && where.orgId !== orgId) {
    throw new Error('CROSS_TENANT_WHERE_BLOCKED');
  }

  if (data?.orgId && data.orgId !== orgId) {
    throw new Error('CROSS_TENANT_DATA_BLOCKED');
  }

  return {
    where: { ...(where ?? {}), orgId },
    data: { ...(data ?? {}), orgId }
  };
}

export function createOrgScopedDal(delegate: Delegate, orgId: string) {
  return {
    async findById(id: string) {
      const { where } = enforceOrgId({ orgId, where: { id } });
      return delegate.findFirst({ where });
    },
    async findMany(where: OrgScopedWhere = {}) {
      const scoped = enforceOrgId({ orgId, where });
      return delegate.findMany({ where: scoped.where });
    },
    async create(data: OrgScopedData) {
      const scoped = enforceOrgId({ orgId, data });
      return delegate.create({ data: scoped.data });
    },
    async updateMany(where: OrgScopedWhere, data: OrgScopedData) {
      const scopedWhere = enforceOrgId({ orgId, where }).where;
      const scopedData = enforceOrgId({ orgId, data }).data;
      return delegate.updateMany({ where: scopedWhere, data: scopedData });
    },
    async deleteMany(where: OrgScopedWhere) {
      const scoped = enforceOrgId({ orgId, where });
      return delegate.deleteMany({ where: scoped.where });
    }
  };
}

export function orgDal(orgId: string) {
  return {
    sessions: createOrgScopedDal(prisma.session, orgId),
    conversations: createOrgScopedDal(prisma.conversation, orgId),
    messages: createOrgScopedDal(prisma.message, orgId),
    files: createOrgScopedDal(prisma.fileObject, orgId),
    audits: createOrgScopedDal(prisma.auditLog, orgId)
  };
}

export { enforceOrgId };
