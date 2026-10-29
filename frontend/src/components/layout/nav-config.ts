import type { LucideIcon } from 'lucide-react'
import { LayoutGrid, Users, UserPlus, CalendarCheck2, CheckCheck, Wallet, BarChart3, Settings, Home, Clock4, ListTodo, Landmark, FileText, Building2, LifeBuoy, Newspaper } from 'lucide-react'
import type { Permission } from '@/types/rbac'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  permission: Permission
  /** NavLink end matching for parent paths. */
  end?: boolean
}

export interface NavSection {
  heading: string
  items: NavItem[]
}

/** HR / Super Admin navigation (matches the reference sidebar). */
export const ADMIN_NAV: NavSection[] = [
  {
    heading: 'Workspace',
    items: [
      { label: 'Overview', to: '/dashboard', icon: LayoutGrid, permission: 'dashboard.admin.view' },
      { label: 'Employees', to: '/employees', icon: Users, permission: 'directory.view' },
      { label: 'Recruitment', to: '/recruitment/jobs', icon: UserPlus, permission: 'recruitment.view' },
      { label: 'Attendance', to: '/attendance', icon: Clock4, permission: 'attendance.view' },
      { label: 'Leave requests', to: '/leave/requests', icon: CalendarCheck2, permission: 'leave.view' },
      { label: 'Tasks & projects', to: '/tasks', icon: CheckCheck, permission: 'tasks.view' },
      { label: 'Payroll', to: '/payroll', icon: Wallet, permission: 'payroll.view' },
      { label: 'Documents', to: '/documents', icon: Landmark, permission: 'documents.view' },
      { label: 'Reports', to: '/reports', icon: BarChart3, permission: 'reports.view' },
    ],
  },
  {
    heading: 'Administration',
    items: [{ label: 'Settings & permissions', to: '/settings/company', icon: Settings, permission: 'settings.company' }],
  },
]

/** Employee self-service navigation (matches the reference). */
export const SELF_NAV: NavSection[] = [
  {
    heading: 'My workspace',
    items: [
      { label: 'My dashboard', to: '/dashboard', icon: Home, permission: 'dashboard.self.view' },
      { label: 'My attendance', to: '/my/attendance', icon: Clock4, permission: 'self.view' },
      { label: 'My tasks', to: '/my/tasks', icon: ListTodo, permission: 'tasks.view' },
      { label: 'Leave & holidays', to: '/my/leave', icon: CalendarCheck2, permission: 'self.view' },
      { label: 'My payslips', to: '/my/payslips', icon: Wallet, permission: 'self.view' },
      { label: 'My documents', to: '/my/documents', icon: FileText, permission: 'self.view' },
      { label: 'Company directory', to: '/employees', icon: Building2, permission: 'directory.view' },
    ],
  },
  {
    heading: 'Support',
    items: [{ label: 'Help & support', to: '/help', icon: LifeBuoy, permission: 'self.view' }],
  },
]

/** Static title map for breadcrumb trailing text on shared paths. */
export const PATH_TITLE_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/attendance': 'Attendance',
  '/attendance/records': 'Records',
  '/attendance/calendar': 'Calendar',
  '/attendance/reports': 'Reports',
  '/leave': 'Leave requests',
  '/leave/requests': 'Requests',
  '/leave/approvals': 'Leave',
  '/leave/balances': 'Leave balances',
  '/tasks': 'Tasks & projects',
  '/projects': 'Projects',
  '/recruitment': 'Recruitment',
  '/recruitment/jobs': 'Jobs',
  '/recruitment/candidates': 'Candidates',
  '/recruitment/interviews': 'Interviews',
  '/payroll': 'Payroll',
  '/payroll/runs': 'Payroll runs',
  '/payroll/payslips': 'Payslips',
  '/documents': 'Documents',
  '/reports': 'Reports',
  '/reports/employees': 'Employee reports',
  '/reports/attendance': 'Attendance reports',
  '/reports/leave': 'Leave reports',
  '/reports/payroll': 'Payroll reports',
  '/settings': 'Settings',
  '/settings/company': 'Company',
  '/settings/users': 'Users',
  '/settings/roles': 'Roles',
  '/settings/permissions': 'Permissions',
  '/settings/audit-logs': 'Audit logs',
  '/my/profile': 'My profile',
  '/my/attendance': 'My attendance',
  '/my/leave': 'Leave & holidays',
  '/my/tasks': 'My tasks',
  '/my/documents': 'My documents',
  '/my/payslips': 'My payslips',
  '/help': 'Help & support',
  '/login': 'Sign in',
  '/forgot-password': 'Forgot password',
  '/reset-password': 'Reset password',
}

export const NEWS_ICON = Newspaper
