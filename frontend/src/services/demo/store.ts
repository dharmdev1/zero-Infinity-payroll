/**
 * Demo store — DEVELOPMENT ONLY.
 *
 * In-memory snapshot modelled on the "Company HRMS — Product Design" frames.
 * Mutations live only in the current page session (never persisted) and every
 * demo action is labelled in the UI. When the real FastAPI backend lands, the
 * API-mode services replace these adapters with zero page changes.
 */
import type {
  Announcement, AuditLogEntry, Candidate, CompanyDocument, Employee, Interview, JobPosting, LeaveRequest,
  OrgUser, PayrollRun, Payslip, Project, SessionUser, WorkTask,
} from '../../types/domain'
import { AUDIT_LOGS as AUDIT_SEED, DEMO_SESSIONS, ORG_USERS as USERS_SEED } from './admin.fixture'
import { buildAttendanceRecords, ELAPSED_OCT_WORKDAYS } from './attendance.fixture'
import { DEMO_TODAY, buildEmployees } from './employees.fixture'
import { ANNOUNCEMENTS, CANDIDATES as CANDIDATES_SEED, COMPANY_DOCUMENTS as DOCS_SEED, INTERVIEWS as INTERVIEWS_SEED, JOBS as JOBS_SEED, LEAVE_REQUESTS as LEAVE_SEED, PROJECTS as PROJECTS_SEED, TASKS as TASKS_SEED } from './planning.fixture'
import { PAYROLL_RUNS, buildPayslips } from './payroll.fixture'

function clone<T>(value: T): T {
  return structuredClone(value)
}

export const db = {
  today: DEMO_TODAY,
  employees: buildEmployees() as Employee[],
  attendance: buildAttendanceRecords(),
  leaveRequests: clone(LEAVE_SEED) as LeaveRequest[],
  tasks: clone(TASKS_SEED) as WorkTask[],
  projects: clone(PROJECTS_SEED) as Project[],
  jobs: clone(JOBS_SEED) as JobPosting[],
  candidates: clone(CANDIDATES_SEED) as Candidate[],
  interviews: clone(INTERVIEWS_SEED) as Interview[],
  payrollRuns: clone(PAYROLL_RUNS) as PayrollRun[],
  payslips: buildPayslips() as Payslip[],
  documents: clone(DOCS_SEED) as CompanyDocument[],
  users: clone(USERS_SEED) as OrgUser[],
  auditLogs: clone(AUDIT_SEED) as AuditLogEntry[],
  announcements: clone(ANNOUNCEMENTS) as Announcement[],
  demoSessions: clone(DEMO_SESSIONS) as SessionUser[],
}

/** Reset everything to the fixture snapshot (used by tests). */
export function resetDemoDb(): void {
  db.employees = buildEmployees()
  db.attendance = buildAttendanceRecords()
  db.leaveRequests = clone(LEAVE_SEED)
  db.tasks = clone(TASKS_SEED)
  db.projects = clone(PROJECTS_SEED)
  db.jobs = clone(JOBS_SEED)
  db.candidates = clone(CANDIDATES_SEED)
  db.interviews = clone(INTERVIEWS_SEED)
  db.payrollRuns = clone(PAYROLL_RUNS)
  db.payslips = buildPayslips()
  db.documents = clone(DOCS_SEED)
  db.users = clone(USERS_SEED)
  db.auditLogs = clone(AUDIT_SEED)
  db.announcements = clone(ANNOUNCEMENTS)
}

export { ELAPSED_OCT_WORKDAYS, DEMO_TODAY, DEMO_SESSIONS }
