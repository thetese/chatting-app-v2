export const permissionsMatrix: Record<string, string[]> = {
  OWNER: ['org.manage', 'security.manage', 'compliance.export', 'channel.manage'],
  ADMIN: ['org.manage', 'channel.manage'],
  SECURITY_ADMIN: ['security.manage'],
  COMPLIANCE_ADMIN: ['compliance.export', 'retention.manage'],
  MEMBER: ['message.send'],
  GUEST: ['message.read']
};

export function hasPermission(roles: string[], permission: string): boolean {
  return roles.some((role) => permissionsMatrix[role]?.includes(permission));
}
