# Zero Infinity HRMS — Route Inventory

All routes are defined in `src/app/router.tsx` and protected by `RequireAuth` and `RequirePermission` from `src/app/guards.tsx`.

## 1. Authentication (Public)
| Route | Component | Source File | Guard | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | `src/pages/auth/AuthPages.tsx` | Public | Complete |
| `/forgot-password` | `ForgotPasswordPage` | `src/pages/auth/AuthPages.tsx` | Public | Complete |
| `/reset-password` | `ResetPasswordPage` | `src/pages/auth/AuthPages.tsx` | Public | Complete |

## 2. Dashboard
| Route | Component | Source File | Guard | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/dashboard` | `RoleDashboardSwitch` (`AdminDashboardPage` / `EmployeeDashboardPage`) | `src/pages/admin/dashboard/AdminDashboardPage.tsx`, `src/pages/employee/dashboard/EmployeeDashboardPage.tsx` | `RequireAuth` | Complete |

## 3. Employees
| Route | Component | Source File | Guard | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/employees` | `EmployeeDirectoryPage` | `src/pages/admin/employees/EmployeeDirectoryPage.tsx` | `directory.view` | Complete |
| `/employees/new` | `EmployeeFormPage` (`mode="create"`) | `src/pages/admin/employees/EmployeeFormPage.tsx` | `employees.create` | Complete |
| `/employees/:employeeId` | `EmployeeDetailPage` | `src/pages/admin/employees/EmployeeDetailPage.tsx` | `directory.view` | Complete |
| `/employees/:employeeId/edit` | `EmployeeFormPage` (`mode="edit"`) | `src/pages/admin/employees/EmployeeFormPage.tsx` | `employees.edit` | Complete |

## 4. Attendance
| Route | Component | Source File | Guard | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/attendance` | `AttendanceRoot` + `AttendanceDashboardTab` | `src/pages/admin/attendance/DashboardTab.tsx` | `attendance.view` | Complete |
| `/attendance/records` | `AttendanceRoot` + `AttendanceRecordsTab` | `src/pages/admin/attendance/RecordsTab.tsx` | `attendance.view` | Complete |
| `/attendance/calendar` | `AttendanceRoot` + `AttendanceCalendarTab` | `src/pages/admin/attendance/CalendarTab.tsx` | `attendance.view` | Complete |
| `/attendance/reports` | `AttendanceRoot` + `AttendanceReportsTab` | `src/pages/admin/attendance/ReportsTab.tsx` | `attendance.reports` | Complete |
| `/attendance/corrections` | `AttendanceRoot` + `AttendanceManualTab` | `src/pages/admin/attendance/ManualTab.tsx` | `attendance.write` | Complete |

## 5. Leave
| Route | Component | Source File | Guard | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/leave` | `LeaveOverviewPage` | `src/pages/admin/leave/LeaveOverviewPage.tsx` | `anyOf: ['leave.view', 'self.request.leave']` | Complete |
| `/leave/requests` | `LeaveRequestsPage` | `src/pages/admin/leave/LeaveRequestsPage.tsx` | `leave.view` | Complete |
| `/leave/approvals` | `LeaveApprovalsPage` | `src/pages/admin/leave/LeaveApprovalsPage.tsx` | `leave.approve` | Complete |
| `/leave/balances` | `LeaveBalancesPage` | `src/pages/admin/leave/LeaveBalancesPage.tsx` | `anyOf: ['leave.view', 'self.view']` | Complete |

## 6. Tasks & Projects
| Route | Component | Source File | Guard | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/tasks` | `TasksPage` | `src/pages/admin/tasks/TasksPage.tsx` | `tasks.view` | Complete |
| `/tasks/:taskId` | `TaskDetailPage` | `src/pages/admin/tasks/TaskDetailPage.tsx` | `tasks.view` | Complete |
| `/projects` | `ProjectsPage` | `src/pages/admin/projects/ProjectsPage.tsx` | `projects.view` | Complete |
| `/projects/:projectId` | `ProjectDetailPage` | `src/pages/admin/projects/ProjectDetailPage.tsx` | `projects.view` | Complete |

## 7. Recruitment
| Route | Component | Source File | Guard | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/recruitment/jobs` | `RecruitmentJobsPage` | `src/pages/admin/recruitment/RecruitmentJobsPage.tsx` | `recruitment.view` | Complete |
| `/recruitment/candidates` | `RecruitmentCandidatesPage` | `src/pages/admin/recruitment/RecruitmentCandidatesPage.tsx` | `recruitment.view` | Complete |
| `/recruitment/interviews` | `RecruitmentInterviewsPage` | `src/pages/admin/recruitment/RecruitmentInterviewsPage.tsx` | `recruitment.view` | Complete |

