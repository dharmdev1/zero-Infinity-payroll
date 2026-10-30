import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth, RequirePermission } from './guards'

import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth/AuthPages'
import { AdminDashboard } from '@/pages/admin/dashboard'
import { EmployeeDashboard } from '@/pages/employee/dashboard'
import NotFoundPage, { ErrorBoundaryPage, UnauthorizedPage } from '@/pages/shared/error-pages'
import { HelpSupportPage } from '@/pages/shared/HelpSupportPage'

import { EmployeesPage, EmployeeDetailPage, EmployeeFormPage } from '@/pages/admin/employees'
import { AttendanceRoot } from '@/modules/attendance'
import {
  AttendanceDashboardTab,
  AttendanceRecordsTab,
  AttendanceCalendarTab,
  AttendanceManualTab,
  AttendanceReportsTab,
} from '@/pages/admin/attendance'
import { LeaveOverviewPage, LeaveRequestsPage, LeaveApprovalsPage, LeaveBalancesPage } from '@/pages/admin/leave'
import { TasksPage, TaskDetailPage } from '@/pages/admin/tasks'
import { ProjectsPage, ProjectDetailPage } from '@/pages/admin/projects'
import { RecruitmentJobsPage, RecruitmentCandidatesPage, RecruitmentInterviewsPage } from '@/pages/admin/recruitment'
import { PayrollHomePage, PayrollRunsPage, PayrollRunDetailPage, PayrollPayslipsPage } from '@/pages/admin/payroll'
import { DocumentsPage, DocumentDetailPage } from '@/pages/admin/documents'
import { ReportsHome, EmployeeReportsPage, AttendanceReportsPage, LeaveReportsPage, PayrollReportsPage } from '@/pages/admin/reports'
import { CompanySettingsPage, UsersSettingsPage, RolesSettingsPage, PermissionsSettingsPage, AuditLogsPage } from '@/pages/admin/settings'
import { MyProfilePage, MyAttendancePage, MyLeavePage, MyTasksPage, MyDocumentsPage, MyPayslipsPage } from '@/pages/employee'
import { AppProviders } from './providers'
import { useAuth } from './auth-context'

function guarded(children: React.ReactNode, permission: Parameters<typeof RequirePermission>[0]['permission']) {
  return <RequirePermission permission={permission}>{children}</RequirePermission>
}

