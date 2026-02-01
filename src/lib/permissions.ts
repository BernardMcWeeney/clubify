// Role-Based Access Control (RBAC) System for Clubify

export type Role = 'admin' | 'pro' | 'treasurer' | 'editor' | 'viewer';

export type Permission =
  // Content
  | 'posts.create'
  | 'posts.edit'
  | 'posts.delete'
  | 'posts.publish'
  | 'pages.create'
  | 'pages.edit'
  | 'pages.delete'
  | 'pages.publish'
  // Fixtures
  | 'fixtures.create'
  | 'fixtures.edit'
  | 'fixtures.delete'
  | 'fixtures.result'
  // Media
  | 'media.upload'
  | 'media.delete'
  // Homepage
  | 'homepage.edit'
  // Social & Publishing
  | 'social.connect'
  | 'social.disconnect'
  | 'publish.content'
  // Team
  | 'team.view'
  | 'team.invite'
  | 'team.remove'
  | 'team.change_role'
  // Settings
  | 'settings.view'
  | 'settings.edit'
  | 'club.edit'
  // Audit
  | 'audit.view'
  // Admin
  | 'club.delete';

// Permission matrix - defines what each role can do
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // Full access
    'posts.create', 'posts.edit', 'posts.delete', 'posts.publish',
    'pages.create', 'pages.edit', 'pages.delete', 'pages.publish',
    'fixtures.create', 'fixtures.edit', 'fixtures.delete', 'fixtures.result',
    'media.upload', 'media.delete',
    'homepage.edit',
    'social.connect', 'social.disconnect', 'publish.content',
    'team.view', 'team.invite', 'team.remove', 'team.change_role',
    'settings.view', 'settings.edit', 'club.edit',
    'audit.view',
    'club.delete',
  ],
  pro: [
    // Public Relations Officer - content & social publishing
    'posts.create', 'posts.edit', 'posts.delete', 'posts.publish',
    'pages.create', 'pages.edit', 'pages.delete', 'pages.publish',
    'fixtures.create', 'fixtures.edit', 'fixtures.delete', 'fixtures.result',
    'media.upload', 'media.delete',
    'homepage.edit',
    'publish.content',
    'team.view',
    'settings.view',
  ],
  treasurer: [
    // Financial focus - can view audit for transparency
    'posts.create', 'posts.edit',
    'media.upload',
    'team.view',
    'settings.view',
    'audit.view',
  ],
  editor: [
    // Content creation only (no publishing)
    'posts.create', 'posts.edit',
    'pages.create', 'pages.edit',
    'fixtures.create', 'fixtures.edit',
    'media.upload',
    'team.view',
  ],
  viewer: [
    // Read-only access
    'team.view',
  ],
};

// Role hierarchy for display and comparison
export const ROLE_HIERARCHY: Role[] = ['admin', 'pro', 'treasurer', 'editor', 'viewer'];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  pro: 'PRO',
  treasurer: 'Treasurer',
  editor: 'Editor',
  viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Full access to all club features and settings',
  pro: 'Can publish content and manage social media',
  treasurer: 'Can view audit logs and financial reports',
  editor: 'Can create and edit content (no publishing)',
  viewer: 'Read-only access to admin portal',
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the given permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has all of the given permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if roleA can manage roleB (for inviting, changing roles)
 * Admin can manage all, PRO can't manage anyone, etc.
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  // Only admin can manage roles
  if (managerRole !== 'admin') return false;
  // Admin can manage all roles except other admins
  return targetRole !== 'admin';
}

/**
 * Get roles that a manager can assign
 */
export function getAssignableRoles(managerRole: Role): Role[] {
  if (managerRole !== 'admin') return [];
  // Admin can assign all roles except admin
  return ROLE_HIERARCHY.filter(r => r !== 'admin');
}

/**
 * Permission check helper for API routes
 */
export function requirePermission(
  role: string | undefined,
  permission: Permission
): { allowed: boolean; error?: string } {
  if (!role) {
    return { allowed: false, error: 'Not authenticated' };
  }

  if (!ROLE_HIERARCHY.includes(role as Role)) {
    return { allowed: false, error: 'Invalid role' };
  }

  if (!hasPermission(role as Role, permission)) {
    return { allowed: false, error: 'Insufficient permissions' };
  }

  return { allowed: true };
}

/**
 * Permission check helper that throws for API routes
 */
export function assertPermission(role: string | undefined, permission: Permission): void {
  const { allowed, error } = requirePermission(role, permission);
  if (!allowed) {
    throw new Error(error);
  }
}

// Helper type for checking permissions in components
export interface PermissionContext {
  role: Role;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
}

/**
 * Create a permission context for use in components
 */
export function createPermissionContext(role: Role): PermissionContext {
  return {
    role,
    can: (permission) => hasPermission(role, permission),
    canAny: (permissions) => hasAnyPermission(role, permissions),
    canAll: (permissions) => hasAllPermissions(role, permissions),
  };
}
