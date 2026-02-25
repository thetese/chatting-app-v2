export function requireOrgScope(orgId?: string) {
  if (!orgId) {
    throw new Error('ORG_SCOPE_REQUIRED');
  }
  return orgId;
}