const attGuard = (children: React.ReactNode) => guarded(children, 'attendance.view')

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppProviders />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: 'dashboard', element: <RoleDashboardSwitch /> },
              { path: 'employees', element: guarded(<EmployeesPage />, 'directory.view') },
              { path: 'employees/new', element: guarded(<EmployeeFormPage mode="create" />, 'employees.create') },
              { path: 'employees/:employeeId', element: guarded(<EmployeeDetailPage />, 'directory.view') },
              { path: 'employees/:employeeId/edit', element: guarded(<EmployeeFormPage mode="edit" />, 'employees.edit') },
              {
                path: 'attendance',
                element: attGuard(
                  <AttendanceRoot>
                    <AttendanceDashboardTab />
                  </AttendanceRoot>,
                ),
              },
              { path: 'attendance/records', element: attGuard(<AttendanceRoot><AttendanceRecordsTab /></AttendanceRoot>) },
              { path: 'attendance/calendar', element: attGuard(<AttendanceRoot><AttendanceCalendarTab /></AttendanceRoot>) },
              {
                path: 'attendance/reports',
                element: guarded(
                  <AttendanceRoot>
                    <AttendanceReportsTab />
                  </AttendanceRoot>,
                  'attendance.reports',
                ),
              },
              {
                path: 'attendance/corrections',
                element: guarded(
                  <AttendanceRoot>
                    <AttendanceManualTab />
                  </AttendanceRoot>,
                  'attendance.write',
                ),
              },
              {
                path: 'attendance/manual',
                element: guarded(
                  <AttendanceRoot>
                    <AttendanceManualTab />
                  </AttendanceRoot>,
                  'attendance.write',
                ),
              },
              {
                path: 'leave',
                element: (
                  <RequirePermission anyOf={['leave.view', 'self.request.leave']}>
                    <LeaveOverviewPage />
                  </RequirePermission>
                ),
              },
              { path: 'leave/requests', element: guarded(<LeaveRequestsPage />, 'leave.view') },
              { path: 'leave/approvals', element: guarded(<LeaveApprovalsPage />, 'leave.approve') },
              {
                path: 'leave/balances',
                element: (
                  <RequirePermission anyOf={['leave.view', 'self.view']}>
                    <LeaveBalancesPage />
                  </RequirePermission>
                ),
              },
              { path: 'tasks', element: guarded(<TasksPage />, 'tasks.view') },
              { path: 'tasks/:taskId', element: guarded(<TaskDetailPage />, 'tasks.view') },
              { path: 'projects', element: guarded(<ProjectsPage />, 'projects.view') },
              { path: 'projects/:projectId', element: guarded(<ProjectDetailPage />, 'projects.view') },
              { path: 'recruitment/jobs', element: guarded(<RecruitmentJobsPage />, 'recruitment.view') },
              { path: 'recruitment/candidates', element: guarded(<RecruitmentCandidatesPage />, 'recruitment.view') },
              { path: 'recruitment/interviews', element: guarded(<RecruitmentInterviewsPage />, 'recruitment.view') },
              { path: 'payroll', element: guarded(<PayrollHomePage />, 'payroll.view') },
              { path: 'payroll/runs', element: guarded(<PayrollRunsPage />, 'payroll.view') },
              { path: 'payroll/runs/:runId', element: guarded(<PayrollRunDetailPage />, 'payroll.view') },
              { path: 'payroll/payslips', element: guarded(<PayrollPayslipsPage />, 'payroll.view') },
              { path: 'documents', element: guarded(<DocumentsPage />, 'documents.view') },
              { path: 'documents/:documentId', element: guarded(<DocumentDetailPage />, 'documents.view') },
              { path: 'reports', element: guarded(<ReportsHome />, 'reports.view') },
              { path: 'reports/employees', element: guarded(<EmployeeReportsPage />, 'reports.view') },
              { path: 'reports/attendance', element: guarded(<AttendanceReportsPage />, 'reports.view') },
              { path: 'reports/leave', element: guarded(<LeaveReportsPage />, 'reports.view') },
              { path: 'reports/payroll', element: guarded(<PayrollReportsPage />, 'payroll.view') },
              { path: 'settings', element: <Navigate to="/settings/users" replace /> },
              { path: 'settings/company', element: guarded(<CompanySettingsPage />, 'settings.company') },
              { path: 'settings/users', element: guarded(<UsersSettingsPage />, 'settings.users') },
              { path: 'settings/roles', element: guarded(<RolesSettingsPage />, 'settings.roles') },
              { path: 'settings/permissions', element: guarded(<PermissionsSettingsPage />, 'settings.permissions') },
              { path: 'settings/audit-logs', element: guarded(<AuditLogsPage />, 'settings.audit') },
              { path: 'my/profile', element: guarded(<MyProfilePage />, 'self.view') },
              { path: 'my/attendance', element: guarded(<MyAttendancePage />, 'self.view') },
              { path: 'my/leave', element: guarded(<MyLeavePage />, 'self.view') },
              { path: 'my/tasks', element: guarded(<MyTasksPage />, 'self.view') },
              { path: 'my/documents', element: guarded(<MyDocumentsPage />, 'self.view') },
              { path: 'my/payslips', element: guarded(<MyPayslipsPage />, 'self.view') },
              { path: 'help', element: guarded(<HelpSupportPage />, 'self.view') },
              { path: 'unauthorized', element: <UnauthorizedPage /> },
            ],
          },
        ],
      },
      { path: '', element: <Navigate to="/dashboard" replace /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

function RoleDashboardSwitch() {
  const { session } = useAuth()
  if (!session) return null
  return session.role === 'EMPLOYEE' ? <EmployeeDashboard /> : <AdminDashboard />
}
