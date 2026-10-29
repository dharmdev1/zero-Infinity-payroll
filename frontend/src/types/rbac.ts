/**
 * Centralized role and permission definitions.
 *
 * Permissions are strings so a future FastAPI backend can serve the same
 * vocabulary. Frontend checks (route guards, UI affordances) are UX only —
 * real enforcement must happen on the server.
 */

export type Role = 'SUPER_ADMIN' | 'HR_ADMIN' | 'EMPLOYEE'

export const ROLES: Role[] = ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE']

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  HR_ADMIN: 'HR Admin',
  EMPLOYEE: 'Employee',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SUPER_ADMIN: 'Full workspace control including roles, permissions and audit logs.',
  HR_ADMIN: 'Authorized HR capabilities only; compensation stays restricted to Payroll.',
  EMPLOYEE: 'Self-service access limited to the employee’s own permitted data.',
}

export type Permission =
  | 'dashboard.admin.view'
  | 'dashboard.self.view'
  | 'directory.view'
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.status'
  | 'employees.deactivate'
  | 'employees.delete'
  | 'attendance.view'
  | 'attendance.write'
  | 'attendance.reports'
  | 'leave.view'
  | 'leave.approve'
  | 'tasks.view'
  | 'tasks.manage'
  | 'projects.view'
  | 'projects.manage'
  | 'recruitment.view'
  | 'recruitment.manage'
  | 'payroll.view'
  | 'payroll.manage'
  | 'documents.view'
  | 'documents.manage'
  | 'reports.view'
  | 'reports.export'
  | 'settings.company'
  | 'settings.users'
  | 'settings.roles'
  | 'settings.permissions'
  | 'settings.audit'
  | 'self.view'
  | 'self.request.leave'
  | 'self.request.correction'

export const PERMISSION_LABELS: Record<Permission, string> = {
  'dashboard.admin.view': 'View admin dashboard',
  'dashboard.self.view': 'View self dashboard',
  'directory.view': 'View company directory',
  'employees.view': 'View employee directory & profiles',
  'employees.create': 'Create employees',
  'employees.edit': 'Edit employee records',
  'employees.status': 'Change employment status',
  'employees.deactivate': 'Deactivate employees',
  'employees.delete': 'Delete employees permanently',
  'attendance.view': 'View attendance',
  'attendance.write': 'Add / correct attendance',
  'attendance.reports': 'View attendance reports',
  'leave.view': 'View leave requests',
  'leave.approve': 'Approve or reject leave',
  'tasks.view': 'View tasks',
  'tasks.manage': 'Create & manage tasks',
  'projects.view': 'View projects',
  'projects.manage': 'Manage projects',
  'recruitment.view': 'View recruitment',
  'recruitment.manage': 'Manage recruitment',
  'payroll.view': 'View payroll',
  'payroll.manage': 'Run & approve payroll',
  'documents.view': 'View documents',
  'documents.manage': 'Manage documents',
  'reports.view': 'View reports',
  'reports.export': 'Export reports',
  'settings.company': 'Manage company profile',
  'settings.users': 'Manage users',
  'settings.roles': 'Manage roles',
  'settings.permissions': 'Manage permissions',
  'settings.audit': 'View audit logs',
  'self.view': 'View own data',
  'self.request.leave': 'Request leave',
  'self.request.correction': 'Request attendance correction',
}

const HR_ADMIN_PERMISSIONS: Permission[] = [
  'dashboard.admin.view',
  'employees.view',
  'employees.create',
  'employees.edit',
  'employees.status',
  'employees.deactivate',
  'attendance.view',
  'attendance.write',
  'attendance.reports',
  'leave.view',
  'leave.approve',
  'tasks.view',
  'projects.view',
  'recruitment.view',
  'recruitment.manage',
  'documents.view',
  'documents.manage',
  'reports.view',
  'reports.export',
  'settings.company',
  'settings.users',
  'settings.audit',
  'self.view',
  'self.request.leave',
  'self.request.correction',
]

const EMPLOYEE_PERMISSIONS: Permission[] = [
  'dashboard.self.view',
  'self.view',
  'self.request.leave',
  'self.request.correction',
  'tasks.view',
  'projects.view',
  'directory.view',
  'documents.view',
]

export const ALL_PERMISSIONS: Permission[] = Object.keys(PERMISSION_LABELS) as Permission[]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  HR_ADMIN: HR_ADMIN_PERMISSIONS,
  EMPLOYEE: EMPLOYEE_PERMISSIONS,
}

export function roleHas(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

type SessionLike = { role: Role } | null | undefined

export function hasPermission(session: SessionLike, permission: Permission): boolean {
  return !!session && roleHas(session.role, permission)
}

export function hasAnyPermission(session: SessionLike, permissions: Permission[]): boolean {
  return !!session && permissions.some((p) => roleHas(session.role, p))
}
