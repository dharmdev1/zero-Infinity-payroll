import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth, RequirePermission } from './guards'

import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '@/features/auth/AuthPages'
import { AdminDashboard, EmployeeDashboard } from '@/features/dashboard'
import NotFoundPage, { ErrorBoundaryPage } from '@/features/misc/error-pages'

import { EmployeesPage, EmployeeDetailPage, EmployeeFormPage } from '@/features/employees/pages'
import { AttendanceRoot, AttendanceDashboardTab, AttendanceRecordsTab, AttendanceCalendarTab, AttendanceManualTab, AttendanceReportsTab } from '@/features/attendance'
import { LeaveOverviewPage, LeaveRequestsPage, LeaveApprovalsPage, LeaveBalancesPage } from '@/features/leave/pages'
import { TasksPage, TaskDetailPage, ProjectsPage, ProjectDetailPage } from '@/features/tasks/pages'
import { RecruitmentJobsPage, RecruitmentCandidatesPage, RecruitmentInterviewsPage } from '@/features/recruitment/pages'
import { PayrollHomePage, PayrollRunsPage, PayrollRunDetailPage, PayrollPayslipsPage } from '@/features/payroll/pages'
import { DocumentsPage, DocumentDetailPage } from '@/features/documents/pages'
import { ReportsHome, EmployeeReportsPage, AttendanceReportsPage, LeaveReportsPage, PayrollReportsPage } from '@/features/reports/pages'
import { CompanySettingsPage, UsersSettingsPage, RolesSettingsPage, PermissionsSettingsPage, AuditLogsPage } from '@/features/settings/pages'
import { MyProfilePage, MyAttendancePage, MyLeavePage, MyTasksPage, MyDocumentsPage, MyPayslipsPage, HelpSupportPage } from '@/features/self/pages'
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
                element: (
                  <AttendanceRoot>
                    <AttendanceDashboardTab />
                  </AttendanceRoot>
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
              { path: 'attendance/corrections', element: <Navigate to="/attendance?tab=manual" replace /> },
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
              { path: 'leave/balances', element: guarded(<LeaveBalancesPage />, 'leave.view') },
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
              { path: 'reports', element: <ReportsHome /> },
              { path: 'reports/employees', element: guarded(<EmployeeReportsPage />, 'reports.view') },
              { path: 'reports/attendance', element: guarded(<AttendanceReportsPage />, 'reports.view') },
              { path: 'reports/leave', element: guarded(<LeaveReportsPage />, 'reports.view') },
              { path: 'reports/payroll', element: guarded(<PayrollReportsPage />, 'reports.view') },
              { path: 'settings/company', element: guarded(<CompanySettingsPage />, 'settings.company') },
              { path: 'settings/users', element: guarded(<UsersSettingsPage />, 'settings.users') },
              { path: 'settings/roles', element: guarded(<RolesSettingsPage />, 'settings.roles') },
              { path: 'settings/permissions', element: guarded(<PermissionsSettingsPage />, 'settings.permissions') },
              { path: 'settings/audit-logs', element: guarded(<AuditLogsPage />, 'settings.audit') },
              { path: 'my/profile', element: <MyProfilePage /> },
              { path: 'my/attendance', element: <MyAttendancePage /> },
              { path: 'my/leave', element: <MyLeavePage /> },
              { path: 'my/tasks', element: <MyTasksPage /> },
              { path: 'my/documents', element: <MyDocumentsPage /> },
              { path: 'my/payslips', element: <MyPayslipsPage /> },
              { path: 'help', element: <HelpSupportPage /> },
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
