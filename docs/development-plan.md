# Zero Infinity HRMS — Frontend Development & Refactoring Plan

## 1. Architecture & Target Folder Structure (`src/`)
- **Framework**: React 18 + TypeScript 5 + Vite 5 + React Router 6 + TanStack Query 5 + React Hook Form 7 + Zod + Tailwind CSS 3.4.
- **Directory Layout**:
  - `src/app/` — Application routing (`router.tsx`), providers (`providers.tsx`), route guards (`guards.tsx`), and authentication context (`auth-context.tsx`).
  - `src/pages/auth/` — Authentication screens (`LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`).
  - `src/pages/admin/` — Admin & HR pages (`dashboard/`, `employees/`, `attendance/`, `leave/`, `recruitment/`, `payroll/`, `tasks/`, `projects/`, `documents/`, `reports/`, `settings/`).
  - `src/pages/employee/` — Employee self-service pages (`dashboard/`, `profile/`, `attendance/`, `leave/`, `tasks/`, `documents/`, `payslips/`).
  - `src/pages/shared/` — Shared utility pages (`HelpSupportPage.tsx`, `error-pages.tsx`).
  - `src/modules/` — Reusable domain modules, sub-navigation bars, schemas, dialogs, tabs, and formatters (`attendance/`, `employees/`, `leave/`, `payroll/`, `recruitment/`, `tasks/`, `projects/`, `documents/`, `reports/`, `settings/`).
  - `src/components/` — Reusable UI primitives (`ui/`, `forms/`, `layout/`, `data-display/`, `feedback/`).
  - `src/services/` — Typed API client (`api/client.ts`), domain services, and isolated development seed store (`demo/`).
  - `src/types/` — Domain types (`domain.ts`) and RBAC matrix (`rbac.ts`).
  - `src/utils/` — Nepal Time (`npt.ts`), NPR paisa formatting (`npr.ts`), class helper (`cn.ts`), and backend notice pub/sub (`backend-ops.tsx`).
- **Nepal-First Conventions**:
  - Timezone: `Asia/Kathmandu` (`UTC+05:45`, NPT).
  - Workweek: Monday–Friday (`09:30–17:30`).
  - Currency: Nepalese Rupee (`NPR`), integer paisa arithmetic.
- **RBAC**:
  - Three roles (`SUPER_ADMIN`, `HR_ADMIN`, `EMPLOYEE`) with centralized permissions in `src/types/rbac.ts`.

## 2. Completed Milestones
- [x] Normalized project structure at workspace root (`/`) running on port 3000.
- [x] Reorganized `src/features/*` into `src/pages/{auth,admin,employee,shared}` and `src/modules/*`.
- [x] Extracted accessible form primitives into `src/components/forms/index.tsx` with `React.forwardRef` support for React Hook Form.
- [x] Decomposed `AdminDashboardPage` (`src/pages/admin/dashboard/`) into focused subcomponents (`DashboardHeader`, `SummaryCards`, `AttendanceOverview`, `DashboardCharts`, `TasksDeadlinesTable`, `RecentActivities`) and `useAdminDashboard` hook with role-aware `SUPER_ADMIN` vs `HR_ADMIN` views.
- [x] Decomposed `EmployeeDashboardPage` (`src/pages/employee/dashboard/`) into focused subcomponents (`WelcomeHeader`, `SummaryCards`, `AttendanceCard`, `MyWeekCard`, `MyTasks`, `LeaveBalanceCard`) and `useEmployeeDashboard` hook.
- [x] Verified strict file-length compliance across all source files (every file is well under 400 lines; 0 files exceed 500 or 600 lines).
- [x] Verified TypeScript (`tsc -b`), Vitest test suites, and Vite production build (`npm run build`).