## 8. Payroll
| Route | Component | Source File | Guard | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/payroll` | `PayrollHomePage` | `src/pages/admin/payroll/PayrollHomePage.tsx` | `payroll.view` | Complete |
| `/payroll/runs` | `PayrollRunsPage` | `src/pages/admin/payroll/PayrollRunsPage.tsx` | `payroll.view` | Complete |
| `/payroll/runs/:runId` | `PayrollRunDetailPage` | `src/pages/admin/payroll/PayrollRunDetailPage.tsx` | `payroll.view` | Complete |
| `/payroll/payslips` | `PayrollPayslipsPage` | `src/pages/admin/payroll/PayrollPayslipsPage.tsx` | `payroll.view` | Complete |

## 9. Documents & Reports
| Route | Component | Source File | Guard | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/documents` | `DocumentsPage` | `src/pages/admin/documents/DocumentsPage.tsx` | `documents.view` | Complete |
| `/documents/:documentId` | `DocumentDetailPage` | `src/pages/admin/documents/DocumentDetailPage.tsx` | `documents.view` | Complete |
| `/reports` | `ReportsHome` | `src/pages/admin/reports/ReportsHome.tsx` | `reports.view` | Complete |
| `/reports/employees` | `EmployeeReportsPage` | `src/pages/admin/reports/EmployeeReportsPage.tsx` | `reports.view` | Complete |
| `/reports/attendance` | `AttendanceReportsPage` | `src/pages/admin/reports/AttendanceReportsPage.tsx` | `reports.view` | Complete |
| `/reports/leave` | `LeaveReportsPage` | `src/pages/admin/reports/LeaveReportsPage.tsx` | `reports.view` | Complete |
| `/reports/payroll` | `PayrollReportsPage` | `src/pages/admin/reports/PayrollReportsPage.tsx` | `reports.view` | Complete |

## 10. Settings
| Route | Component | Source File | Guard | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/settings/company` | `CompanySettingsPage` | `src/pages/admin/settings/CompanySettingsPage.tsx` | `settings.company` | Complete |
| `/settings/users` | `UsersSettingsPage` | `src/pages/admin/settings/UsersSettingsPage.tsx` | `settings.users` | Complete |
| `/settings/roles` | `RolesSettingsPage` | `src/pages/admin/settings/RolesSettingsPage.tsx` | `settings.roles` | Complete |
| `/settings/permissions` | `PermissionsSettingsPage` | `src/pages/admin/settings/PermissionsSettingsPage.tsx` | `settings.permissions` | Complete |
| `/settings/audit-logs` | `AuditLogsPage` | `src/pages/admin/settings/AuditLogsPage.tsx` | `settings.audit` | Complete |

## 11. Employee Self-Service & System Pages
| Route | Component | Source File | Guard | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/my/profile` | `MyProfilePage` | `src/pages/employee/profile/MyProfilePage.tsx` | `self.view` | Complete |
| `/my/attendance` | `MyAttendancePage` | `src/pages/employee/attendance/MyAttendancePage.tsx` | `self.view` | Complete |
| `/my/leave` | `MyLeavePage` | `src/pages/employee/leave/MyLeavePage.tsx` | `self.view` | Complete |
| `/my/tasks` | `MyTasksPage` | `src/pages/employee/tasks/MyTasksPage.tsx` | `self.view` | Complete |
| `/my/documents` | `MyDocumentsPage` | `src/pages/employee/documents/MyDocumentsPage.tsx` | `self.view` | Complete |
| `/my/payslips` | `MyPayslipsPage` | `src/pages/employee/payslips/MyPayslipsPage.tsx` | `self.view` | Complete |
| `/help` | `HelpSupportPage` | `src/pages/shared/HelpSupportPage.tsx` | `self.view` | Complete |
| `/unauthorized` | `UnauthorizedPage` | `src/pages/shared/error-pages.tsx` | `RequireAuth` | Complete |
| `*` | `NotFoundPage` | `src/pages/shared/error-pages.tsx` | Public | Complete |
